const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const User = require('./models/User');

const mysql = require('mysql2'); // Use mysql2 instead of mongoose

require('dotenv/config');

app.locals.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;


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
const donation = require('./routes/donationRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');

// Routes Middlewares
app.use('/api', questionRoute);
app.use('/api', userRoute);
app.use('/api', donation);
app.use('/api/razorpay', razorpayRoutes);

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
    // req.session.visitedIndex = true;
    // // res.render('index');
    // if (!req.session.visitedIndex) {
    //     // Redirect to index if / hasn't been visited
    //     return res.redirect('/');
    // }
    let id = null;
    let username = null;
    if(req.query.id){
        id = atob(req.query.id);
        username = atob(req.query.username);
    }
    res.render('login',{isUser: {id, username}});
    // res.redirect('/login');
});

app.get('/donate' , (req, res) => {
    const key = Buffer.from(process.env.RAZORPAY_KEY).toString('base64');
    res.render('donate', { razor_key: key });
})
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('login',{isUser: {id: null, username: null}});
});

// Protected Routes - Require Authentication

app.get('/play', isAuthenticated, (req, res) => {
    req.session.visitedIndex = false;

    // Fetch user data from session
    const userId = req.session.user?.id || '';
    const username = req.session.user?.username || 'Guest';
    const userType = req.session.user?.user_type || 'registered';
    const fullname = req.session.user?.fullname || username; // fallback to username if fullname not set

    // Render play.ejs with all required variables
    res.render('play', {
        language: req.session.language || 'en',
        userId,
        username,
        userType,
        fullname
    });
});


app.get('/play-with-google', async (req, res) => {
    const email = atob(req.query.email);
    const user = await User.findOneWithGoogle({ email });
    if (!user) { 
        return res.redirect('/');
    }
     req.session.user = {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        email: user.email,
        fullname: user.fullname
    };
    req.session.language = user.language_select;
    res.render('play', { language: req.session.language , username: user.username,  userType: user.user_type, fullname: user.fullname });
});

// app.get('/api/question', isAuthenticated, (req, res) => {
//     res.render('addquestion');
// });

app.get('/login',  (req, res) => {
    // if (!req.session.visitedIndex) {
    //     // Redirect to index if / hasn't been visited
    //     return res.redirect('/');
    // }
    let id = null;
    let username = null;
    if(req.query.id){
        id = atob(req.query.id);
        username = atob(req.query.username);
    }
    res.render('login',{isUser: {id, username}});
});

app.get('/login-with-google', async (req, res) => {
    const email = atob(req.query.email);
    const user = await User.findOneWithGoogle({ email });
    if (!user) { 
        return res.redirect('/');
    }
    req.session.user = {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        email: user.email
    };
    res.render('loginWithGoogle', { req: req });
});

app.get('/api/question', (req, res) => {
    res.render('addquestion');
});

app.get('/privacy-policy', (req, res) => {
    res.render('privacy_policy');
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

        // Fetch this user's rank
        const userRankData = await Topscore.getUserRank(id, question_type);
        const userRank = userRankData?.rank || 'N/A';

        // fetch used questions 
        const question_s = await Topscore.getUsedQuestionCount(id, question_type);
        const question_score = question_s.question_score;
        

        // fetch the questions played 
        const question_played = await Topscore.getQuestionScoresWithRank(question_type);

        //fetch user question rank 
        const userQuestionRankData = await Topscore.getUserQuestionRank(id, question_type);
        const userQuestionRank = userQuestionRankData?.rank || 'N/A';

        // fetch game played count 
        const game_p = await Topscore.getUserGamePlayCount(id, question_type);
        const game_score = game_p.game_played;

        // fetch the game played 
        const game_played = await Topscore.getGameScoresWithRank(question_type);

        //fetch user game rank 
        const userGameRankData = await Topscore.getUserGameRank(id, question_type);
        const userGameRank = userGameRankData?.rank || 'N/A';

        // fetch time played count 
        const time_p = await Topscore.getUserTimePlayCount(id, question_type);
        const time_score = time_p.total_play_time;

        // fetch the game played 
        const time_played = await Topscore.getTimeScoresWithRank(question_type);

        //fetch user game rank 
        const userTimeRankData = await Topscore.getUserTimeRank(id, question_type);
        const userTimeRank = userTimeRankData?.rank || 'N/A';

        
        // Render the scorecard page with top scorers
        res.render('scorecard', {
            username,
            id,
            user_type,
            questionType: question_type || '',
            level: level || '1',
            time: time || '',
            topScorers,
            userRank,
            question_score,
            question_played,
            userQuestionRank,
            game_score,
            game_played,
            userGameRank,
            time_score,
            time_played,
            userTimeRank
        });
    } catch (error) {
        console.error("Error in /api/scorecard:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/api/top-score', async (req, res) => {
    try {
      // Fetch data from your model/service
      const topScorers = await Topscore.getTopRanked();
  
      // Render view and send ranked data
      res.render('top_rankers', { topScorers });
  
    } catch (error) {
      console.error("Error fetching top scores:", error);
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
    database: process.env.DB_NAME,  // MySQL database name
    port: process.env.DB_PORT
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
app.listen(process.env.PORT, () => console.log(`Listening on http://localhost:${process.env.PORT}`));
