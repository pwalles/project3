/* A class that represents the contact details page.

It loads and displays a single contact by ID,
and provides Edit and Delete action buttons.
*/

class DetailView {

    // The constructor receives two objects:
    // The communication layer with the server and the nav manager between the pages.
    constructor(app, router) {
        this.app    = app;
        this.router = router;
    }

    /* Initializes the view by loading the contact details and setting up event handlers.
    Called once by Router after the template is inserted into the DOM.
    params is an object containing the contact ID. */ 
    init(params) {
        var self    = this;
        var backBtn = document.getElementById("btn-back-to-list");

        // Back button navigates to the contact list
        if (backBtn) {
            backBtn.onclick = function() {
                self.router.navigateTo("list");
            };
        }

        // The router shows the user that the system is loading data.
        self.router.showLoading(true);

        // Load the contact from the server using the ID from navigation params
        // This is a callback functin - function(err, res)
        // it will run when the response from the server arrives.
        self.app.getContact(params.id, function(err, res) {

            // Once the server has responded - stop displaying loading state.
            self.router.showLoading(false);

            if (err) {
                console.error("[DetailView] Load failed:", err);
                // Looking for an HTML element that is intended to display errors.
                var errorEl = document.getElementById("detail-error");
                if (errorEl) {
                    // If the element exists, show an error message to the user.
                    errorEl.textContent   = "Communication error: Unable to load contact information";
                    // The error message is made visible in case it was hidden.
                    errorEl.style.display = "block";
                }
                return;
            }

            // Getting contact information from the server response
            var c = res.data;

            // Populate the detail fields with the contact's data
            document.getElementById("detail-name").textContent  = c.name;
            document.getElementById("detail-phone").textContent = c.phone;
            document.getElementById("detail-email").textContent = c.email;
            document.getElementById("detail-note").textContent  = c.note;

            // Edit button navigates to the Form page in edit mode
            document.getElementById("btn-edit-contact").onclick = function() {
                self.router.navigateTo("form", { id: c.id });
            };

            // Delete button asks for confirmation, then sends a delete request
            document.getElementById("btn-delete-contact").onclick = function() {
                // A confirmation window opens. 
                // If the user clicks Cancel - the function stops.
                if (!confirm("Delete contact?")) return;

                self.router.showLoading(true);
                self.app.deleteContact(c.id, function(err) {
                    self.router.showLoading(false);
                    if (err) {
                        alert("Delete failed: " + (err.error || "Network error"));
                        return;
                    }

                    // If the deletion is successful, the user returns to the contact list.
                    self.router.navigateTo("list");
                });
            };
        });
    }
}