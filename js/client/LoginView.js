class LoginView {
    constructor(app, router) {
        this.app = app;
        this.router = router;
    }

    init() {
        const form = document.getElementById("login-form");
        const registerLink = document.getElementById("go-to-register");

        registerLink.addEventListener("click", (e) => {
            e.preventDefault();
            this.router.navigateTo("register");
        });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value.trim();
            const submitBtn = document.getElementById("btn-login-submit");
            const errorMsg = document.getElementById("login-error");

            errorMsg.style.display = "none";
            
            submitBtn.disabled = true;
            submitBtn.textContent = "⏳ Logging in...";
            this.router.showLoading(true);

            try {
                await this.app.login(username, password);
                this.router.navigateTo("list"); // מעבר לרשימה בהצלחה
            } catch (err) {
                errorMsg.textContent = err.error || "Login failed.";
                errorMsg.style.display = "block";
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Login";
                this.router.showLoading(false);
            }
        });
    }
}