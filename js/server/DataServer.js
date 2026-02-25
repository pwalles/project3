class DataServer {
    constructor(network, dataDB, authServer) {
        this.network    = network;
        this.dataDB     = dataDB;
        this.authServer = authServer;
        this.responsesCache = new Map();
    }

    receive(message) {
        if (this.responsesCache.has(message.requestId)) {
            const cached = this.responsesCache.get(message.requestId);
            console.warn("[DataServer] Returning CACHED response:", message.requestId);
            return this._respond(message, cached.status, cached.payload);
        }

        const token  = message.headers && message.headers["Authorization"];
        const userId = this.authServer.validateToken(token);

        if (!userId) {
            return this._respond(message, 401, { error: "Unauthorized" });
        }

        const [path, queryString] = message.resource.split("?");
        const parts = path.split("/").filter(Boolean); 
        const id    = parts[2] || null;
        const body  = message.body ? JSON.parse(message.body) : {};
        const method = message.method;

        if      (method === "GET"    && !id) this._handleGetAll(message, userId);
        else if (method === "GET"    &&  id) this._handleGetById(message, userId, id);
        else if (method === "POST"   && !id) this._handleCreate(message, userId, body);
        else if (method === "PUT"    &&  id) this._handleUpdate(message, userId, id, body);
        else if (method === "DELETE" &&  id) this._handleDelete(message, userId, id);
        else this._respond(message, 404, { error: "Route not found" });
    }

    _handleCreate(message, userId, body) {
        if (!body.name || body.name.trim() === "") {
            return this._respond(message, 400, { error: "Contact name is required" });
        }

        const newContact = this.dataDB.add(userId, body);
        this._respond(message, 201, { success: true, data: newContact });
    }

    _handleUpdate(message, userId, id, body) {
        const contact = this.dataDB.getById(id);

        if (!contact) {
            return this._respond(message, 404, { error: "Contact not found" });
        }
        if (contact.userId !== userId) {
            return this._respond(message, 403, { error: "Access denied" });
        }

        const updated = this.dataDB.update(id, body);
        this._respond(message, 200, { success: true, data: updated });
    }

    _handleDelete(message, userId, id) {
        const contact = this.dataDB.getById(id);

        if (!contact) {
            return this._respond(message, 404, { error: "Contact not found" });
        }
        if (contact.userId !== userId) {
            return this._respond(message, 403, { error: "Access denied" });
        }

        this.dataDB.delete(id);
        this._respond(message, 200, { success: true, message: "Contact deleted" });
    }

    _handleGetAll(message, userId) {
        const contacts = this.dataDB.getAllByUser(userId);
        this._respond(message, 200, {
            success: true,
            data:    contacts,
            count:   contacts.length
        });
    }

    _handleGetById(message, userId, id) {
        const contact = this.dataDB.getById(id);
        if (!contact) return this._respond(message, 404, { error: "Not found" });
        if (contact.userId !== userId) return this._respond(message, 403, { error: "Denied" });
        this._respond(message, 200, { success: true, data: contact });
    }

    _handleSearch(message, userId, query) {
        const results = this.dataDB.search(userId, query);
        this._respond(message, 200, {
            success: true,
            data:    results,
            count:   results.length
        });
    }

    _respond(originalMessage, status, payload) {
        if (["POST", "PUT", "DELETE"].includes(originalMessage.method) && status >= 200 && status < 300) {
            this.responsesCache.set(originalMessage.requestId, { status, payload });            
            setTimeout(() => this.responsesCache.delete(originalMessage.requestId), 300000);
        }

        this.network.send({
            to:        originalMessage.from,
            from:      "data-server",
            requestId: originalMessage.requestId,
            status:    status,
            body:      JSON.stringify(payload)
        });
    }
}