
/*A data access layer that simulates browser data access but actually uses local storage.
If you switch to a real server, you only change this department.

Separation of business logic and data storage.

This is client-side storage (in the browser). Only stores strings. 
Preserved even after a page refresh.
*/

class UsersDB {
    constructor() {
        this.storageKey = "users_db";  // storageKey is the data table
        this._init();  // Initializing the database the first time the system runs
    }

    /* Check if a key named "users_db" exists in localStorage. If it doesn't - create it
    and write to it an empty array ([]) in JSON format. */
    _init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /* Retrieves the string from localStorage that is the users' key. 
    Then decodes it from JSON into a JavaScript object array and returns it. */
    _read() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    /* Gets an updated users array in memory. 
    Converts it to a JSON and saves it back to localStorage, 
    Overwriting the old value with the new value. */
    _write(users) {
        localStorage.setItem(this.storageKey, JSON.stringify(users));
    }

    /* Generates a user ID for a new user based on the current time in ms. 
    Adding the timestamp reduces the chance of ID collisions. */
    _generateId() {
        return "u_" + Date.now();
    }

    /* Returns all existing users in the database. 
    In effect, it simply calls _read(). */
    getAllUsers() {
        return this._read();
    }

    /* Searches the array for the first one whose id matches the provided id. 
    If it found, it's returned.
    If not, null is returned to indicate that there's no match. */
    getUserById(id) {
        return this._read().find(u => u.id === id) || null;
    }

    /* Acts similarly to id search but compares by username. 
    Returns the first matching user or null if none exists. */
    getUserByUsername(username) {
        return this._read().find(u => u.username === username) || null;
    }

    /* Checks if a user with the given username already exists. 
    It uses the username search function and returns a boolean value. */
    isUsernameTaken(username) {
        const user = this.getUserByUsername(username);
        return Boolean(user);
    }

    /* Loads all existing users, creates a new user and adds it to the array. 
    Saves the updated array back to localStorage. 
    Returns the newly created user. */

    addUser(userData) {
        const users   = this._read();
        const newUser = {
            id:        this._generateId(),
            username:  userData.username,
            password:  userData.password,
            email:     userData.email,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        this._write(users);
        return newUser;
    }

    /* Looks up the user by id and locates it in the array. 
    Data is an object that contains new fields to update.  
    It constructs a new object in which only the allowed fields are updated.
    While system fields such as id and username remain unchanged.
    Finally, it saves the updated array. */

    updateUser(id, data) {
        const users = this._read();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;

        /* Create a new object that stores only the fields that the user wants to update.
        Makes sure that a field exists in data before copying it. */
        var safeData = {};
        if (data.password !== undefined) safeData.password = data.password;
        if (data.email    !== undefined) safeData.email    = data.email;

        var existing = users[index];
        users[index] = {
            // ID and username remain as they are, cannot be updated.
            id:        existing.id,
            username:  existing.username,
            // Only allowed fields are updated, protected from malicious updates.
            password:  safeData.password !== undefined ? safeData.password : existing.password,
            email:     safeData.email    !== undefined ? safeData.email    : existing.email,
            createdAt: existing.createdAt
        };
        this._write(users);
        return users[index];
    }

    /* Creates a new array containing all users except the one whose ID matches the value. 
    If it removed (the length of the array changed), saves the new array and returns true; 
    If no matching user was found, it returns false.*/
    deleteUser(id) {
        const users    = this._read();
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) return false;
        this._write(filtered);
        return true;
    }
}