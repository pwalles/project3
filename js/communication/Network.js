class Network {
    constructor(dropProbability = 1, minDelay = 1000, maxDelay = 3000) {
        if (dropProbability <0.1 || dropProbability > 0.5) {
            throw new Error("Network: dropProbability must be between 0.1 and 0.5");
        }

        this.dropProbability = dropProbability;
        this.minDelay = minDelay;
        this.maxDelay = maxDelay;
        this.clients = {};
        this.servers = {};
    }

    registerClient(address, clientInstance) {
        this.clients[address] = clientInstance;
    }

    registerServer(address, serverInstance) {
        this.servers[address] = serverInstance;
    }

    send(message) {
        if (Math.random() < this.dropProbability) {
            console.warn("[Network] Message DROPPED:", message);
            return;
        }

        const delay = this._randomDelay();
        console.log("[Network] Delivering to \"" + message.to + "\" in " + delay + "ms");
        setTimeout(() => {
            this._deliver(message);
        }, delay);
    }
   
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

    _randomDelay() {
        return Math.floor(
            Math.random() * (this.maxDelay - this.minDelay) + this.minDelay
        );
    }

    setDropProbability(probability) {
        if (probability < 0.1 || probability > 0.5) {
            throw new Error("Network: dropProbability must be between 0.1 and 0.5");
        }
        this.dropProbability = probability;
        console.log("[Network] Drop probability set to:", probability);
    }
}