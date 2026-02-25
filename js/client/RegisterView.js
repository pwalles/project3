class RegisterView {
    constructor(app, router) {
        this.app = app;
        this.router = router;
    }

    init() {
        const form = document.getElementById("register-form");
        document.getElementById("go-to-login").addEventListener("click", () => this.router.navigateTo("login"));

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("btn-reg-submit");
            const pass = document.getElementById("reg-password").value;
            const confirm = document.getElementById("reg-confirm").value;

            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
            if (!passwordRegex.test(pass)) {
                this._showError("Password must contain at least 6 characters, including a letter and a number.");
                return;
            }

            if (pass !== confirm) {
                this._showError("Passwords do not match");
                return;
            }

            submitBtn.disabled = true;
            this.router.showLoading(true);

            try {
                const username = document.getElementById("reg-username").value;
                const email = document.getElementById("reg-email").value;
                await this.app.register(username, pass, email);
                alert("Registered successfully!");
                this.router.navigateTo("login");
            } catch (err) {
                this._showError(err.error || "Registration failed");
            } finally {
                submitBtn.disabled = false;
                this.router.showLoading(false);
            }
        });
    }

    _showError(msg) {
        const el = document.getElementById("register-error");
        el.textContent = msg;
        el.style.display = "block";
    }
}