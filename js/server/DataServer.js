/**
 * @file DataServer.js
 * @description Server responsible for all CRUD operations on contact data
 *   404 - Not Found
 */

class DataServer {

    /**
     * @constructor
     * @param {Network}     network     - Shared Network instance
     * @param {DataDB}      dataDB      - DataDB instance for contact data access
     * @param {AuthServer}  authServer  - AuthServer instance for token validation
     */
    constructor(network, dataDB, authServer) {
        this.network    = network;
        this.dataDB     = dataDB;
        this.authServer = authServer;
    }


    //  ENTRY POINT — called by Network


    /**
     * Entry point: called by the Network when a message arrives.
     * Authorizes the request first, then routes to the correct handler.
     * @param {Object} message - Incoming message from the Network
     */
    receive(message) {
        console.log("[DataServer] Received:", message.method, message.resource);

        // Authorization
        const token  = message.headers && message.headers["Authorization"];
        const userId = this.authServer.validateToken(token);

        if (!userId) {
            return this._respond(message, 401, {
                error: "Unauthorized: missing or invalid token"
            });
        }

        // Parse resource path and query string
        const [path, queryString] = message.resource.split("?");
        const parts = path.split("/").filter(Boolean); // ["data","contacts","id?"]
        const id    = parts[2] || null;

        const searchQuery = queryString
            ? decodeURIComponent(queryString.split("=")[1] || "")
            : null;

        const body   = message.body ? JSON.parse(message.body) : {};
        const method = message.method;

        // Route to handler
        if      (method === "GET"    && !id && searchQuery) this._handleSearch(message, userId, searchQuery);
        else if (method === "GET"    && !id)                this._handleGetAll(message, userId);
        else if (method === "GET"    &&  id)                this._handleGetById(message, userId, id);
        else if (method === "POST"   && !id)                this._handleCreate(message, userId, body);
        else if (method === "PUT"    &&  id)                this._handleUpdate(message, userId, id, body);
        else if (method === "DELETE" &&  id)                this._handleDelete(message, userId, id);
        else this._respond(message, 404, { error: "Route not found" });
    }


    //  ROUTE HANDLERS

    /**
     * GET /data/contacts
     * Returns all contacts belonging to the authenticated user.
     * @private
     */
    _handleGetAll(message, userId) {
        const contacts = this.dataDB.getAllByUser(userId);
        this._respond(message, 200, {
            success: true,
            data:    contacts,
            count:   contacts.length
        });
    }

    /**
     * GET /data/contacts/:id
     * Returns one contact. Verifies ownership before returning.
     * @private
     */
    _handleGetById(message, userId, id) {
        const contact = this.dataDB.getById(id);

        if (!contact) {
            return this._respond(message, 404, { error: "Contact not found" });
        }
        if (contact.userId !== userId) {
            return this._respond(message, 403, { error: "Access denied" });
        }

        this._respond(message, 200, { success: true, data: contact });
    }

    /**
     * POST /data/contacts
     * Creates a new contact for the authenticated user.
     * @private
     */
    _handleCreate(message, userId, body) {
        if (!body.name || body.name.trim() === "") {
            return this._respond(message, 400, { error: "Contact name is required" });
        }

        const newContact = this.dataDB.add(userId, body);
        console.log("[DataServer] Contact created:", newContact.id);

        this._respond(message, 201, { success: true, data: newContact });
    }

    /**
     * PUT /data/contacts/:id
     * Updates an existing contact. Verifies ownership before updating.
     * @private
     */
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

    /**
     * DELETE /data/contacts/:id
     * Deletes a contact. Verifies ownership before deleting.
     * @private
     */
    _handleDelete(message, userId, id) {
        const contact = this.dataDB.getById(id);

        if (!contact) {
            return this._respond(message, 404, { error: "Contact not found" });
        }
        if (contact.userId !== userId) {
            return this._respond(message, 403, { error: "Access denied" });
        }

        this.dataDB.delete(id);
        console.log("[DataServer] Contact deleted:", id);

        this._respond(message, 200, { success: true, message: "Contact deleted" });
    }

    /**
     * GET /data/contacts?search=query
     * Searches the user's contacts by a text query.
     * @private
     */
    _handleSearch(message, userId, query) {
        const results = this.dataDB.search(userId, query);
        this._respond(message, 200, {
            success: true,
            data:    results,
            count:   results.length
        });
    }

    
    //  PRIVATE HELPERS

    /**
     * Sends a JSON response back to the original sender via the Network.
     * @param {Object} originalMessage
     * @param {number} status
     * @param {Object} payload
     * @private
     */
    _respond(originalMessage, status, payload) {
        this.network.send({
            to:        originalMessage.from,
            from:      "data-server",
            requestId: originalMessage.requestId,
            status:    status,
            body:      JSON.stringify(payload)
        });
    }
}