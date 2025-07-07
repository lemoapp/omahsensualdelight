const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
require('dotenv').config();
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname))); 

// Signup
app.post('/signup', (req, res) => {
  const {
    full_name,
    email,
    password,
    phone,
    address,
    city,
    state,
    country
  } = req.body;

  // Basic validation
  if (!full_name || !email || !password || !phone || !address || !city || !state || !country) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // SQL insert with all fields
  const query = `
    INSERT INTO users (full_name, email, password, phone, address, city, state, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(query, [full_name, email, password, phone, address, city, state, country], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email already exists' });
      }
      return res.status(500).json({ message: 'Database error', error: err });
    }
    return res.status(201).json({ message: 'Signup successful' });
  });
});


// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  pool.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.status(200).json({ message: 'Login successful', user: results[0] });
  });
});


app.get('/user-details', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const query = `
    SELECT full_name, email, phone, address, city, state, country 
    FROM users 
    WHERE email = ?
  `;

  pool.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
});


// Run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
