class App {
    constructor(network) {
        this.network = network;
        this.clientAddress = "client-" + Date.now();

        this.currentUser = null;

        this.token = null;

        this.maxRetries = 3;

        this.network.registerClient(this.clientAddress, this);
    }

    register(username, password, email) {
        return this._request("POST", "/auth/register", { username, password, email });
    }

    async login(username, password) {
        const response = await this._request("POST", "/auth/login", { username, password });
        this.token       = response.token;
        this.currentUser = { userId: response.userId, username: response.username };
        return response;
    }

    logout() {
        this.token       = null;
        this.currentUser = null;
    }

    getAllContacts() {
        return this._request("GET", "/data/contacts", null);
    }

    getContact(id) {
        return this._request("GET", "/data/contacts/" + id, null);
    }

    addContact(data) {
        return this._request("POST", "/data/contacts", data);
    }

    updateContact(id, data) {
        return this._request("PUT", "/data/contacts/" + id, data);
    }

    deleteContact(id) {
        return this._request("DELETE", "/data/contacts/" + id, null);
    }

    searchContacts(query) {
        return this._request("GET", "/data/contacts?search=" + encodeURIComponent(query), null);
    }

_request(method, url, body, attempt = 1, originalId = null) {
    return new Promise((resolve, reject) => {
        const xhr = new FXMLHttpRequest(this.network, this.clientAddress);
        
        if (originalId) {
            xhr.requestId = originalId;
        }
        const currentRequestId = xhr.requestId;

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) return;

            if (xhr.status === 408) {
                if (attempt < this.maxRetries) {
                    const delay = 1000 * attempt; 
                    console.warn(`[App] Timeout. Retrying in ${delay}ms... (Attempt ${attempt})`);
                    setTimeout(() => {
                        this._request(method, url, body, attempt + 1, currentRequestId)
                       .then(resolve)
                       .catch(reject);
                    }, delay);
                } else {
                    reject({ error: "Network exhausted after retries", status: 408 });
            }
            return;
        }

            let responseBody;
            try {
                responseBody = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            } catch (e) {
                console.error("[App] Failed to parse server response:", e);
                responseBody = { error: "Communication error: Server response is invalid" };
            }

        if (xhr.status >= 200 && xhr.status < 300) {
            resolve(responseBody);
        } else {
            reject({ error: responseBody.error || "Unknown error", status: xhr.status });
        }
    };

        xhr.open(method, url);
        xhr.setRequestHeader("Content-Type", "application/json");
        if (this.token) {
            xhr.setRequestHeader("Authorization", this.token);
        }
        xhr.send(body);
    });
}
    receive(message) {
        // FXMLHttpRequest instances registered under this.clientAddress
        // receive their own responses directly via their own receive() method.
        // This top-level receive() is a required interface stub.
        console.log("[App] Network message received (handled by FAJAX):", message.requestId);
    }
}