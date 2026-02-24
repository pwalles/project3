/**
 * @file UsersDB.js
 * @description Database layer for user records — stored in LocalStorage
 */

class UsersDB {

    /**
     * @constructor
     * Initializes the users storage in LocalStorage if it doesn't exist yet.
     */
    constructor() {
        this.storageKey = "users_db";
        this._init();
    }


    //  PRIVATE: LocalStorage access

    /**
     * Creates an empty users array in LocalStorage if not already present.
     * @private
     */
    _init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /**
     * Reads and parses the users array from LocalStorage.
     * @returns {Array} Array of user objects
     * @private
     */
    _read() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    /**
     * Serializes and saves the users array to LocalStorage.
     * @param {Array} users
     * @private
     */
    _write(users) {
        localStorage.setItem(this.storageKey, JSON.stringify(users));
    }

    /**
     * Generates a unique user ID based on the current timestamp.
     * @returns {string} e.g. "u_1712345678901"
     * @private
     */
    _generateId() {
        return "u_" + Date.now();
    }


    //  DB-API — called only from AuthServer

    /**
     * Returns all user records.
     * @returns {Array}
     */
    getAllUsers() {
        return this._read();
    }

    /**
     * Finds and returns a user by their unique ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getUserById(id) {
        return this._read().find(u => u.id === id) || null;
    }

    /**
     * Finds and returns a user by their username.
     * @param {string} username
     * @returns {Object|null}
     */
    getUserByUsername(username) {
        return this._read().find(u => u.username === username) || null;
    }

    /**
     * Checks whether a username is already taken.
     * @param {string} username
     * @returns {boolean}
     */
    isUsernameTaken(username) {
        return this.getUserByUsername(username) !== null;
    }

    /**
     * Adds a new user to the database.
     * Automatically generates an ID and timestamps the record.
     * @param {Object} userData - { username, password, email }
     * @returns {Object} The created user record (including generated id)
     */
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

    /**
     * Updates an existing user's fields (partial update supported).
     * The fields id, username, and createdAt cannot be changed.
     * @param {string} id
     * @param {Object} data - Fields to update
     * @returns {Object|null} Updated user, or null if not found
     */
    updateUser(id, data) {
        const users = this._read();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;

        // Protect immutable fields — copy only allowed fields manually
        var safeData = {};
        if (data.password !== undefined) safeData.password = data.password;
        if (data.email    !== undefined) safeData.email    = data.email;

        var existing = users[index];
        users[index] = {
            id:        existing.id,
            username:  existing.username,
            password:  safeData.password !== undefined ? safeData.password : existing.password,
            email:     safeData.email    !== undefined ? safeData.email    : existing.email,
            createdAt: existing.createdAt
        };
        this._write(users);
        return users[index];
    }

    /**
     * Deletes a user by their ID.
     * @param {string} id
     * @returns {boolean} True if deleted, false if not found
     */
    deleteUser(id) {
        const users    = this._read();
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) return false;
        this._write(filtered);
        return true;
    }
}