/**
 * @file main.js
 * @description Application bootstrap — creates and connects all components
 */

document.addEventListener("DOMContentLoaded", function () {

    // Network
    // 10% drop rate, 1–3 second delay per message
    const network = new Network(0.1, 1000, 3000);

    // Databases
    const usersDB = new UsersDB();
    const dataDB  = new DataDB();

    // Seed data (only on first run) 
    seedIfEmpty(usersDB, dataDB);

    // Servers
    const authServer = new AuthServer(network, usersDB);
    const dataServer = new DataServer(network, dataDB, authServer);

    // Register servers on the Network
    network.registerServer("auth-server", authServer);
    network.registerServer("data-server", dataServer);

    // Client App
    const app = new App(network);

    // SPA — synchronous init (all HTML already in DOM) 
    const spa = new SPA(app);
    spa.init();

    // Expose globals for console debugging
    window.network    = network;
    window.usersDB    = usersDB;
    window.dataDB     = dataDB;
    window.authServer = authServer;
    window.dataServer = dataServer;
    window.app        = app;
    window.spa        = spa;

    console.log("✅ App ready");
    console.log("👤 Test users:  alice / 1234   or   bob / 1234");
    console.log("🛠️  Debug via:  window.app / spa / usersDB / dataDB / network");
});