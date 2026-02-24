/**
 * @file Network.js
 * @description Simulates an unreliable communication network between clients and servers
*/

class Network {

    /**
     * @constructor
     * @param {number} dropProbability - Packet loss chance (0.1 to 0.5)
     * @param {number} minDelay        - Minimum delivery delay in ms (default: 1000)
     * @param {number} maxDelay        - Maximum delivery delay in ms (default: 3000)
     */
    constructor(dropProbability = 0.1, minDelay = 1000, maxDelay = 3000) {
        if (dropProbability < 0.1 || dropProbability > 0.5) {
            throw new Error("Network: dropProbability must be between 0.1 and 0.5");
        }

        this.dropProbability = dropProbability;
        this.minDelay        = minDelay;
        this.maxDelay        = maxDelay;

        /** @type {Object.<string, {receive: function}>} */
        this.clients = {};

        /** @type {Object.<string, {receive: function}>} */
        this.servers = {};
    }


    //  REGISTRATION

    /**
     * Registers a client so the network can deliver messages to it.
     * @param {string} address          - Unique logical address (e.g. "client-123")
     * @param {Object} clientInstance   - Must implement receive(message)
     */
    registerClient(address, clientInstance) {
        this.clients[address] = clientInstance;
    }

    /**
     * Registers a server so the network can deliver messages to it.
     * @param {string} address          - Unique logical address (e.g. "auth-server")
     * @param {Object} serverInstance   - Must implement receive(message)
     */
    registerServer(address, serverInstance) {
        this.servers[address] = serverInstance;
    }


    //  SENDING

    /**
     * Sends a message through the simulated network.
     * Applies packet loss check first, then delivers after a random delay.
     *
     * @param {Object} message - Message object with at least a "to" field
     */
    send(message) {
        // Simulate packet loss
        if (Math.random() < this.dropProbability) {
            console.warn("[Network] Message DROPPED:", message);
            return;
        }

        const delay = this._randomDelay();
        console.log("[Network] Delivering to \"" + message.to + "\" in " + delay + "ms");

        // Simulate network delay
        setTimeout(() => {
            this._deliver(message);
        }, delay);
    }


    //  PRIVATE HELPERS

    /**
     * Delivers a message to its intended recipient.
     * Checks servers first, then clients.
     * @param {Object} message
     * @private
     */
    _deliver(message) {
        const target = message.to;

        if (this.servers[target]) {
            this.servers[target].receive(message);
        } else if (this.clients[target]) {
            this.clients[target].receive(message);
        } else {
            console.error("[Network] Unknown target address:", target);
        }
    }

    /**
     * Returns a random integer between minDelay and maxDelay.
     * @returns {number} Delay in milliseconds
     * @private
     */
    _randomDelay() {
        return Math.floor(
            Math.random() * (this.maxDelay - this.minDelay) + this.minDelay
        );
    }


    //  PUBLIC CONTROL

    /**
     * Updates the packet loss probability at runtime.
     * Useful for testing different network conditions.
     * @param {number} probability - New value between 0.1 and 0.5
     */
    setDropProbability(probability) {
        if (probability < 0.1 || probability > 0.5) {
            throw new Error("Network: dropProbability must be between 0.1 and 0.5");
        }
        this.dropProbability = probability;
        console.log("[Network] Drop probability set to:", probability);
    }
}