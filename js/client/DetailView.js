/* A class that handles the Contact Detail page UI.

It loads and displays a single contact by ID,
and provides Edit and Delete action buttons.
*/
class DetailView {

    constructor(app, router) {
        this.app    = app;
        this.router = router;
    }

    /* Initializes the view by loading the contact details and setting up event handlers.
    Called once by Router after the template is inserted into the DOM. */
    init(params) {
        var self    = this;
        var backBtn = document.getElementById("btn-back-to-list");

        // Back button navigates to the contact list
        if (backBtn) {
            backBtn.onclick = function() {
                self.router.navigateTo("list");
            };
        }

        self.router.showLoading(true);

        // Load the contact from the server using the ID from navigation params
        self.app.getContact(params.id, function(err, res) {
            self.router.showLoading(false);

            if (err) {
                console.error("[DetailView] Load failed:", err);
                var errorEl = document.getElementById("detail-error");
                if (errorEl) {
                    errorEl.textContent   = "Communication error: Unable to load contact information";
                    errorEl.style.display = "block";
                }
                return;
            }

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
                if (!confirm("Delete contact?")) return;

                self.router.showLoading(true);
                self.app.deleteContact(c.id, function(err) {
                    self.router.showLoading(false);
                    if (err) {
                        alert("Delete failed: " + (err.error || "Network error"));
                        return;
                    }
                    self.router.navigateTo("list");
                });
            };
        });
    }
}