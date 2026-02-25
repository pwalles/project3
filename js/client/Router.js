class Router {
    constructor(app) {
        this.app = app;
        this.appRoot = document.getElementById("app-root");
        this.loadingIndicator = document.getElementById("loading-indicator");
    }

    showLoading(visible) {
        this.loadingIndicator.style.display = visible ? "block" : "none";
    }

    navigateTo(pageName, params = {}) {
        const protectedPages = ["list", "detail", "form"];
        if (protectedPages.includes(pageName) && !this.app.currentUser) {
            pageName = "login";
        }

        this.appRoot.innerHTML = "";

        const template = document.getElementById("tpl-" + pageName);
        if (!template) {
            console.error("Template not found: tpl-" + pageName);
            return;
        }
        const clone = template.content.cloneNode(true);
        this.appRoot.appendChild(clone);

        this._initView(pageName, params);
    }

    _initView(pageName, params) {
        if (pageName === "login")    new LoginView(this.app, this).init();
        if (pageName === "register") new RegisterView(this.app, this).init();
        if (pageName === "list")     new ListView(this.app, this).init();
        if (pageName === "form")     new FormView(this.app, this, params).init();
        if (pageName === "detail")   new DetailView(this.app, this).init(params);
    }
}