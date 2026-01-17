const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DBSOURCE = path.resolve(__dirname, 'db.sqlite');

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        // Create Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err);
            } else {
                // Insert admin user if not exists
                const insert = 'INSERT OR IGNORE INTO users (email, password, role) VALUES (?,?,?)';
                // Default password 'admin123' hashed
                const adminPass = '$2b$10$X7.G.M.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X'; // Placeholder hash, will fix in real logic
                // Actually, let's generate a real hash in a script or just handle registration.
                // For now, let's just create the table.
            }
        });

        // Create Rooms table
        db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      capacity INTEGER
    )`, (err) => {
            if (!err) {
                // Check if rooms exist, if not seed them
                db.get("SELECT count(*) as count FROM rooms", [], (err, row) => {
                    if (!err && row.count === 0) {
                        const insert = 'INSERT INTO rooms (name, type, capacity) VALUES (?,?,?)';
                        db.run(insert, ["Camera 1", "Single", 1]);
                        db.run(insert, ["Camera 2", "Double", 2]);
                        db.run(insert, ["Camera 3", "Suite", 4]);
                        db.run(insert, ["Camera 4", "Double", 2]);
                        db.run(insert, ["Camera 5", "Single", 1]);
                        db.run(insert, ["Camera 6", "Suite", 3]);
                        console.log("Seeded initial rooms");
                    }
                });
            }
        });

        // Create Reservations table
        db.run(`CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roomId INTEGER,
      startTime TEXT,
      endTime TEXT,
      guestName TEXT,
      notes TEXT,
      FOREIGN KEY(roomId) REFERENCES rooms(id)
    )`);
    }
});

module.exports = db;
