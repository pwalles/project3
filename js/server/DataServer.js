
/* A server class that handles the application's data (contacts), 
but only after verifying that the user is logged in and has permission. 
*/

class DataServer {
    constructor(network, dataDB, authServer) {
        this.network    = network;
        this.dataDB     = dataDB;
        // Saves the authentication server to check if a user's token is valid.
        this.authServer = authServer;
        // Cache to store recent responses for identical requests.
        this.responsesCache = new Map();
    }

    // Every request that comes to this data server goes in here.
    receive(message) {
        if (this.responsesCache.has(message.requestId)) {
            const cached = this.responsesCache.get(message.requestId);
            console.warn("[DataServer] Returning CACHED response:", message.requestId);
            return this._respond(message, cached.status, cached.payload);
        }

        // Takes the token from the request headers.
        const token  = message.headers && message.headers["Authorization"];
        // The server returns userId if the token is valid, null if not.
        const userId = this.authServer.validateToken(token);

      
        /* The client sent a request without a valid token, 
        so the server responds with an error. */
        if (!userId) {
            return this._respond(message, 401, { error: "Unauthorized" });
        }


        /* The server checks the method and resource of the request to determine
        which operation the client wants to perform (e.g., get all contacts,
        get a contact by ID, create a new contact, update a contact, delete a contact, 
        or search contacts).
        Then it calls the appropriate handler function to process the request. */
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

    /* The following handler functions implement the logic for each type of request,
    including permission checks and interactions with the dataDB.*/

    // Creates a new contact in the database for the authenticated user.
    _handleCreate(message, userId, body) {
        // Validates the input data (checks if the contact name is provided).
        if (!body.name || body.name.trim() === "") {
            return this._respond(message, 400, { error: "Contact name is required" });
        }

        // Creates a new contact object with the provided data and ID,
        // saves it to the db and returns the contact in the response.
        const newContact = this.dataDB.add(userId, body);
        this._respond(message, 201, { success: true, data: newContact });
    }

    // Updates an existing contact in the database after checking permissions.
    _handleUpdate(message, userId, id, body) {
        const contact = this.dataDB.getById(id);

        // Checks if the contact exists and belongs to the user.
        if (!contact) {
            return this._respond(message, 404, { error: "Contact not found" });
        }
        if (contact.userId !== userId) {
            return this._respond(message, 403, { error: "Access denied" });
        }

        // Validates the input data (if the name field is being updated, it cannot be empty).
        if (body.name && body.name.trim() === "") {
            return this._respond(message, 400, { error: "Contact name cannot be empty" });
        }

        // Updates the contact with the new data,
        // saves it to the db and returns the updated contact.
        const updated = this.dataDB.update(id, body);
        this._respond(message, 200, { success: true, data: updated });
    }

    // Deletes a contact from the database after checking permissions.
    _handleDelete(message, userId, id) {
        const contact = this.dataDB.getById(id);

        // Checks if the contact exists and belongs to the user.
        if (!contact) {
            return this._respond(message, 404, { error: "Contact not found" });
        }
        if (contact.userId !== userId) {
            return this._respond(message, 403, { error: "Access denied" });
        }

        this.dataDB.delete(id);
        this._respond(message, 200, { success: true, message: "Contact deleted" });
    }

    // Fetch all the user's contacts from the DB.
    _handleGetAll(message, userId) {
        const contacts = this.dataDB.getAllByUser(userId);
        this._respond(message, 200, {
            success: true,
            data:    contacts,
            count:   contacts.length
        });
    }

    // Fetch a specific contact by ID after checking permissions.
    _handleGetById(message, userId, id) {
        const contact = this.dataDB.getById(id);
        if (!contact) return this._respond(message, 404, { error: "Not found" });
        if (contact.userId !== userId) return this._respond(message, 403, { error: "Denied" });
        this._respond(message, 200, { success: true, data: contact });
    }

    // Search contacts based on a query string after checking permissions.
    _handleSearch(message, userId, query) {
        const results = this.dataDB.search(userId, query);
        this._respond(message, 200, {
            success: true,
            data:    results,
            count:   results.length
        });
    }

    // Send responses back to the client and cache them for identical future requests.
    _respond(originalMessage, status, payload) {
        // Caches successful POST, PUT, DELETE responses to optimize for identical requests.
        // Only operations that successfully changed information will be cached.
        if (["POST", "PUT", "DELETE"].includes(originalMessage.method) && status >= 200 && status < 300) {
            this.responsesCache.set(originalMessage.requestId, { status, payload });     
            // Cached responses are cleared after 5 minutes to prevent memory leaks.
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