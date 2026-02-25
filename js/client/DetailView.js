class DetailView {
    constructor(app, router) {
        this.app = app;
        this.router = router;
    }

    async init(params) {
        const backBtn = document.getElementById("btn-back-to-list");
        if (backBtn) backBtn.onclick = () => this.router.navigateTo("list");
        this.router.showLoading(true);
        try {
            const res = await this.app.getContact(params.id);
            const c = res.data;
            document.getElementById("detail-name").textContent = c.name;
            document.getElementById("detail-phone").textContent = c.phone;
            document.getElementById("detail-email").textContent = c.email;
            document.getElementById("detail-note").textContent = c.note;
            document.getElementById("btn-edit-contact").onclick = () => this.router.navigateTo("form", {id: c.id});
            
            document.getElementById("btn-delete-contact").onclick = async () => {
                if (!confirm("Delete contact?")) return;
                this.router.showLoading(true);
                try{
                    await this.app.deleteContact(c.id);
                    this.router.navigateTo("list");
                } catch (e) {
                    alert("Delete failed: " + (e.error || "Network error"));
                } finally {
                    this.router.showLoading(false);
                }
            };
        } catch (err) {
            console.error("[DetailView] Load failed:", err);
            const errorEl = document.getElementById("detail-error");
            if (errorEl) {
                errorEl.textContent = "Communication error: Unable to load contact information";
                errorEl.style.display = "block";
            }
        }finally {
            this.router.showLoading(false);
        }
    }
}