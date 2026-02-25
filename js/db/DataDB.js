class DataDB {
    constructor() {
        this.storageKey = "data_db";
        this._init();
    }

    _init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    _read() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    _write(contacts) {
        localStorage.setItem(this.storageKey, JSON.stringify(contacts));
    }

    _generateId() {
        return "c_" + Date.now();
    }

    getAllByUser(userId) {
        return this._read().filter(c => c.userId === userId);
    }

    getById(id) {
        return this._read().find(c => c.id === id) || null;
    }

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

    delete(id) {
        const contacts = this._read();
        const filtered = contacts.filter(c => c.id !== id);
        if (filtered.length === contacts.length) return false;
        this._write(filtered);
        return true;
    }

    search(userId, query) {
        const q = query.toLowerCase();
        return this.getAllByUser(userId).filter(c =>
            c.name.toLowerCase().includes(q)  ||
            c.phone.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.note.toLowerCase().includes(q)
        );
    }

    deleteAllByUser(userId) {
        const contacts = this._read();
        const filtered = contacts.filter(c => c.userId !== userId);
        this._write(filtered);
        return contacts.length - filtered.length;
    }
}