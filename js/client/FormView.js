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

        // Set up event handlers for the form buttons and submit event.
        this._bindEvents();

        // Edit mode: load the contact and fill the form.
        if (this.contactId) {
            // The form title is changed to indicate that the 
            // contact details are being loaded.
            var title = document.getElementById("form-title");  
            title.textContent = "Loading Contact Details...";
            // Prevents the user from typing while loading.
            self._setFormDisabled(true);

            self.router.showLoading(true);

            // Loading the contact.
            self.app.getContact(self.contactId, function(err, res) {
                self.router.showLoading(false);
                if (err) {
                    console.error(err);
                    title.textContent = "Error Loading Data";
                    self._showError("Can't find this contact. Network might be down.");
                    return;
                }
                // If the data was successfully loaded, change the title. 
                title.textContent = "Edit Contact";
                // The function enters the data into the fields.
                self._fillForm(res.data);
                // The form is enabled so the user can edit the data.
                self._setFormDisabled(false);
            });
        }
    }

    /* Disables or enables all inputs and buttons inside the form.
    Used while loading existing contact data in edit mode. */
    _setFormDisabled(disabled) {
        // Looking for the form element in the page.
        var form = document.getElementById("contact-form");
        if (!form) return;
        // All input and button elements inside the form are disabled or enabled,
        // according to the value of the disabled parameter.
        var elements = form.querySelectorAll("input, button");
        var i;
        for (i = 0; i < elements.length; i++) {
            elements[i].disabled = disabled;
        }
    }

    // Attaches event listeners to the Cancel button and the form submit event.
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
            // Prevent default form submission because this is a SPA (no page reload)
            e.preventDefault();

            // Get the values from the form fields and trim whitespace.
            var name      = document.getElementById("form-name").value.trim();
            var phone     = document.getElementById("form-phone").value.trim();
            var submitBtn = document.getElementById("btn-form-submit");
            
            // Simple validation: check that name and phone are not empty.
            if (!name || !phone) {
                self._showError("Please enter both name and phone.");
                return;
            }

            // Disable the submit button and show loading state while saving 
            // to prevent duplicate submissions.
            submitBtn.disabled    = true;
            submitBtn.textContent = "Saving...";
            self.router.showLoading(true);

            // Shared callback for both add and update responses.
            function onSaved(err, res) {
                if (!document.getElementById("btn-form-submit")) return;
                
                submitBtn.disabled    = false;
                submitBtn.textContent = "Save";
                self.router.showLoading(false);
                if (err) {
                    var errorMsg = document.getElementById("form-error");
                    errorMsg.textContent   = err.error || "Save failed.";
                    errorMsg.style.display = "block";
                    return;
                }
                self.router.navigateTo("list");
            }

            // If contactId is set, we are in edit mode and should update the contact.
            // Otherwise, we are in add mode and should create a new contact.
            if (self.contactId) {
                self.app.updateContact(self.contactId, { name: name, phone: phone }, onSaved);
            } else {
                self.app.addContact({ name: name, phone: phone }, onSaved);
            }
        });
    }

    /* Fills out the form fields (edit mode). */
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