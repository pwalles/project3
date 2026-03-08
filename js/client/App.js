/* A class that acts as the client-side application layer.

It sends requests to the server via FXMLHttpRequest (FAJAX),
manages session state (token and currentUser after login),
and provides a clean callback-based API to the View layer.

All public methods accept a callback of the form: callback(err, data)
  - On success : callback(null, responseBody)
  - On error   : callback({ error, status }, null)
*/

class App {

    constructor(network) {
        this.network       = network;
        this.clientAddress = "client-" + Date.now();
        this.currentUser   = null; // { userId, username } after login, null otherwise
        this.token         = null; // Session token after login, null otherwise
        this.maxRetries    = 3;    // Maximum number of retry attempts on timeout
        this.network.registerClient(this.clientAddress, this);
    }

    /* Sends a registration request to the auth server.
    Calls callback(err, data) when the server responds. */
    register(username, password, email, callback) {
        this._request("POST", "/auth/register", { username: username, password: password, email: email }, callback);
    }

    /* Sends a login request to the auth server.
    On success, stores the token and currentUser before calling callback. */
    login(username, password, callback) {
        var self = this;
        this._request("POST", "/auth/login", { username: username, password: password }, function(err, response) {
            if (err) {
                callback(err, null);
                return;
            }
            // Store session state so all future requests are authenticated
            self.token       = response.token;
            self.currentUser = { userId: response.userId, username: response.username };
            callback(null, response);
        });
    }

    /* Logs out the current user by clearing local session state.
    No server request is needed — the token remains valid on the server
    until it expires or is explicitly invalidated. */
    logout() {
        this.token       = null;
        this.currentUser = null;
    }

    /* Fetches all contacts belonging to the current user.
    Calls callback(err, data) when the server responds. */
    getAllContacts(callback) {
        this._request("GET", "/data/contacts", null, callback);
    }

    /* Fetches a single contact by its ID.
    Calls callback(err, data) when the server responds. */
    getContact(id, callback) {
        this._request("GET", "/data/contacts/" + id, null, callback);
    }

    /* Creates a new contact with the given data.
    Calls callback(err, data) when the server responds. */
    addContact(data, callback) {
        this._request("POST", "/data/contacts", data, callback);
    }

    /* Updates an existing contact identified by id.
    Calls callback(err, data) when the server responds. */
    updateContact(id, data, callback) {
        this._request("PUT", "/data/contacts/" + id, data, callback);
    }

    /* Deletes a contact by its ID.
    Calls callback(err, data) when the server responds. */
    deleteContact(id, callback) {
        this._request("DELETE", "/data/contacts/" + id, null, callback);
    }

    /* Searches contacts by a text query against all fields.
    Calls callback(err, data) when the server responds. */
    searchContacts(query, callback) {
        this._request("GET", "/data/contacts?search=" + encodeURIComponent(query), null, callback);
    }

    /* Core request method. Creates a new FXMLHttpRequest, sends it over the network,
    and handles the response via onreadystatechange (callback-based).
    Automatically retries up to maxRetries times on timeout (status 408),
    with an increasing delay between attempts. */
    _request(method, url, body, callback, attempt) {
        if (attempt === undefined) {
            attempt = 1;
        }

        var self = this;
        var xhr  = new FXMLHttpRequest(this.network, this.clientAddress);

        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) return;

            // Timeout — retry with increasing delay if attempts remain
            if (xhr.status === 408) {
                if (attempt < self.maxRetries) {
                    var delay = 1000 * attempt;
                    console.warn("[App] Timeout on attempt " + attempt + "/" + self.maxRetries + ", retrying in " + delay + "ms: " + url);
                    setTimeout(function() {
                        self._request(method, url, body, callback, attempt + 1);
                    }, delay);
                } else {
                    callback({ error: "Network exhausted after " + self.maxRetries + " attempts", status: 408 }, null);
                }
                return;
            }

            // Parse the response body from JSON
            var responseBody;
            try {
                responseBody = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            } catch (e) {
                console.error("[App] Failed to parse server response:", e);
                callback({ error: "Communication error: Server response is invalid", status: xhr.status }, null);
                return;
            }

            // 2xx = success, anything else = server-side error
            if (xhr.status >= 200 && xhr.status < 300) {
                callback(null, responseBody);
            } else {
                callback({ error: responseBody.error || "Unknown error", status: xhr.status }, null);
            }
        };

        xhr.open(method, url);
        xhr.setRequestHeader("Content-Type", "application/json");
        if (this.token) {
            // Attach the session token so the server can authenticate the request
            xhr.setRequestHeader("Authorization", this.token);
        }
        xhr.send(body);
    }

    /* Called by the Network when a message arrives at this client address.
    Individual FXMLHttpRequest instances handle their own responses via requestId matching.
    This method satisfies the Network interface contract. */
    receive(message) {
        console.log("[App] Network message received (handled by FAJAX):", message.requestId);
    }
}