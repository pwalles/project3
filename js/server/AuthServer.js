/**
 * @file AuthServer.js
 * @description Server responsible for user registration and login
 */
class AuthServer {

    /**
     * @constructor
     * @param {Network}  network  - Shared Network instance for sending responses
     * @param {UsersDB}  usersDB  - UsersDB instance for all user data access
     */
    constructor(network, usersDB) {
        this.network  = network;
        this.usersDB  = usersDB;

        /**
         * Active session tokens.
         * Maps token string → userId string.
         * @type {Object.<string, string>}
         */
        this.activeSessions = {};
    }


    //  ENTRY POINT — called by Network

    /**
     * Entry point: called by the Network when a message arrives.
     * Parses the body and routes to the correct handler.
     * @param {Object} message - Incoming message from the Network
     */
    receive(message) {
        console.log("[AuthServer] Received:", message.method, message.resource);

        const body     = message.body ? JSON.parse(message.body) : {};
        const method   = message.method;
        const resource = message.resource;

        if (method === "POST" && resource === "/auth/register") {
            this._handleRegister(message, body);

        } else if (method === "POST" && resource === "/auth/login") {
            this._handleLogin(message, body);

        } else {
            this._respond(message, 404, { error: "Route not found" });
        }
    }


    // ROUTE HANDLERS

    /**
     * Handles POST /auth/register
     * Validates fields → checks uniqueness → creates user.
     * @param {Object} message
     * @param {Object} body - { username, password, email }
     * @private
     */
    _handleRegister(message, body) {
        const username = body.username;
        const password = body.password;
        const email    = body.email;

        // Field presence check 
        if (!username || !password || !email) {
            return this._respond(message, 400, {
                error: "All fields are required: username, password, email"
            });
        }

        // Field length / format checks 
        if (username.length < 3) {
            return this._respond(message, 400, {
                error: "Username must be at least 3 characters"
            });
        }
        if (password.length < 4) {
            return this._respond(message, 400, {
                error: "Password must be at least 4 characters"
            });
        }
        if (!email.includes("@")) {
            return this._respond(message, 400, {
                error: "Invalid email address"
            });
        }

        // Duplicate username check 
        if (this.usersDB.isUsernameTaken(username)) {
            return this._respond(message, 409, {
                error: "Username is already taken"
            });
        }

        // Create user
        const newUser = this.usersDB.addUser({ username, password, email });
        console.log("[AuthServer] Registered new user:", newUser.username);

        this._respond(message, 201, {
            success:  true,
            userId:   newUser.id,
            username: newUser.username
        });
    }

    /**
     * Handles POST /auth/login
     * Validates credentials → generates token → returns session data.
     * @param {Object} message
     * @param {Object} body - { username, password }
     * @private
     */
    _handleLogin(message, body) {
        const username = body.username;
        const password = body.password;

        // Field presence check
        if (!username || !password) {
            return this._respond(message, 400, {
                error: "Username and password are required"
            });
        }

        // Credential check
        const user = this.usersDB.getUserByUsername(username);
        if (!user || user.password !== password) {
            return this._respond(message, 401, {
                error: "Invalid username or password"
            });
        }

        // Generate session token 
        const token = this._generateToken(user.id);
        this.activeSessions[token] = user.id;
        console.log("[AuthServer] Login success:", username);

        this._respond(message, 200, {
            success:  true,
            token:    token,
            userId:   user.id,
            username: user.username
        });
    }


    // PUBLIC — used by DataServer

    /**
     * Validates a session token and returns the associated userId.
     * Called by DataServer to authorize incoming requests.
     * @param {string} token
     * @returns {string|null} userId if token is valid, null otherwise
     */
    validateToken(token) {
        return this.activeSessions[token] || null;
    }

    /**
     * Invalidates a session token (logout).
     * @param {string} token
     */
    invalidateToken(token) {
        delete this.activeSessions[token];
    }
    

    //  PRIVATE HELPERS


    /**
     * Sends a JSON response back to the original sender via the Network.
     * @param {Object} originalMessage - The request message being responded to
     * @param {number} status          - HTTP-style status code
     * @param {Object} payload         - Response data object
     * @private
     */
    _respond(originalMessage, status, payload) {
        this.network.send({
            to:        originalMessage.from,
            from:      "auth-server",
            requestId: originalMessage.requestId,
            status:    status,
            body:      JSON.stringify(payload)
        });
    }

    /**
     * Generates a unique session token.
     * @param {string} userId
     * @returns {string}
     * @private
     */
    _generateToken(userId) {
        return "tok_" + userId + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
}