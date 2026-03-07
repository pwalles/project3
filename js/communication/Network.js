/* A department that "mock network layer" and simulates message passing. 
It doesn't do real HTTP, but only:

Keeps a list of clients and servers by address.

Allows you to send a message to a specific address.

Simulates random delays  and random message removal, to test how the application handles network unreliability.

*/

class Network {
    constructor(dropProbability = 0.3, minDelay = 1000, maxDelay = 3000) {
        // Validating the drop probability to be within a required range.
        if (dropProbability <0.1 || dropProbability > 0.5) { 
            throw new Error("Network: dropProbability must be between 0.1 and 0.5");
        } 

        this.dropProbability = dropProbability;
        this.minDelay = minDelay;
        this.maxDelay = maxDelay;
        this.clients = {};
        this.servers = {};
    }

    // Registers a client instance with a specific address in the network.
    registerClient(address, clientInstance) {
        this.clients[address] = clientInstance;
    }

    // Registers a server instance with a specific address in the network.
    registerServer(address, serverInstance) {
        this.servers[address] = serverInstance;
    }

    /* Simulates sending a message through the network. It randomly decides
    whether to drop the message or to deliver it after a random delay.*/
    send(message) {
        if (Math.random() < this.dropProbability) { 
            console.warn("[Network] Message DROPPED:", message);
            return;
        }

        const delay = this._randomDelay(); // Simulating a random delay before delivering the message.
        console.log("[Network] Delivering to \"" + message.to + "\" in " + delay + "ms");
        setTimeout(() => { // After the delay, the message is delivered to the target address.
            this._deliver(message);
        }, delay);
    }
   
    /* Delivers the message to the target address. It checks if the target
    is a registered server or client and calls their receive method.*/
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

    // Generates a random delay between minDelay and maxDelay.
    _randomDelay() {
        return Math.floor(
            Math.random() * (this.maxDelay - this.minDelay) + this.minDelay
        );
    }

    // Allows changing the drop probability at runtime, with validation.
    setDropProbability(probability) {
        if (probability < 0.1 || probability > 0.5) {
            throw new Error("Network: dropProbability must be between 0.1 and 0.5");
        }
        this.dropProbability = probability;
        console.log("[Network] Drop probability set to:", probability);
    }
}