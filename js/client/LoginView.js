/* A class that handles the Login page UI.

It reads username and password from the form,
calls app.login() when the form is submitted,
and navigates to the contact list on success.
*/
class LoginView {

    constructor(app, router) {
        this.app    = app;
        this.router = router;
    }

    /* Initializes the view by attaching event listeners to the login form
    and the register navigation link.
    Called once by Router after the template is inserted into the DOM. */
    init() {
        var self         = this;
        var form         = document.getElementById("login-form");
        var registerLink = document.getElementById("go-to-register");

        // Navigate to the Register page when the link is clicked
        registerLink.addEventListener("click", function(e) {
            e.preventDefault();
            self.router.navigateTo("register");
        });

        // Handle login form submission
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            var username  = document.getElementById("login-username").value.trim();
            var password  = document.getElementById("login-password").value.trim();
            var submitBtn = document.getElementById("btn-login-submit");
            var errorMsg  = document.getElementById("login-error");

            errorMsg.style.display = "none";
            submitBtn.disabled     = true;
            submitBtn.textContent  = "Logging in...";
            self.router.showLoading(true);

            // Send login request — callback handles success and error
            self.app.login(username, password, function(err, response) {
                if (err) {
                    errorMsg.textContent   = err.error || "Login failed.";
                    errorMsg.style.display = "block";
                } else {
                    self.router.navigateTo("list");
                }
                submitBtn.disabled    = false;
                submitBtn.textContent = "Login";
                self.router.showLoading(false);
            });
        });
    }
}