/**
 * @file SPA.js
 * @description Single Page Application engine — routing and rendering
 */

class SPA {

    /**
     * @constructor
     * @param {App} app - App instance used for all data operations
     */
    constructor(app) {
        this.app = app;

        /** Currently displayed page name */
        this.currentPage = null;

        /** All page names — each must have a matching #page-{name} div in the DOM */
        this.pages = ["login", "register", "list", "detail", "form"];

        /**
         * Data passed to the current page (e.g. contact id for detail/form).
         * @type {Object}
         */
        this.pageParams = {};
    }


    
    //  INITIALIZATION

    /**
     * Initializes the SPA:
     *  1. Binds all event listeners for every page
     *  2. Shows the login page as the initial state
     *
     * Called from main.js after all components are ready.
     * Synchronous — no async needed since all HTML is in the DOM.
     */
    init() {
        this._bindLoginEvents();
        this._bindRegisterEvents();
        this._bindListEvents();
        this._bindDetailEvents();
        this._bindFormEvents();
        this.navigateTo("login");
        console.log("[SPA] Initialized — showing login page");
    }


    //  ROUTING

    /**
     * Navigates to a named page.
     * Shows the target div and hides all others.
     * Redirects unauthenticated users away from protected pages.
     *
     * @param {string} pageName - Target page name
     * @param {Object} [params={}] - Data to pass to the page (e.g. { id: "c_1" })
     */
    navigateTo(pageName, params = {}) {
        const protectedPages = ["list", "detail", "form"];

        // Auth guard
        if (protectedPages.includes(pageName) && !this.app.currentUser) {
            console.warn("[SPA] Not authenticated — redirecting to login");
            pageName = "login";
            params   = {};
        }

        this.currentPage = pageName;
        this.pageParams  = params;

        // Hide all pages
        this.pages.forEach(name => {
            const el = document.getElementById("page-" + name);
            if (el) el.style.display = "none";
        });

        // Show target page
        const target = document.getElementById("page-" + pageName);
        if (!target) {
            console.error("[SPA] Page element not found: #page-" + pageName);
            return;
        }
        target.style.display = "block";

        // Trigger page-specific data loading
        this._onEnter(pageName, params);
    }

    /**
     * Called after each navigation.
     * Triggers data loading for pages that need it.
     * @param {string} pageName
     * @param {Object} params
     * @private
     */
    _onEnter(pageName, params) {
        if (pageName === "list")   this._loadList();
        if (pageName === "detail") this._loadDetail(params.id);
        if (pageName === "form")   this._loadForm(params.id || null);
    }

  
    //  EVENT BINDING — LOGIN

    /**
     * Binds login form submit and "go to register" link.
     * @private
     */
    _bindLoginEvents() {
        const form = document.getElementById("login-form");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value.trim();

            this._clearMsg("login-error");
            this.showLoading(true);

            try {
                await this.app.login(username, password);
                this.navigateTo("list");
            } catch (err) {
                this.showError("login-error", err.error || "Login failed. Please try again.");
            } finally {
                this.showLoading(false);
            }
        });

        const link = document.getElementById("go-to-register");
        if (link) {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                this.navigateTo("register");
            });
        }
    }


    //  EVENT BINDING — REGISTER

    /**
     * Binds register form submit and "go to login" link.
     * Validates password confirmation before sending.
     * @private
     */
    _bindRegisterEvents() {
        const form = document.getElementById("register-form");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("reg-username").value.trim();
            const password = document.getElementById("reg-password").value.trim();
            const confirm  = document.getElementById("reg-confirm").value.trim();
            const email    = document.getElementById("reg-email").value.trim();

            this._clearMsg("register-error");

            // Client-side validation
            if (password !== confirm) {
                return this.showError("register-error", "Passwords do not match");
            }

            this.showLoading(true);
            try {
                await this.app.register(username, password, email);
                this.showSuccess("register-error", "Registered! Redirecting to login...");
                setTimeout(() => this.navigateTo("login"), 1500);
            } catch (err) {
                this.showError("register-error", err.error || "Registration failed.");
            } finally {
                this.showLoading(false);
            }
        });

        const link = document.getElementById("go-to-login");
        if (link) {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                this.navigateTo("login");
            });
        }
    }


    //  EVENT BINDING — LIST

    /**
     * Binds search input (live search), add button, and logout button.
     * @private
     */
    _bindListEvents() {
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.addEventListener("input", async () => {
                const query = searchInput.value.trim();
                if (query === "") {
                    this._loadList();
                } else {
                    this.showLoading(true);
                    try {
                        const res = await this.app.searchContacts(query);
                        this.renderList(res.data);
                    } catch (err) {
                        this.showError("list-error", err.error || "Search failed");
                    } finally {
                        this.showLoading(false);
                    }
                }
            });
        }

        const addBtn = document.getElementById("btn-add-contact");
        if (addBtn) {
            addBtn.addEventListener("click", () => this.navigateTo("form"));
        }

        const logoutBtn = document.getElementById("btn-logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                this.app.logout();
                this.navigateTo("login");
            });
        }
    }

 
    //  EVENT BINDING — DETAIL

    /**
     * Binds edit, delete, and back buttons on the detail page.
     * @private
     */
    _bindDetailEvents() {
        const editBtn = document.getElementById("btn-edit-contact");
        if (editBtn) {
            editBtn.addEventListener("click", () => {
                this.navigateTo("form", { id: this.pageParams.id });
            });
        }

        const deleteBtn = document.getElementById("btn-delete-contact");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async () => {
                if (!confirm("Delete this contact?")) return;

                this.showLoading(true);
                try {
                    await this.app.deleteContact(this.pageParams.id);
                    this.navigateTo("list");
                } catch (err) {
                    this.showError("detail-error", err.error || "Delete failed");
                } finally {
                    this.showLoading(false);
                }
            });
        }

        const backBtn = document.getElementById("btn-back-to-list");
        if (backBtn) {
            backBtn.addEventListener("click", () => this.navigateTo("list"));
        }
    }


    //  EVENT BINDING — FORM

    /**
     * Binds contact form submit and cancel button.
     * Determines add vs edit mode from the hidden form-contact-id field.
     * @private
     */
    _bindFormEvents() {
        const form = document.getElementById("contact-form");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id    = document.getElementById("form-contact-id").value;
            const name  = document.getElementById("form-name").value.trim();
            const phone = document.getElementById("form-phone").value.trim();
            const email = document.getElementById("form-email").value.trim();
            const note  = document.getElementById("form-note").value.trim();

            this._clearMsg("form-error");
            this.showLoading(true);

            try {
                if (id) {
                    await this.app.updateContact(id, { name, phone, email, note });
                } else {
                    await this.app.addContact({ name, phone, email, note });
                }
                this.navigateTo("list");
            } catch (err) {
                this.showError("form-error", err.error || "Save failed. Please try again.");
            } finally {
                this.showLoading(false);
            }
        });

        const cancelBtn = document.getElementById("btn-cancel-form");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => this.navigateTo("list"));
        }
    }


    //  DATA LOADING

    /**
     * Fetches and renders the contact list for the current user.
     * @private
     */
    async _loadList() {
        this.showLoading(true);
        this._clearMsg("list-error");
        try {
            const res = await this.app.getAllContacts();
            this.renderList(res.data);
        } catch (err) {
            this.showError("list-error", err.error || "Could not load contacts");
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Fetches and renders one contact on the detail page.
     * @param {string} id - Contact ID
     * @private
     */
    async _loadDetail(id) {
        if (!id) return;
        this.showLoading(true);
        this._clearMsg("detail-error");
        try {
            const res = await this.app.getContact(id);
            this.renderDetail(res.data);
        } catch (err) {
            this.showError("detail-error", err.error || "Could not load contact");
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Clears the form, then populates it if editing an existing contact.
     * @param {string|null} id - Contact ID for edit mode, null for add mode
     * @private
     */
    async _loadForm(id) {
        // Always reset form first
        document.getElementById("form-contact-id").value = "";
        document.getElementById("form-name").value       = "";
        document.getElementById("form-phone").value      = "";
        document.getElementById("form-email").value      = "";
        document.getElementById("form-note").value       = "";
        this._clearMsg("form-error");

        const title = document.getElementById("form-title");
        if (!id) {
            if (title) title.textContent = "Add New Contact";
            return;
        }

        if (title) title.textContent = "Edit Contact";
        this.showLoading(true);
        try {
            const res = await this.app.getContact(id);
            this.renderForm(res.data);
        } catch (err) {
            this.showError("form-error", err.error || "Could not load contact");
        } finally {
            this.showLoading(false);
        }
    }


    //  RENDERING

    /**
     * Renders contact cards into #contacts-container.
     * Each card is clickable and navigates to the detail page.
     * @param {Array} contacts - Array of contact objects
     */
    renderList(contacts) {
        const container = document.getElementById("contacts-container");
        if (!container) return;

        if (!contacts || contacts.length === 0) {
            container.innerHTML = "<p class='empty-message'>No contacts found.</p>";
            return;
        }

        container.innerHTML = contacts.map(function(c) {
            return (
                "<div class='contact-card' data-id='" + c.id + "'>" +
                    "<h3>" + this._escape(c.name)  + "</h3>" +
                    "<p>📞 " + this._escape(c.phone) + "</p>" +
                    "<p>✉️ " + this._escape(c.email) + "</p>" +
                "</div>"
            );
        }, this).join("");

        container.querySelectorAll(".contact-card").forEach((card) => {
            card.addEventListener("click", () => {
                this.navigateTo("detail", { id: card.dataset.id });
            });
        });
    }

    /**
     * Fills the detail page with a contact's data.
     * @param {Object} contact
     */
    renderDetail(contact) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || "—";
        };
        set("detail-name",  contact.name);
        set("detail-phone", contact.phone);
        set("detail-email", contact.email);
        set("detail-note",  contact.note);
        this.pageParams.id = contact.id;
    }

    /**
     * Fills the form fields with an existing contact's data (edit mode).
     * @param {Object} contact
     */
    renderForm(contact) {
        document.getElementById("form-contact-id").value = contact.id    || "";
        document.getElementById("form-name").value       = contact.name  || "";
        document.getElementById("form-phone").value      = contact.phone || "";
        document.getElementById("form-email").value      = contact.email || "";
        document.getElementById("form-note").value       = contact.note  || "";
    }

    // UI HELPERS

    /**
     * Shows or hides the global loading indicator.
     * @param {boolean} visible
     */
    showLoading(visible) {
        const el = document.getElementById("loading-indicator");
        if (el) el.style.display = visible ? "block" : "none";
    }

    /**
     * Displays a red error message in a named element.
     * @param {string} elementId
     * @param {string} message
     */
    showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent    = message;
        el.style.color    = "#e74c3c";
        el.style.display  = "block";
    }

    /**
     * Displays a green success message in a named element.
     * @param {string} elementId
     * @param {string} message
     */
    showSuccess(elementId, message) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent    = message;
        el.style.color    = "#27ae60";
        el.style.display  = "block";
    }

    /**
     * Hides and clears a message element.
     * @param {string} elementId
     * @private
     */
    _clearMsg(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent   = "";
        el.style.display = "none";
    }

    /**
     * Escapes HTML special characters to prevent XSS in innerHTML.
     * @param {string} str
     * @returns {string}
     * @private
     */
    _escape(str) {
        if (!str) return "";
        return str
            .replace(/&/g,  "&amp;")
            .replace(/</g,  "&lt;")
            .replace(/>/g,  "&gt;")
            .replace(/"/g,  "&quot;");
    }
}