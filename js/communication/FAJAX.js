
/* The class simulates an AJAX similar to the real XMLHttpRequest class.

Its purpose is to allow the client to send a request through the Network system 
and receive a response asynchronously.

The class builds a communication request, sends it over the network, 
and waits for a response from the server. 
When a response arrives, it updates the request state using readyState, 
saves the status code and response, and triggers a callback that the client defined. 
In addition, it handles the situation where there is no response using timeout, 
and uses a identifier to distinguish between several requests that are running simultaneously. 

Each communication operation creates a new object of this class.
 */

class FXMLHttpRequest {
    constructor(networkInstance, clientAddress) {
        this.network       = networkInstance;
        this.clientAddress = clientAddress;   // The address of the customer sending the request.
        this.method   = null;  // The HTTP method (e.g., GET, POST) of the request.
        this.url      = null;  // The resource you want to access.
        this.headers  = {};
        this.body     = null;
        // The state (0: UNSENT, 1: OPENED, 2: HEADERS_SENT, 3: LOADING, 4: DONE).
        this.readyState   = 0; 
        // The HTTP status code returned by the server (e.g., 200 for success). 
        this.status       = 0;  
        this.responseText = null;
        // A function that the client can define. 
        // It will be called every time the readyState changes.
        this.onreadystatechange = null;
        this.requestId = this._generateRequestId();
        // If the server doesn't respond within 7 seconds, the request fails.
        this.timeoutDuration = 7000;
        // Saves the timer ID so that it can be canceled when a response arrives.
        this._timeoutHandle = null;
        // Here the object is registered on the network.
        this.network.registerClient(this.clientAddress, this);
    }

    /* Initializes the request by setting the HTTP method and URL,
    and changes the readyState to OPENED (1).*/
    open(method, url) {
        this.method    = method;
        this.url       = url;
        this.readyState = 1; // OPENED
        // Notify the client that the request is now OPENED and ready to send.
        this._triggerCallback(); 
    }

    // Allows the client to set custom headers for the request. 
    setRequestHeader(key, value) {
        this.headers[key] = value;
    }

    // The function that actually sends the request.
    send(body = null) {
        this.body      = body;
        this.readyState = 2;  // Change request status - the request has been sent.
        // Notify the client that the request is now SENT.
        this._triggerCallback();

        const message = {
            from:      this.clientAddress, // Who sent the request.
            to:        this._resolveServerAddress(),  // Which server to send to.
            requestId: this.requestId,
            method:    this.method,  // The HTTP method (e.g., GET, POST).
            resource:  this.url,  // The resource you want to access (e.g., "/data/contacts").
            headers:   this.headers,
            // The request body, serialized as a JSON string.
            body:      JSON.stringify(body) 
        };

        // The network will forward the request to the appropriate server.
        this.network.send(message);
        // Start the timeout timer to handle cases where the server doesn't respond.
        this._startTimeout();
    }

    // This method is called by the network when a response message arrives for this request.
    receive(message) {
        // Ignore responses for other requests
        if (message.requestId !== this.requestId) return;

        clearTimeout(this._timeoutHandle);

        this.status       = message.status;
        this.responseText = message.body;
        this.readyState   = 4; // DONE
        this._triggerCallback();  // The customer receives the result.
    }

    // Determines which server to send the request to based on the URL pattern.
    _resolveServerAddress() {
        if (this.url.startsWith("/auth")) return "auth-server";
        return "data-server";
    }

    // Starts a timer that will trigger a timeout if the server doesn't respond within 4 seconds.
    _startTimeout() {
        // setTimeout is a function that runs code after a certain time.
        this._timeoutHandle = setTimeout(() => {
            if (this.readyState !== 4) {
                console.warn("[FAJAX] Request timed out:", this.requestId);
                // The client sent a request but the server didn't respond in time.
                this.status       = 408; 
                this.responseText = JSON.stringify({ error: "Request Timeout" });
                this.readyState   = 4; // DONE
                this._triggerCallback();
            }
        }, this.timeoutDuration);
    }

    // Checks whether the customer has defined a function - if so, it is activated.
    _triggerCallback() {
        if (typeof this.onreadystatechange === "function") {
            this.onreadystatechange();
        }
    }

    // Generates a unique identifier for each request.
    _generateRequestId() {
        return "req_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
}