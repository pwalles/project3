class UsersDB {
    constructor() {
        this.storageKey = "users_db";
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

    _write(users) {
        localStorage.setItem(this.storageKey, JSON.stringify(users));
    }

    _generateId() {
        return "u_" + Date.now();
    }

    getAllUsers() {
        return this._read();
    }

    getUserById(id) {
        return this._read().find(u => u.id === id) || null;
    }

    getUserByUsername(username) {
        return this._read().find(u => u.username === username) || null;
    }

    isUsernameTaken(username) {
        return this.getUserByUsername(username) !== null;
    }

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

    deleteUser(id) {
        const users    = this._read();
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) return false;
        this._write(filtered);
        return true;
    }
}