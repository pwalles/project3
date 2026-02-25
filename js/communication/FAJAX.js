class FXMLHttpRequest {
    constructor(networkInstance, clientAddress) {
        this.network       = networkInstance;
        this.clientAddress = clientAddress;
        this.method   = null;
        this.url      = null;
        this.headers  = {};
        this.body     = null;
        this.readyState   = 0;
        this.status       = 0;
        this.responseText = null;
        this.onreadystatechange = null;
        this.requestId = this._generateRequestId();
        this.timeoutDuration = 4000;
        this._timeoutHandle = null;
        this.network.registerClient(this.clientAddress, this);
    }

    open(method, url) {
        this.method    = method;
        this.url       = url;
        this.readyState = 1; // OPENED
        this._triggerCallback();
    }

    setRequestHeader(key, value) {
        this.headers[key] = value;
    }

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

    receive(message) {
        // Ignore responses for other requests
        if (message.requestId !== this.requestId) return;

        clearTimeout(this._timeoutHandle);

        this.status       = message.status;
        this.responseText = message.body;
        this.readyState   = 4; // DONE
        this._triggerCallback();
    }

    _resolveServerAddress() {
        if (this.url.startsWith("/auth")) return "auth-server";
        return "data-server";
    }

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

    _triggerCallback() {
        if (typeof this.onreadystatechange === "function") {
            this.onreadystatechange();
        }
    }

    _generateRequestId() {
        return "req_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
}