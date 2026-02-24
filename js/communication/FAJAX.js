/**
 * FAJAX.js
 * -------------------------------------------------------
 * Fake AJAX implementation that simulates XMLHttpRequest.
 *
 * Responsibilities:
 * - Build REST-style requests
 * - Serialize data as JSON
 * - Send messages through Network
 * - Handle asynchronous responses
 * - Manage timeout and request matching
 */

class FXMLHttpRequest {

    /**
     * Creates a new FAJAX request object.
     *
     * @param {Network} networkInstance
     * @param {string} clientAddress
     */
    constructor(networkInstance, clientAddress) {

        this.network = networkInstance;
        this.clientAddress = clientAddress;

        this.method = null;
        this.url = null;
        this.headers = {};
        this.body = null;

        this.readyState = 0; // 0 = UNSENT
        this.status = 0;
        this.responseText = null;

        this.onreadystatechange = null;

        this.requestId = this._generateRequestId();
        this.timeoutDuration = 4000;
        this._timeoutHandler = null;

        // Register this instance as client
        this.network.registerClient(this.clientAddress, this);
    }

    /**
     * Initializes a request.
     */
    open(method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1; // OPENED
        this._triggerStateChange();
    }

    /**
     * Sets a request header.
     */
    setRequestHeader(key, value) {
        this.headers[key] = value;
    }

    /**
     * Sends the request through the network.
     */
    send(body = null) {

        this.body = body;
        this.readyState = 2; // HEADERS_SENT
        this._triggerStateChange();

        const message = {
            from: this.clientAddress,
            to: this._extractServerAddress(),
            requestId: this.requestId,
            method: this.method,
            resource: this.url,
            headers: this.headers,
            body: JSON.stringify(body)
        };

        this.network.send(message);

        this._startTimeout();
    }

    /**
     * Receives response from network.
     */
    receive(message) {

        // Ignore unrelated responses
        if (message.requestId !== this.requestId) return;

        clearTimeout(this._timeoutHandler);

        this.status = message.status;
        this.responseText = message.body;

        this.readyState = 4; // DONE
        this._triggerStateChange();
    }

    /**
     * Extracts server address from URL.
     * Example:
     * /auth/login → auth-server
     * /data/items → data-server
     */
    _extractServerAddress() {

        if (this.url.startsWith("/auth")) {
            return "auth-server";
        }
        return "data-server";
    }

    /**
     * Handles timeout scenario.
     */
    _startTimeout() {

        this._timeoutHandler = setTimeout(() => {

            if (this.readyState !== 4) {
                this.status = 408; // Request Timeout
                this.readyState = 4;
                this.responseText = JSON.stringify({
                    error: "Request Timeout"
                });
                this._triggerStateChange();
            }

        }, this.timeoutDuration);
    }

    /**
     * Triggers onreadystatechange callback.
     */
    _triggerStateChange() {
        if (typeof this.onreadystatechange === "function") {
            this.onreadystatechange();
        }
    }

    /**
     * Generates unique request ID.
     */
    _generateRequestId() {
        return Date.now() + "-" + Math.random().toString(16).slice(2);
    }
}
