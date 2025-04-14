const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const mysql = require('mysql2'); // Use mysql2 instead of mongoose

require('dotenv/config');


// Middlewares
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware (For Authentication)
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Import Routes
const questionRoute = require('./routes/questions');
const userRoute = require('./routes/user');

// Routes Middlewares
app.use('/api', questionRoute);
app.use('/api', userRoute);

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next(); // Continue if the user is logged in
    } else {
        res.redirect('/'); // Redirect to login page if not authenticated
    }
};

// Routes
app.get('/', (req, res) => {
    req.session.visitedIndex = true;
    res.render('index');
});

// Protected Routes - Require Authentication
app.get('/play', isAuthenticated, (req, res) => {
    req.session.visitedIndex = false;
    const username = req.session.user ? req.session.user.username : 'Guest';
    res.render('play', { language: req.session.language , username: username});
});

// app.get('/api/question', isAuthenticated, (req, res) => {
//     res.render('addquestion');
// });

app.get('/login',  (req, res) => {
    if (!req.session.visitedIndex) {
        // Redirect to index if / hasn't been visited
        return res.redirect('/');
    }
    res.render('login');
});

app.get('/api/question', (req, res) => {
    res.render('addquestion');
});


const questionRoutes = require('./routes/add_filequestions');

app.use('/api/questions', questionRoutes);


const Topscore = require('./models/Topscore'); // Import the Topscore class

app.get('/api/scorecard', isAuthenticated, async (req, res) => {
    try {
        // Ensure user session exists
        req.session.visitedIndex = false;
        if (!req.session.user) {
            return res.redirect('/login'); // Redirect to login if not authenticated
        }
        // Extract user details from session
        const { id, username, user_type } = req.session.user;
        
        console.log(id,username,user_type  , req.session.user );
        // Get query parameters
        const { question_type, level, time } = req.query;

        if (!question_type || !level || !time) {
            return res.status(400).send("Missing required parameters");
        }

        // Save or update the user's score in the database
        await Topscore.createOrUpdateTopUser({
            user_id: id,
            username,
            user_type,
            play_time: time,
            play_level: parseInt(level),
            question_type
        });

        // Fetch the updated leaderboard (top 10 users)
        const topScorers = await Topscore.getTopScorers(question_type);

        // Render the scorecard page with top scorers
        res.render('scorecard', {
            username,
            questionType: question_type || '',
            level: level || '1',
            time: time || '',
            topScorers
        });

    } catch (error) {
        console.error("Error in /api/scorecard:", error);
        res.status(500).send("Internal Server Error");
    }
});




// Connect to db
// mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true }, () =>
//     console.log('Connected to DB')
// );


// Connect to MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,     // MySQL host (e.g., localhost)
    user: process.env.DB_USER,     // MySQL username
    password: process.env.DB_PASS, // MySQL password
    database: process.env.DB_NAME  // MySQL database name
});

// Connect to MySQL Database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL');
});


// Listen to server
app.listen(process.env.PORT, () => console.log('Listening on http://localhost:3000'));
