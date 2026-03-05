
/* A department manages the users' contacts.
This is the management of information within the application – 
what each user creates/stores in their application.

A data access layer that simulates browser data access but actually uses local storage.
If you switch to a real server, you only change this department.

Separation of business logic and data storage.

This is client-side storage (in the browser). Only stores strings. 
Preserved even after a page refresh.
*/

class DataDB {
    constructor() {
        this.storageKey = "data_db";  // storageKey is the data table
        this._init();  // Initializing the database the first time the system runs
    }

    /* Check if a key named "data_db" exists in localStorage. If it doesn't - create it
    and write to it an empty array ([]) in JSON format. */
    _init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /* Retrieves the string from localStorage that is the data_db key. 
    Then decodes it from JSON into a JavaScript object array and returns it. */
    _read() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    /* Gets an updated data array in memory. 
    Converts it to a JSON and saves it back to localStorage, 
    Overwriting the old value with the new value. */
    _write(contacts) {
        localStorage.setItem(this.storageKey, JSON.stringify(contacts));
    }

    /* Generates a contact ID for a new contact based on the current time in ms. 
    Adding the timestamp reduces the chance of ID collisions. */
    _generateId() {
        return "c_" + Date.now();
    }

    /* Returns all existing contacts in the database that belong to a specific user. 
    In effect, it simply calls _read() and filters the results by userId. */
    getAllByUser(userId) {
        return this._read().filter(c => c.userId === userId);
    }

    /* Searches the array for the first one whose id matches the provided id. 
    If it found, it's returned.
    If not, null is returned to indicate that there's no match. */  
    getById(id) {
        return this._read().find(c => c.id === id) || null;
    }

    /* Adds a new contact to the database.
    Generates a new contact object with the provided data and a new ID,
    Saves it to the database and returns the new contact. */

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

    /* Updates an existing contact in the database.
    Finds the contact by ID, updates its fields with the provided data,
    Saves the updated array back to the database and returns the updated contact. */
    update(id, itemData) {
        const contacts = this._read();
        const index    = contacts.findIndex(c => c.id === id);
        if (index === -1) return null;

        /* Create a new object that stores only the fields that the user wants to update.
        Makes sure that a field exists in data before copying it. */
        var safeData = {};
        if (itemData.name      !== undefined) safeData.name      = itemData.name;
        if (itemData.phone     !== undefined) safeData.phone     = itemData.phone;
        if (itemData.email     !== undefined) safeData.email     = itemData.email;
        if (itemData.note      !== undefined) safeData.note      = itemData.note;

        var existing = contacts[index];
        contacts[index] = {
            // ID and username remain as they are, cannot be updated.
            id:        existing.id,
            userId:    existing.userId,
            // Only allowed fields are updated, protected from malicious updates.
            name:      safeData.name      !== undefined ? safeData.name      : existing.name,
            phone:     safeData.phone     !== undefined ? safeData.phone     : existing.phone,
            email:     safeData.email     !== undefined ? safeData.email     : existing.email,
            note:      safeData.note      !== undefined ? safeData.note      : existing.note,
            createdAt: existing.createdAt
        };
        this._write(contacts);
        return contacts[index];
    }

    /* Deletes a contact from the database.
    Finds the contact by ID, creates a new array without it and saves the array back to the db. 
    Returns true if a contact was deleted, false if no matching contact was found. */
    delete(id) {
        const contacts = this._read();
        const filtered = contacts.filter(c => c.id !== id);
        if (filtered.length === contacts.length) return false;
        this._write(filtered);
        return true;
    }

    /* Searches for contacts that match the query in any of their fields.
    The search is case-insensitive and looks for the query as a substring in the name, phone, email or note fields. */
    search(userId, query) {
        const q = query.toLowerCase();
        return this.getAllByUser(userId).filter(c =>
            c.name.toLowerCase().includes(q)  ||
            c.phone.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.note.toLowerCase().includes(q)
        );
    }

    /* Deletes all contacts that belong to a specific user.
    This is used when a user deletes their account, to clean up their data. 
    It returns the number of deleted contacts. */
    deleteAllByUser(userId) {
        const contacts = this._read();
        const filtered = contacts.filter(c => c.userId !== userId);
        this._write(filtered);
        return contacts.length - filtered.length;
    }
}