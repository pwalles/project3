
document.addEventListener("DOMContentLoaded", function () {
    const network = new Network(0.1, 1000, 3000);
    const usersDB = new UsersDB();
    const dataDB  = new DataDB();
    seedIfEmpty(usersDB, dataDB);
    const authServer = new AuthServer(network, usersDB);
    const dataServer = new DataServer(network, dataDB, authServer);
    network.registerServer("auth-server", authServer);
    network.registerServer("data-server", dataServer);
    const app = new App(network);

    const router = new Router(app);
    router.navigateTo("login");

    window.network    = network;
    window.usersDB    = usersDB;
    window.dataDB     = dataDB;
    window.authServer = authServer;
    window.dataServer = dataServer;
    window.app        = app;

    console.log("✅ App ready: SPA architecture initialized correctly [cite: 9, 46]");
});