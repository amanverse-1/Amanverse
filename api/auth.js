const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get Admin Credentials from Environment Variables (with fallback)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { email: adminEmail }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );
    
    res.json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
