
class ListView {
    constructor(app, router) {
        this.app = app;
        this.router = router;
    }

    async init() {
        const container = document.getElementById("contacts-container");
        if (!container) return;
        container.addEventListener("click", (e) => {
            const card = e.target.closest(".contact-card");
            if (card) {
                const id = card.dataset.id; 
                this.router.navigateTo("detail", { id: id });
            }
        });
        
        if (container) container.innerHTML = "<p class='info-msg'>⏳ Loading contacts from the server...</p>";

        document.getElementById("btn-logout").addEventListener("click", () => {
            this.app.logout();
            this.router.navigateTo("login");
        });
        
        document.getElementById("btn-add-contact").addEventListener("click", () => this.router.navigateTo("form"));

        document.getElementById("search-input").addEventListener("input", async (e) => {
            const query = e.target.value;
            try {
                const res = await this.app.searchContacts(query);
                this.renderList(res.data);
            } catch (err) {
                console.error("[ListView] Search failed:", err);
            }
        });

        this.router.showLoading(true);
        try {
            const res = await this.app.getAllContacts();
            this.renderList(res.data);
        } catch (err) {
            console.error("[ListView] Init failed:", err);
            this._showErrorMessage("Unable to load contacts. Check network connection");
        } finally {
            this.router.showLoading(false);
        }
    }

    renderList(contacts) {
        const container = document.getElementById("contacts-container");
        if (!container) return; 

        if (!contacts || contacts.length === 0) {
            container.innerHTML = "<p class='info-msg'>No contacts found..</p>";
            return;
        }

        container.innerHTML = contacts.map(c => `
            <div class="contact-card" data-id="${c.id}">
            <h3>${c.name}</h3>
            <p>${c.phone}</p>
            </div>
`       ).join("");
    }

    _showErrorMessage(msg) {
        const container = document.getElementById("contacts-container");
        if (container) {
            container.innerHTML = `<p id="list-error" class="error-msg">${msg}</p>`;
        }
    }
}