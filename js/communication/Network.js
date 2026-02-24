/**
 * Network.js
 * -------------------------------------------------------
 * Simulates an unreliable asynchronous communication network
 * between clients and servers.
 *
 * Features:
 * - Random delay between 1–3 seconds for each message
 * - Controlled packet loss (10%–50%)
 * - Address-based routing
 * - Bidirectional communication (client ↔ server)
 *
 * The network does NOT interpret message logic.
 * It only transfers JSON messages between registered endpoints.
 */

class Network {

    /**
     * Creates a new simulated network.
     *
     * @param {number} dropProbability - Packet loss probability (0.1–0.5)
     * @param {number} minDelay - Minimum delay in ms (default 1000)
     * @param {number} maxDelay - Maximum delay in ms (default 3000)
     */
    constructor(dropProbability = 0.1, minDelay = 1000, maxDelay = 3000) {

        if (dropProbability < 0.1 || dropProbability > 0.5) {
            throw new Error("Drop probability must be between 0.1 and 0.5");
        }

        this.dropProbability = dropProbability;
        this.minDelay = minDelay;
        this.maxDelay = maxDelay;

        this.clients = {};
        this.servers = {};
    }

    /**
     * Registers a client in the network.
     * @param {string} address - Logical address of the client
     * @param {object} clientInstance - Object with receive(message) method
     */
    registerClient(address, clientInstance) {
        this.clients[address] = clientInstance;
    }

    /**
     * Registers a server in the network.
     * @param {string} address - Logical address of the server
     * @param {object} serverInstance - Object with receive(message) method
     */
    registerServer(address, serverInstance) {
        this.servers[address] = serverInstance;
    }

    /**
     * Sends a message through the network.
     * Applies packet loss and random delay.
     *
     * @param {Object} message - JSON message object
     */
    send(message) {

        // Simulate packet loss
        if (Math.random() < this.dropProbability) {
            console.warn("Network: message dropped", message);
            return;
        }

        const delay = this._generateRandomDelay();

        setTimeout(() => {
            this._deliver(message);
        }, delay);
    }

    /**
     * Delivers the message to the correct recipient.
     * @param {Object} message
     */
    _deliver(message) {

        const target = message.to;

        if (this.servers[target]) {
            this.servers[target].receive(message);
        }
        else if (this.clients[target]) {
            this.clients[target].receive(message);
        }
        else {
            console.error("Network: target address not found:", target);
        }
    }

    /**
     * Generates a random delay between minDelay and maxDelay.
     * @returns {number}
     */
    _generateRandomDelay() {
        return Math.floor(
            Math.random() * (this.maxDelay - this.minDelay) + this.minDelay
        );
    }

    /**
     * Updates packet loss probability.
     * @param {number} probability - Value between 0.1 and 0.5
     */
    setDropProbability(probability) {
        if (probability < 0.1 || probability > 0.5) {
            throw new Error("Drop probability must be between 0.1 and 0.5");
        }
        this.dropProbability = probability;
    }
}
