/**
 * @file DataDB.js
 * @description Database layer for contact records — stored in LocalStorage
 */
class DataDB {

    /**
     * @constructor
     * Initializes the contacts storage in LocalStorage if it doesn't exist yet.
     */
    constructor() {
        this.storageKey = "data_db";
        this._init();
    }


    //  PRIVATE: LocalStorage access

    /**
     * Creates an empty contacts array in LocalStorage if not already present.
     * @private
     */
    _init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /**
     * Reads and parses the contacts array from LocalStorage.
     * @returns {Array}
     * @private
     */
    _read() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    /**
     * Serializes and saves the contacts array to LocalStorage.
     * @param {Array} contacts
     * @private
     */
    _write(contacts) {
        localStorage.setItem(this.storageKey, JSON.stringify(contacts));
    }

    /**
     * Generates a unique contact ID based on the current timestamp.
     * @returns {string} e.g. "c_1712345678901"
     * @private
     */
    _generateId() {
        return "c_" + Date.now();
    }


    //  DB-API — called only from DataServer

    /**
     * Returns all contacts belonging to a specific user.
     * @param {string} userId
     * @returns {Array}
     */
    getAllByUser(userId) {
        return this._read().filter(c => c.userId === userId);
    }

    /**
     * Returns a single contact by its ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getById(id) {
        return this._read().find(c => c.id === id) || null;
    }

    /**
     * Adds a new contact record for a specific user.
     * @param {string} userId
     * @param {Object} itemData - { name, phone, email, note }
     * @returns {Object} The created contact (including generated id)
     */
    add(userId, itemData) {
        const contacts   = this._read();
        const newContact = {
            id:        this._generateId(),
            userId:    userId,
            name:      itemData.name  || "",
            phone:     itemData.phone || "",
            email:     itemData.email || "",
            note:      itemData.note  || "",
            createdAt: new Date().toISOString()
        };
        contacts.push(newContact);
        this._write(contacts);
        return newContact;
    }

    /**
     * Updates an existing contact (partial update supported).
     * Protects immutable fields: id, userId, createdAt.
     * @param {string} id
     * @param {Object} itemData - Fields to update
     * @returns {Object|null} Updated contact, or null if not found
     */
    update(id, itemData) {
        const contacts = this._read();
        const index    = contacts.findIndex(c => c.id === id);
        if (index === -1) return null;

        // Protect immutable fields — copy only allowed fields manually
        var safeData = {};
        if (itemData.name      !== undefined) safeData.name      = itemData.name;
        if (itemData.phone     !== undefined) safeData.phone     = itemData.phone;
        if (itemData.email     !== undefined) safeData.email     = itemData.email;
        if (itemData.note      !== undefined) safeData.note      = itemData.note;

        var existing = contacts[index];
        contacts[index] = {
            id:        existing.id,
            userId:    existing.userId,
            name:      safeData.name      !== undefined ? safeData.name      : existing.name,
            phone:     safeData.phone     !== undefined ? safeData.phone     : existing.phone,
            email:     safeData.email     !== undefined ? safeData.email     : existing.email,
            note:      safeData.note      !== undefined ? safeData.note      : existing.note,
            createdAt: existing.createdAt
        };
        this._write(contacts);
        return contacts[index];
    }

    /**
     * Deletes a contact by its ID.
     * @param {string} id
     * @returns {boolean} True if deleted, false if not found
     */
    delete(id) {
        const contacts = this._read();
        const filtered = contacts.filter(c => c.id !== id);
        if (filtered.length === contacts.length) return false;
        this._write(filtered);
        return true;
    }

    /**
     * Searches a user's contacts by a text query.
     * Matches against name, phone, email, and note (case-insensitive).
     * @param {string} userId
     * @param {string} query
     * @returns {Array}
     */
    search(userId, query) {
        const q = query.toLowerCase();
        return this.getAllByUser(userId).filter(c =>
            c.name.toLowerCase().includes(q)  ||
            c.phone.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.note.toLowerCase().includes(q)
        );
    }

    /**
     * Deletes all contacts belonging to a specific user.
     * @param {string} userId
     * @returns {number} Number of deleted records
     */
    deleteAllByUser(userId) {
        const contacts = this._read();
        const filtered = contacts.filter(c => c.userId !== userId);
        this._write(filtered);
        return contacts.length - filtered.length;
    }
}