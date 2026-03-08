/* The browser waits until it has finished building all the HTML of the page - 
to make sure that all the elements exist before the JavaScript starts working.
If we don't wait - the code may try to use elements that don't yet exist. */
document.addEventListener("DOMContentLoaded", function () {
    
    /* Create an object that simulates a real internet network.

    0.1 → 10% chance that the request will fail.
    1000 → Minimum delay of 1 second.
    3000 → Maximum delay of 3 seconds.
    Each request will receive a random response time between 1–3 seconds.*/
    const network = new Network(0.1, 1000, 3000);

    // A class that manages users.
    const usersDB = new UsersDB();

    // A class that manages contacts data.
    const dataDB  = new DataDB();

    // If the usersDB and dataDB are empty, they are filled with sample data.
    seedIfEmpty(usersDB, dataDB);

    // The authentication server and data server are created 
    // and registered in the network.
    const authServer = new AuthServer(network, usersDB);
    const dataServer = new DataServer(network, dataDB, authServer);
    network.registerServer("auth-server", authServer);
    network.registerServer("data-server", dataServer);

    // The main App class is created, 
    // which will be used by the client views to send requests to the servers.
    const app = new App(network);

    // The Router is created to manage page navigation in the SPA.
    const router = new Router(app);

    // The line that starts the application.
    router.navigateTo("login");

    /* Expose the main objects to the global scope.
    You can access them from the browser console, 
    e.g. by typing "app" and pressing Enter. */
    window.network    = network;
    window.usersDB    = usersDB;
    window.dataDB     = dataDB;
    window.authServer = authServer;
    window.dataServer = dataServer;
    window.app        = app;

    console.log("✅ App ready: SPA architecture initialized correctly [cite: 9, 46]");
});