/**
 * @file initialData.js
 * @description Seeds the database with sample data on first run
 */

/**
 * Seeds initial users and contacts if the database is empty.
 * @param {UsersDB} usersDB
 * @param {DataDB}  dataDB
 */
function seedIfEmpty(usersDB, dataDB) {
    if (usersDB.getAllUsers().length > 0) {
        console.log("[Seed] Data already exists — skipping seed");
        return;
    }

    console.log("[Seed] Seeding initial data...");

    // Create users 
    const alice = usersDB.addUser({
        username: "alice",
        password: "1234",
        email:    "alice@test.com"
    });

    const bob = usersDB.addUser({
        username: "bob",
        password: "1234",
        email:    "bob@test.com"
    });

    // Alice's contacts 
    dataDB.add(alice.id, {
        name:  "Charlie Brown",
        phone: "050-1111111",
        email: "charlie@test.com",
        note:  "Old friend from school"
    });
    dataDB.add(alice.id, {
        name:  "Diana Prince",
        phone: "052-2222222",
        email: "diana@test.com",
        note:  "Work colleague"
    });
    dataDB.add(alice.id, {
        name:  "Eve Adams",
        phone: "054-3333333",
        email: "eve@test.com",
        note:  "Neighbor"
    });

    // Bob's contacts
    dataDB.add(bob.id, {
        name:  "Frank Castle",
        phone: "050-4444444",
        email: "frank@test.com",
        note:  "Gym partner"
    });
    dataDB.add(bob.id, {
        name:  "Grace Hopper",
        phone: "052-5555555",
        email: "grace@test.com",
        note:  "Tech mentor"
    });
    dataDB.add(bob.id, {
        name:  "Hank Pym",
        phone: "054-6666666",
        email: "hank@test.com",
        note:  "Client"
    });

    console.log("[Seed] Done — 2 users, 3 contacts each");
    console.log("[Seed] Login with: alice/1234  or  bob/1234");
}