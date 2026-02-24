/**
 * @file FAJAX.js
 * @description Fake AJAX — simulates XMLHttpRequest for client-server communication
 */
class FXMLHttpRequest {

    /**
     * @constructor
     * @param {Network} networkInstance - The shared Network used for sending/receiving
     * @param {string}  clientAddress   - Logical address of the calling client
     */
    constructor(networkInstance, clientAddress) {
        this.network       = networkInstance;
        this.clientAddress = clientAddress;

        // Request fields
        this.method   = null;
        this.url      = null;
        this.headers  = {};
        this.body     = null;

        // Response fields
        /** @type {0|1|2|4} */
        this.readyState   = 0;
        this.status       = 0;
        this.responseText = null;

        // Callback
        /** Called on every readyState change — set by the caller */
        this.onreadystatechange = null;

        // Internal
        /** Unique ID linking this request to its server response */
        this.requestId = this._generateRequestId();

        /** Timeout in ms before treating the request as lost */
        this.timeoutDuration = 4000;

        this._timeoutHandle = null;

        // Register this object in the network so it can receive responses
        this.network.registerClient(this.clientAddress, this);
    }


    //  PUBLIC API  (mirrors XMLHttpRequest interface)

    /**
     * Initializes the request with a method and URL.
     * Sets readyState to OPENED (1).
     *
     * @param {string} method - "GET" | "POST" | "PUT" | "DELETE"
     * @param {string} url    - Resource path, e.g. "/auth/login"
     */
    open(method, url) {
        this.method    = method;
        this.url       = url;
        this.readyState = 1; // OPENED
        this._triggerCallback();
    }

    /**
     * Sets a request header (e.g. Authorization token).
     * Must be called after open() and before send().
     *
     * @param {string} key   - Header name
     * @param {string} value - Header value
     */
    setRequestHeader(key, value) {
        this.headers[key] = value;
    }

    /**
     * Sends the request through the Network.
     * Sets readyState to HEADERS_SENT (2) and starts the timeout timer.
     *
     * @param {Object|null} body - Request payload object (will be JSON-stringified)
     */
    send(body = null) {
        this.body      = body;
        this.readyState = 2; // HEADERS_SENT
        this._triggerCallback();

        const message = {
            from:      this.clientAddress,
            to:        this._resolveServerAddress(),
            requestId: this.requestId,
            method:    this.method,
            resource:  this.url,
            headers:   this.headers,
            body:      JSON.stringify(body)
        };

        this.network.send(message);
        this._startTimeout();
    }

    /**
     * Called by the Network when a message arrives at this client address.
     * Ignores messages that do not match this request's ID.
     * On match: stores response data, sets readyState to DONE (4).
     *
     * @param {Object} message - Incoming response from the Network
     */
    receive(message) {
        // Ignore responses for other requests
        if (message.requestId !== this.requestId) return;

        clearTimeout(this._timeoutHandle);

        this.status       = message.status;
        this.responseText = message.body;
        this.readyState   = 4; // DONE
        this._triggerCallback();
    }

    
    //  PRIVATE HELPERS

    /**
     * Determines the target server address from the URL.
     * /auth/* → "auth-server"
     * /data/* → "data-server"
     *
     * @returns {string} Server address
     * @private
     */
    _resolveServerAddress() {
        if (this.url.startsWith("/auth")) return "auth-server";
        return "data-server";
    }

    /**
     * Starts the timeout timer.
     * If no response arrives within timeoutDuration ms,
     * sets status 408 (Request Timeout) and triggers callback.
     * @private
     */
    _startTimeout() {
        this._timeoutHandle = setTimeout(() => {
            if (this.readyState !== 4) {
                console.warn("[FAJAX] Request timed out:", this.requestId);
                this.status       = 408; // Request Timeout
                this.responseText = JSON.stringify({ error: "Request Timeout" });
                this.readyState   = 4; // DONE
                this._triggerCallback();
            }
        }, this.timeoutDuration);
    }

    /**
     * Fires onreadystatechange if it has been set by the caller.
     * @private
     */
    _triggerCallback() {
        if (typeof this.onreadystatechange === "function") {
            this.onreadystatechange();
        }
    }

    /**
     * Generates a unique request ID using timestamp + random hex.
     * @returns {string}
     * @private
     */
    _generateRequestId() {
        return "req_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
}