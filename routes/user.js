


// for mysql database

const express = require('express');
const router = express.Router();
const User = require('../models/User');


require('dotenv').config(); // Make sure this is at the top

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, email, mobile, password, confirmPassword, userType = 'registered' } = req.body;

        // Validation
        if (!username || !email || !mobile || !password || !confirmPassword) {
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
        await User.createUser({ username, email, mobile, password, userType });

        // Retrieve newly created user
        const user = await User.findOne({ username });
        console.log(user)
        let user_name;
        if (user.user_type === 'guest') {
            user_name = "Guest"
        }
        else {
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
            redirectUrl: `/play?id=${btoa(user.id)}&username=${btoa(user.username)}`,
        });
    } catch (err) {
        console.error('❌ Error registering user:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

router.post('/register-with-google', async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOneWithGoogle({ email: email });

        if (existingUser) {
            return res.status(200).json({
                status: true,
                message: 'User already exists.',
                redirectUrl: `/login-with-google?email=${btoa(email)}`,
            });
        }
        // Create new user
        await User.createUser({ username, email, mobile: null, password: '', userType: 'google' });
        const redirectUrl = `/login-with-google?email=${btoa(email)}`;
        res.status(200).json({
            status: true,
            message: 'User registered successfully!',
            redirectUrl: redirectUrl,
        });
    } catch (err) {

        console.error('❌ Error registering user:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

router.post('/login-with-google', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOneWithGoogle({ email: email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email.' });
        }
        res.status(200).json({
            status: true,
            message: 'User login successfully!',
            redirectUrl: `/play?id=${btoa(user.id)}&username=${btoa(user.username)}`,
        });
    } catch (err) {
        console.error('❌ Error login user:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, id } = req.body;
        let user = null;
        if (id) {
            user = await User.findOne({ id });
            if (!user) {
                return res.status(400).json({ error: 'Invalid id.' });
            }
        } else {
            // Validate input
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required.' });
            }

            // Find user by username
            user = await User.findOne({ username });
            if (!user) {
                return res.status(400).json({ error: 'Invalid username or password.' });
            }


            // Compare passwords
            const isMatch = await User.comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid username or password.' });
            }
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
            redirectUrl: `/play?id=${btoa(user.id)}&username=${btoa(user.username)}`,
        });
    } catch (err) {
        console.error('❌ Error during login:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});


const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Load from .env
const client = new OAuth2Client(CLIENT_ID);

router.post('/google-token', async (req, res) => {
    try {
        const { id_token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const username = payload.name;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            // Create new user
            await User.createUser({ username, email, mobile: null, password: '' });
        }

        // Retrieve newly created user
        const user = await User.findOne({ email });
        console.log(user)
        let user_name;
        if (user.user_type === 'guest') {
            user_name = "Guest"
        }
        else {
            user_name = user.username;
        }
        // Set session with user info
        req.session.user = {
            id: user.id,
            username: user_name,
            user_type: user.user_type
        };

        res.json({ redirectUrl: "/play" });
    } catch (err) {
        console.error('❌ Token verification failed:', err);
        res.status(401).json({ error: "Invalid token" });
    }
});

router.get('/get-user', async (req, res) => {
    const user_id = req.query.id;
    const decodedId = atob(user_id);
    const user = await User.findOne({ id: decodedId });
    res.json(user);
});

router.post('/update-user', async (req, res) => {
    const { id, username } = req.body;
    console.log(id, username);
    await User.updateOne(id, username);
    res.json({ message: 'User updated successfully!' });
});


module.exports = router;
