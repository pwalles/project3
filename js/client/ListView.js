/* A class that handles the Contact List page UI.

It loads and renders all contacts on init,
supports live search on every keystroke,
and provides navigation to Add Contact, Detail, and Logout.
*/

class ListView {

    constructor(app, router) {
        this.app    = app;
        this.router = router;
    }

    /* Initializes the view by attaching all event listeners and loading the full contact list.
    Called once by Router after the template is inserted into the DOM. */
    init() {
        var self      = this;
        var container = document.getElementById("contacts-container");
        if (!container) return;

        // Clicking a contact card navigates to its Detail page
        container.addEventListener("click", function(e) {
            // Walk up the DOM to find the contact-card element that was clicked
            var card = e.target;
            while (card && card !== container) {
                if (card.className && card.className.indexOf("contact-card") !== -1) {
                    self.router.navigateTo("detail", { id: card.getAttribute("data-id") });
                    return;
                }
                card = card.parentElement;
            }
        });

        container.innerHTML = "<p class='info-msg'>Loading contacts from the server...</p>";

        // Logout button: clears session and navigates to Login
        document.getElementById("btn-logout").addEventListener("click", function() {
            self.app.logout();
            self.router.navigateTo("login");
        });

        // Add Contact button: navigates to the Form page in add mode
        document.getElementById("btn-add-contact").addEventListener("click", function() {
            self.router.navigateTo("form");
        });

        // Search input: sends a search request on every keystroke
        document.getElementById("search-input").addEventListener("input", function(e) {
            var query = e.target.value;
            self.app.searchContacts(query, function(err, res) {
                if (err) {
                    console.error("[ListView] Search failed:", err);
                    return;
                }
                self.renderList(res.data);
            });
        });

        // Load all contacts when the page first opens
        self.router.showLoading(true);
        self.app.getAllContacts(function(err, res) {
            self.router.showLoading(false);
            if (err) {
                console.error("[ListView] Init failed:", err);
                self._showErrorMessage("Unable to load contacts. Check network connection");
                return;
            }
            self.renderList(res.data);
        });
    }

    /* Renders the contact list into the contacts-container element.
    Shows an informational message if the list is empty. */
    renderList(contacts) {
        var container = document.getElementById("contacts-container");
        if (!container) return;

        if (!contacts || contacts.length === 0) {
            container.innerHTML = "<p class='info-msg'>No contacts found.</p>";
            return;
        }

        // Build the HTML for each contact card and inject it into the container
        var html = "";
        var i;
        for (i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            html += "<div class='contact-card' data-id='" + c.id + "'>";
            html += "<h3>" + c.name + "</h3>";
            html += "<p>" + c.phone + "</p>";
            html += "</div>";
        }
        container.innerHTML = html;
    }

    /* Displays an error message inside the contacts container. */
    _showErrorMessage(msg) {
        var container = document.getElementById("contacts-container");
        if (container) {
            container.innerHTML = "<p id='list-error' class='error-msg'>" + msg + "</p>";
        }
    }
}