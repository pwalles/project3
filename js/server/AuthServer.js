class AuthServer {
    constructor(network, usersDB) {
        this.network = network;
        this.usersDB = usersDB;
        this.activeSessions = {};
        this.responsesCache = new Map();
    }

    receive(message) {
        if (this.responsesCache.has(message.requestId)) {
            const cached = this.responsesCache.get(message.requestId);
            console.warn("[AuthServer] Returning CACHED response for ID:", message.requestId);
            return this._respond(message, cached.status, cached.payload);
        }

        const body = message.body ? JSON.parse(message.body) : {};
        const method = message.method;
        const resource = message.resource;

        if (method === "POST" && resource === "/auth/register") {
            this._handleRegister(message, body);
        } else if (method === "POST" && resource === "/auth/login") {
            this._handleLogin(message, body);
        } else {
            this._respond(message, 404, { error: "Route not found" });
        }
    }

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

    validateToken(token) {
        return this.activeSessions[token] || null;
    }

    invalidateToken(token) {
        delete this.activeSessions[token];
    }

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

    _generateToken(userId) {
        return "tok_" + userId + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
}