const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Room Manager API is running' });
});

// Auth Routes
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_12345'; // Store in .env

app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const sql = 'INSERT INTO users (email, password) VALUES (?,?)';
    const params = [email, hash];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'User created successfully', id: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';

    db.get(sql, email, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        // For the initial "admin" hardcoded or seeded users, we might not have hashed passwords if we seeded manually.
        // Ideally we seed with a hash.

        if (bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, email: user.email, role: user.role }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Middleware to Verify Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Rooms API
app.get('/api/rooms', authenticateToken, (req, res) => {
    db.all('SELECT * FROM rooms', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            rooms: rows,
            message: 'success'
        });
    });
});

// Reservations API
app.get('/api/reservations', authenticateToken, (req, res) => {
    db.all('SELECT * FROM reservations', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            reservations: rows,
            message: 'success'
        });
    });
});

app.post('/api/reservations', authenticateToken, (req, res) => {
    const { roomId, startTime, endTime, guestName, notes } = req.body;
    const sql = 'INSERT INTO reservations (roomId, startTime, endTime, guestName, notes) VALUES (?,?,?,?,?)';
    const params = [roomId, startTime, endTime, guestName, notes];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: 'success',
            id: this.lastID,
            ...req.body
        });
    });
});

app.put('/api/reservations/:id', authenticateToken, (req, res) => {
    const { roomId, startTime, endTime, guestName, notes } = req.body;
    const sql = `UPDATE reservations SET 
               roomId = COALESCE(?, roomId), 
               startTime = COALESCE(?, startTime), 
               endTime = COALESCE(?, endTime), 
               guestName = COALESCE(?, guestName), 
               notes = COALESCE(?, notes) 
               WHERE id = ?`;
    const params = [roomId, startTime, endTime, guestName, notes, req.params.id];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: 'success',
            changes: this.changes
        });
    });
});

app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM reservations WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});

app.listen(PORT, () => {
    // Seed admin user on start if not exists (for demo)
    const adminEmail = 'admin@example.com';
    const adminPass = 'admin123';

    db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
        if (!row) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(adminPass, salt);
            db.run('INSERT INTO users (email, password, role) VALUES (?,?,?)', [adminEmail, hash, 'admin']);
            console.log(`Created default admin user: ${adminEmail} / ${adminPass}`);
        }
    });

    console.log(`Server running on port ${PORT}`);
});
