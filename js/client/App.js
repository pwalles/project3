/**
 * @file App.js
 * @description Client-side application logic — sends requests and manages session state
 */

class App {

    /**
     * @constructor
     * @param {Network} network - The shared Network instance
     */
    constructor(network) {
        this.network = network;
        this.clientAddress = "client-" + Date.now();

        this.currentUser = null;

        this.token = null;

        this.maxRetries = 3;

        this.network.registerClient(this.clientAddress, this);
    }

    // AUTH API

    /**
     * Registers a new user account.
     * @param {string} username
     * @param {string} password
     * @param {string} email
     * @returns {Promise<Object>} Resolves with server response body on success
     */
    register(username, password, email) {
        return this._request("POST", "/auth/register", { username, password, email });
    }

    /**
     * Logs in an existing user.
     * On success, stores the token and currentUser in this instance.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<Object>} Resolves with { success, token, userId, username }
     */
    async login(username, password) {
        const response = await this._request("POST", "/auth/login", { username, password });
        // Store session state on success
        this.token       = response.token;
        this.currentUser = { userId: response.userId, username: response.username };
        return response;
    }

    /**
     * Logs out the current user by clearing local session state.
     */
    logout() {
        this.token       = null;
        this.currentUser = null;
    }


    //  CONTACTS API

    /**
     * Fetches all contacts for the current user.
     * @returns {Promise<Object>} { success, data: [], count }
     */
    getAllContacts() {
        return this._request("GET", "/data/contacts", null);
    }

    /**
     * Fetches a single contact by ID.
     * @param {string} id
     * @returns {Promise<Object>} { success, data: contact }
     */
    getContact(id) {
        return this._request("GET", "/data/contacts/" + id, null);
    }

    /**
     * Creates a new contact.
     * @param {Object} data - { name, phone, email, note }
     * @returns {Promise<Object>} { success, data: newContact }
     */
    addContact(data) {
        return this._request("POST", "/data/contacts", data);
    }

    /**
     * Updates an existing contact.
     * @param {string} id
     * @param {Object} data - Fields to update
     * @returns {Promise<Object>} { success, data: updatedContact }
     */
    updateContact(id, data) {
        return this._request("PUT", "/data/contacts/" + id, data);
    }

    /**
     * Deletes a contact by ID.
     * @param {string} id
     * @returns {Promise<Object>} { success, message }
     */
    deleteContact(id) {
        return this._request("DELETE", "/data/contacts/" + id, null);
    }

    /**
     * Searches the current user's contacts by a text query.
     * @param {string} query
     * @returns {Promise<Object>} { success, data: [], count }
     */
    searchContacts(query) {
        return this._request("GET", "/data/contacts?search=" + encodeURIComponent(query), null);
    }


    //  CORE — request sending with retry logic

    /**
     * Sends a request via FXMLHttpRequest and wraps it in a Promise.
     * Automatically retries up to maxRetries times on timeout (408).
     * Resolves with the parsed response body on success (2xx).
     * Rejects with { error, status } on server errors or exhausted retries.
     *
     * @param {string}      method  - REST method
     * @param {string}      url     - Resource path
     * @param {Object|null} body    - Request payload
     * @param {number}      attempt - Current attempt number (internal)
     * @returns {Promise<Object>}
     * @private
     */
    _request(method, url, body, attempt = 1) {
        return new Promise((resolve, reject) => {

            const xhr = new FXMLHttpRequest(this.network, this.clientAddress);

            xhr.onreadystatechange = () => {
                // Only act when request is fully done
                if (xhr.readyState !== 4) return;

                // Timeout  
                if (xhr.status === 408) {
                    if (attempt < this.maxRetries) {
                        console.warn(
                            "[App] Timeout on attempt " + attempt +
                            "/" + this.maxRetries + ", retrying: " + url
                        );
                        this._request(method, url, body, attempt + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject({
                            error:  "Request failed after " + this.maxRetries + " attempts",
                            status: 408
                        });
                    }
                    return;
                }

                const responseBody = JSON.parse(xhr.responseText);

                // Success
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(responseBody);
                } else {
                    // Server error
                    reject({ error: responseBody.error, status: xhr.status });
                }
            };

            // Build and send the request
            xhr.open(method, url);
            xhr.setRequestHeader("Content-Type", "application/json");

            // Attach session token for authenticated routes
            if (this.token) {
                xhr.setRequestHeader("Authorization", this.token);
            }

            xhr.send(body);
        });
    }

    //  NETWORK INTERFACE

    /**
     * Called by the Network when a message arrives at this client address.
     * Individual FXMLHttpRequest instances handle their own responses
     * by requestId — this method satisfies the Network interface contract.
     * @param {Object} message
     */
    receive(message) {
        // FXMLHttpRequest instances registered under this.clientAddress
        // receive their own responses directly via their own receive() method.
        // This top-level receive() is a required interface stub.
        console.log("[App] Network message received (handled by FAJAX):", message.requestId);
    }
}