/* A class that manages client-side SPA navigation.

It clears the current page, clones the matching HTML template into app-root,
and initializes the correct View instance for each page.
Protected pages (list, detail, form) redirect to Login if no user is logged in.

Supported pages: login, register, list, detail, form
*/

class Router {

    constructor(app) {
        this.app              = app;

        // This is the main element where all screens are displayed.
        // When you move a page, you clear it and insert a new template.
        this.appRoot          = document.getElementById("app-root");
        this.loadingIndicator = document.getElementById("loading-indicator");
    }

    /* Shows or hides the global loading indicator.
    Called by Views before and after every server request. */
    showLoading(visible) {
        this.loadingIndicator.style.display = visible ? "block" : "none";
    }

    /* Navigates to a page by name.
    Clears app-root, clones the matching HTML template, and initializes the View.
    Redirects to Login if a protected page is requested without an active session. */
    navigateTo(pageName, params) {
        if (params === undefined) {
            params = {};
        }

        // Redirect to login if user tries to access a protected page without being logged in.
        var protectedPages = ["list", "detail", "form"];
        var i;
        for (i = 0; i < protectedPages.length; i++) {
            if (protectedPages[i] === pageName && !this.app.currentUser) {
                pageName = "login";
                break;
            }
        }

        // Clear the current page content.
        this.appRoot.innerHTML = "";

        // Clone the HTML template for this page and insert it into the DOM.
        var template = document.getElementById("tpl-" + pageName);
        if (!template) {
            console.error("Template not found: tpl-" + pageName);
            return;
        }
        // The content of the template is cloned and appended to app-root.
        var clone = template.content.cloneNode(true);
        this.appRoot.appendChild(clone);
        this._initView(pageName, params);
    }

    /* Creates and initializes the correct View instance for the given page name. */
    _initView(pageName, params) {
        if (pageName === "login")    { new LoginView(this.app, this).init(); }
        if (pageName === "register") { new RegisterView(this.app, this).init(); }
        if (pageName === "list")     { new ListView(this.app, this).init(); }
        if (pageName === "form")     { new FormView(this.app, this, params).init(); }
        if (pageName === "detail")   { new DetailView(this.app, this).init(params); }
    }
}