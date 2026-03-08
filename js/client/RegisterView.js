/* A class that handles the Register page UI.

It validates password strength and confirmation on the client side,
then calls app.register() when the form is submitted.
On success, navigates to the Login page.
*/

class RegisterView {

    constructor(app, router) {
        this.app    = app;
        this.router = router;
    }

    /* Initializes the view by attaching event listeners to the register form
    and the login navigation link.
    Called once by Router after the template is inserted into the DOM. */
    init() {
        var self = this;
        var form = document.getElementById("register-form");

        // Navigate back to the Login page when the link is clicked.
        // Find the link "Already have an account?"
        document.getElementById("go-to-login").addEventListener("click", function() {
            self.router.navigateTo("login");
        });

        // Handle register form submission.
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            //Pull out the registration button, 
            // the password the user typed, 
            // the password confirmation field.
            var submitBtn = document.getElementById("btn-reg-submit");
            var pass      = document.getElementById("reg-password").value;
            var confirm   = document.getElementById("reg-confirm").value;

            // Validate password: at least 6 characters, one letter and one digit.
            var hasLetter = false;
            var hasDigit  = false;
            var i;
            for (i = 0; i < pass.length; i++) {
                if ((pass[i] >= "a" && pass[i] <= "z") || (pass[i] >= "A" && pass[i] <= "Z")) {
                    hasLetter = true;
                }
                if (pass[i] >= "0" && pass[i] <= "9") {
                    hasDigit = true;
                }
            }
            if (pass.length < 6 || !hasLetter || !hasDigit) {
                self._showError("Password must contain at least 6 characters, including a letter and a number.");
                return;
            }

            // Confirm that both password fields match.
            if (pass !== confirm) {
                self._showError("Passwords do not match");
                return;
            }

            // If validation passed, read the username and email from the form fields.
            var username = document.getElementById("reg-username").value;
            var email    = document.getElementById("reg-email").value;

            // Disable the submit button to prevent multiple clicks, 
            // and show a loading state.
            submitBtn.disabled = true;
            self.router.showLoading(true);

            // Send register request — callback handles success and error.
            self.app.register(username, pass, email, function(err, response) {
                if (err) {
                    self._showError(err.error || "Registration failed");
                } else {
                    alert("Registered successfully!");
                    self.router.navigateTo("login");
                }
                // Re-enable the submit button and hide the loading state.
                submitBtn.disabled = false;
                self.router.showLoading(false);
            });
        });
    }

    /* Displays an error message on the register page. */
    _showError(msg) {
        var el           = document.getElementById("register-error");
        el.textContent   = msg;
        el.style.display = "block";
    }
}