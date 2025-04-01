


// for mysql database

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const e = require('express');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, userType = 'registered' } = req.body;

        // Validation
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        // Create new user
        await User.createUser({ username, email, password, userType });

        // Retrieve newly created user
        const user = await User.findOne({ username });
        console.log(user)
        let user_name;
        if (user.user_type === 'guest'){
            user_name = "Guest"
        }
        else{
            user_name = user.username;
        }
        // Set session with user info
        req.session.user = {
            id: user.id,
            username: user_name,
            user_type: user.user_type
        };
        req.session.language = user.language_select;

        res.status(200).json({
            message: 'User registered successfully!',
            redirectUrl: '/api/index',
        });
    } catch (err) {
        console.error('❌ Error registering user:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password.' });
        }


        // Compare passwords
        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password.' });
        }

        // Set session with user info
        req.session.user = {
            id: user.id,
            username: user.username,
            user_type: user.user_type
        };
        req.session.language = user.language_select;

        res.status(200).json({
            message: 'Login successful!',
            redirectUrl: '/api/index',
        });
    } catch (err) {
        console.error('❌ Error during login:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

module.exports = router;
