/* A server class that handles the application's data (contacts), 
but only after verifying that the user is logged in and has permission. 
*/

class DataServer {

    constructor(network, dataDB, authServer) {
        this.network        = network;
        this.dataDB         = dataDB;
        // Saves the authentication server to check if a user's token is valid.
        this.authServer     = authServer;
        // Cache to store recent responses for identical requests.
        // If the same requestId arrives again (due to a retry), the server
        // returns the cached response instead of processing the request again.
        this.responsesCache = {};
    }

    /* Every request that arrives at this server goes through here.
    It checks the cache, validates the token, parses the URL,
    and routes the request to the appropriate handler. */
    receive(message) {
        // If this requestId was already processed, return the cached response.
        // This prevents duplicate operations when the client retries after a timeout.
        if (this.responsesCache[message.requestId]) {
            var cached = this.responsesCache[message.requestId];
            console.warn("[DataServer] Returning CACHED response:", message.requestId);
            return this._respond(message, cached.status, cached.payload);
        }

        // Takes the token from the request headers.
        var token  = message.headers && message.headers["Authorization"];
        // The server returns userId if the token is valid, null if not.
        var userId = this.authServer.validateToken(token);

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
        var parts       = message.resource.split("?");
        var path        = parts[0];
        var queryString = parts[1] || null;
        var pathParts   = path.split("/").filter(Boolean);
        var id          = pathParts[2] || null;
        var body        = message.body ? JSON.parse(message.body) : {};
        var method      = message.method;

        // Extract search query from the query string if present (e.g. "search=john")
        var searchQuery = null;
        if (queryString && queryString.indexOf("search=") === 0) {
            searchQuery = decodeURIComponent(queryString.replace("search=", ""));
        }

        // Route the request to the correct handler based on method, id, and query
        if      (method === "GET"    && !id && searchQuery) this._handleSearch(message, userId, searchQuery);
        else if (method === "GET"    && !id)                this._handleGetAll(message, userId);
        else if (method === "GET"    &&  id)                this._handleGetById(message, userId, id);
        else if (method === "POST"   && !id)                this._handleCreate(message, userId, body);
        else if (method === "PUT"    &&  id)                this._handleUpdate(message, userId, id, body);
        else if (method === "DELETE" &&  id)                this._handleDelete(message, userId, id);
        else this._respond(message, 404, { error: "Route not found" });
    }

    /* The following handler functions implement the logic for each type of request,
    including permission checks and interactions with the dataDB. */

    // Creates a new contact in the database for the authenticated user.
    _handleCreate(message, userId, body) {
        // Validates the input data (checks if the contact name is provided).
        if (!body.name || body.name.trim() === "") {
            return this._respond(message, 400, { error: "Contact name is required" });
        }

        // Creates a new contact object with the provided data and ID,
        // saves it to the db and returns the contact in the response.
        var newContact = this.dataDB.add(userId, body);
        this._respond(message, 201, { success: true, data: newContact });
    }

    // Updates an existing contact in the database after checking permissions.
    _handleUpdate(message, userId, id, body) {
        var contact = this.dataDB.getById(id);

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
        var updated = this.dataDB.update(id, body);
        this._respond(message, 200, { success: true, data: updated });
    }

    // Deletes a contact from the database after checking permissions.
    _handleDelete(message, userId, id) {
        var contact = this.dataDB.getById(id);

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
        var contacts = this.dataDB.getAllByUser(userId);
        this._respond(message, 200, {
            success: true,
            data:    contacts,
            count:   contacts.length
        });
    }

    // Fetch a specific contact by ID after checking permissions.
    _handleGetById(message, userId, id) {
        var contact = this.dataDB.getById(id);
        if (!contact) return this._respond(message, 404, { error: "Not found" });
        if (contact.userId !== userId) return this._respond(message, 403, { error: "Denied" });
        this._respond(message, 200, { success: true, data: contact });
    }

    // Search contacts by a text query and return all matching results.
    _handleSearch(message, userId, query) {
        var results = this.dataDB.search(userId, query);
        this._respond(message, 200, {
            success: true,
            data:    results,
            count:   results.length
        });
    }

    /* Sends a response back to the client via the network.
    Also caches successful POST, PUT, and DELETE responses so that
    if the same request arrives again (retry with same requestId),
    the server returns the cached result instead of repeating the operation. */
    _respond(originalMessage, status, payload) {
        // Cache successful write operations (POST, PUT, DELETE) to handle retries.
        // Cached responses are cleared after 5 minutes to prevent memory leaks.
        var self   = this;
        var method = originalMessage.method;
        if ((method === "POST" || method === "PUT" || method === "DELETE") && status >= 200 && status < 300) {
            this.responsesCache[originalMessage.requestId] = { status: status, payload: payload };
            setTimeout(function() {
                delete self.responsesCache[originalMessage.requestId];
            }, 300000);
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