/* A class that handles the Add / Edit Contact form page.

It works in two modes:
  - Add mode  : contactId is null, form starts empty
  - Edit mode : contactId is set, form is pre-filled with existing contact data

On submit, it calls app.addContact() or app.updateContact() accordingly,
and navigates back to the contact list on success.
*/

class FormView {

    constructor(app, router, params) {
        this.app       = app;
        this.router    = router;
        this.contactId = params.id || null; // null = add mode, string = edit mode
    }

    /* Initializes the view by binding form events.
    In edit mode, also loads existing contact data to pre-fill the form.
    Called once by Router after the template is inserted into the DOM. */
    init() {
        var self = this;
        this._bindEvents();

        // Edit mode: load the existing contact and fill the form
        if (this.contactId) {
            var title = document.getElementById("form-title");
            title.textContent = "Loading Contact Details...";
            self._setFormDisabled(true);
            self.router.showLoading(true);

            self.app.getContact(self.contactId, function(err, res) {
                self.router.showLoading(false);
                if (err) {
                    console.error(err);
                    title.textContent = "Error Loading Data";
                    self._showError("Can't find this contact. Network might be down.");
                    return;
                }
                title.textContent = "Edit Contact";
                self._fillForm(res.data);
                self._setFormDisabled(false);
            });
        }
    }

    /* Disables or enables all inputs and buttons inside the form.
    Used while loading existing contact data in edit mode. */
    _setFormDisabled(disabled) {
        var form = document.getElementById("contact-form");
        if (!form) return;
        var elements = form.querySelectorAll("input, button");
        var i;
        for (i = 0; i < elements.length; i++) {
            elements[i].disabled = disabled;
        }
    }

    /* Attaches event listeners to the Cancel button and the form submit event. */
    _bindEvents() {
        var self      = this;
        var form      = document.getElementById("contact-form");
        var cancelBtn = document.getElementById("btn-cancel-form");

        // Cancel: go back to the contact list without saving
        cancelBtn.addEventListener("click", function() {
            self.router.navigateTo("list");
        });

        // Submit: save the contact (add or update based on contactId)
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            var name      = document.getElementById("form-name").value.trim();
            var phone     = document.getElementById("form-phone").value.trim();
            var submitBtn = document.getElementById("btn-form-submit");

            submitBtn.disabled    = true;
            submitBtn.textContent = "Saving...";
            self.router.showLoading(true);

            // Shared callback for both add and update responses
            function onSaved(err, res) {
                submitBtn.disabled    = false;
                submitBtn.textContent = "Save";
                self.router.showLoading(false);
                if (err) {
                    var errorMsg           = document.getElementById("form-error");
                    errorMsg.textContent   = err.error || "Save failed.";
                    errorMsg.style.display = "block";
                    return;
                }
                self.router.navigateTo("list");
            }

            if (self.contactId) {
                self.app.updateContact(self.contactId, { name: name, phone: phone }, onSaved);
            } else {
                self.app.addContact({ name: name, phone: phone }, onSaved);
            }
        });
    }

    /* Pre-fills the form fields with data from an existing contact (edit mode). */
    _fillForm(data) {
        document.getElementById("form-contact-id").value = data.id    || "";
        document.getElementById("form-name").value       = data.name  || "";
        document.getElementById("form-phone").value      = data.phone || "";
    }

    /* Displays an error message on the form page. */
    _showError(msg) {
        var errorMsg = document.getElementById("form-error");
        if (errorMsg) {
            errorMsg.textContent   = msg;
            errorMsg.style.display = "block";
        }
    }
}