    /* 
     The AuthServer class is responsible for handling user authentication and
     registration. It interacts with a users database and manages active sessions.
     It also implements a caching mechanism to store recent responses
     for identical requests, improving performance and reducing redundant
     processing. The server communicates with clients through a network interface,
     simulating real-world conditions such as message delays and potential drops.
    */

class AuthServer {
    constructor(network, usersDB) {
        this.network = network;
        this.usersDB = usersDB;
        this.activeSessions = {};
        this.responsesCache = new Map(); // Cache to store recent responses for identical requests
    }

    /* Handles incoming messages from the network, processes authentication
    requests, and sends appropriate responses back to clients.*/
    receive(message) {
        // Check if the request has a cached response and return it if available
        if (this.responsesCache.has(message.requestId)) {
            const cached = this.responsesCache.get(message.requestId);
            console.warn("[AuthServer] Returning CACHED response for ID:", message.requestId);
            return this._respond(message, cached.status, cached.payload);
        }

        const body = message.body ? JSON.parse(message.body) : {};
        const method = message.method;
        const resource = message.resource;

        // Routing logic based on the method and resource of the incoming message
        if (method === "POST" && resource === "/auth/register") {
            this._handleRegister(message, body);
        } else if (method === "POST" && resource === "/auth/login") {
            this._handleLogin(message, body);
        } else {
            this._respond(message, 404, { error: "Route not found" });
        }
    }

    /* Handles user registration requests. It validates the input, checks for
    username availability, creates a new user, and sends a response back to the client.*/
    _handleRegister(message, body) {
        const { username, password, email } = body;
        if (!username || !password || !email) {
            return this._respond(message, 400, { error: "Missing fields" });
        }
        if (this.usersDB.isUsernameTaken(username)) {
            return this._respond(message, 409, { error: "Username taken" });
        }

        const newUser = this.usersDB.addUser({ username, password, email });
        this._respond(message, 201, { success: true, userId: newUser.id, username: newUser.username });
    }

    /* Handles user login requests. It validates the credentials,
     generates a session token, and sends a response back to the client with
    the token and user information.*/
    _handleLogin(message, body) {
        const { username, password } = body;
        const user = this.usersDB.getUserByUsername(username);
        
        if (!user || user.password !== password) {
            return this._respond(message, 401, { error: "Invalid credentials" });
        }

        const token = this._generateToken(user.id);
        this.activeSessions[token] = user.id;
        
        this._respond(message, 200, {
            success: true,
            token: token,
            userId: user.id,
            username: user.username
        });
    }

    // Validates a session token and returns the associated user ID if valid,
    //  or null if invalid.
    validateToken(token) {
        return this.activeSessions[token] || null;
    }

    // Invalidates a session token, effectively logging the user out by
    //  removing it from active sessions.
    invalidateToken(token) {
        delete this.activeSessions[token];
    }

    /* Internal method to send responses back to clients. It also implements
    caching for successful POST requests, storing the response in a cache with
    the request ID as the key. Cached responses are automatically cleared after 5 minutes.*/
    _respond(originalMessage, status, payload) {
        if (originalMessage.method === "POST" && status >= 200 && status < 300) {
            this.responsesCache.set(originalMessage.requestId, { status, payload });
            setTimeout(() => this.responsesCache.delete(originalMessage.requestId), 300000);
        }

        this.network.send({
            to: originalMessage.from,
            from: "auth-server",
            requestId: originalMessage.requestId,
            status: status,
            body: JSON.stringify(payload)
        });
    }

    /* Generates a session token for a user. The token is a string that includes
    the user ID, current timestamp, and a random component to ensure uniqueness.*/
    _generateToken(userId) {
        return "tok_" + userId + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
}