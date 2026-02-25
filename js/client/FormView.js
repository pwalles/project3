class FormView {
    constructor(app, router, params) {
        this.app = app;
        this.router = router;
        this.contactId = params.id || null; 
    }

    async init() {
        this._bindEvents();

        if (this.contactId) {
            const title = document.getElementById("form-title");
            title.textContent = "Loading Contact Details...";
            this._setFormDisabled(true); 
            this.router.showLoading(true);
            try {
                const res = await this.app.getContact(this.contactId);
                title.textContent = "Edit Contact";
                this._fillForm(res.data);
                this._setFormDisabled(false);
            } catch (err) {
                console.error(err);
                title.textContent = "Error Loading Data";
                this._showError("Can't find this contact. Network might be down.");
            } finally {
                this.router.showLoading(false);
            }
        }
    }

    _setFormDisabled(disabled) {
        const form = document.getElementById("contact-form");
        if (!form) return;
        const elements = form.querySelectorAll("input, button");
        elements.forEach(el => el.disabled = disabled);
    }

    _bindEvents() {
        const form = document.getElementById("contact-form");
        const cancelBtn = document.getElementById("btn-cancel-form");

        cancelBtn.addEventListener("click", () => this.router.navigateTo("list"));

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const name = document.getElementById("form-name").value.trim();
            const phone = document.getElementById("form-phone").value.trim();
            const submitBtn = document.getElementById("btn-form-submit");
            
            submitBtn.disabled = true;
            submitBtn.textContent = "⏳ Saving...";
            this.router.showLoading(true);

            try {
                if (this.contactId) {
                    await this.app.updateContact(this.contactId, { name, phone });
                } else {
                    await this.app.addContact({ name, phone });
                }
                this.router.navigateTo("list");
            } catch (err) {
                const errorMsg = document.getElementById("form-error");
                errorMsg.textContent = err.error || "Save failed.";
                errorMsg.style.display = "block";
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "💾 Save";
                this.router.showLoading(false);
            }
        });
    }

    _fillForm(data) {
        document.getElementById("form-contact-id").value = data.id || "";
        document.getElementById("form-name").value = data.name || "";
        document.getElementById("form-phone").value = data.phone || "";
    }

    _showError(msg) {
        const errorMsg = document.getElementById("form-error");
        if (errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.style.display = "block";
        }
    }
}