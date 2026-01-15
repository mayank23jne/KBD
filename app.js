const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const User = require('./models/User');
const Topscore = require('./models/Topscore');
const mysql = require('mysql2'); // Use mysql2 instead of mongoose

require('dotenv/config');

app.locals.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Middlewares
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware (For Authentication)
app.use(
  session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  }),
);

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
  if (req.query.id) {
    id = atob(req.query.id);
    username = atob(req.query.username);
  }
  res.render('login', { isUser: { id, username } });
  // res.redirect('/login');
});

app.get('/donate', (req, res) => {
  const key = Buffer.from(process.env.RAZORPAY_KEY).toString('base64');
  res.render('donate', { razor_key: key });
});
app.get('/logout', (req, res) => {
  req.session.destroy();
  // res.status(200);
  res.render('login', { isUser: { id: null, username: null } });
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
    fullname,
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
    fullname: user.fullname,
  };
  req.session.language = user.language_select;
  res.render('play', {
    language: req.session.language,
    username: user.username,
    userType: user.user_type,
    fullname: user.fullname,
  });
});

// app.get('/api/question', isAuthenticated, (req, res) => {
//     res.render('addquestion');
// });

app.get('/login', (req, res) => {
  // if (!req.session.visitedIndex) {
  //     // Redirect to index if / hasn't been visited
  //     return res.redirect('/');
  // }
  let id = null;
  let username = null;
  if (req.query.id) {
    id = atob(req.query.id);
    username = atob(req.query.username);
  }
  res.render('login', { isUser: { id, username } });
});

app.get('/login-with-google', async (req, res) => {
  const email = atob(req.query.email);
  const user = await User.findOneWithGoogle({ email });
  if (!user) {
    return res.redirect('/');
  }
  req.session.user = {
    id: user.id?.toString(),
    username: user.username,
    user_type: user.user_type || 'user',
    fullname: user.fullname,
  };
  req.session.save();
  res.render('loginWithGoogle', { req: req });
});

app.get('/api/question', (req, res) => {
  res.render('addquestion');
});

app.get('/privacy-policy', (req, res) => {
  res.render('privacy_policy');
});

const questionRoutes = require('./routes/add_filequestions');

app.use('/api/questions', questionRoutes); // Import the Topscore class

app.get('/api/scorecard', async (req, res) => {
  try {
    // Prevent repeated visits flag
    req.session.visitedIndex = false;

    // 1️⃣ Session check
    const userData = req.session.user;
    // console.log('Scorecard Session User Data:', userData);

    if (
      !userData ||
      !userData.id ||
      !userData.username ||
      !userData.user_type
    ) {
      return res.redirect('/login');
    }

    // 2️⃣ Extract user data safely
    const id = userData.id?.toString().trim();
    const username = userData.username?.trim() || 'Guest';
    const user_type = userData.user_type?.trim() || 'guest';
    const fullname = userData.fullname?.trim() || username;

    // ✅ FINAL display name (fullname optional)

    if (!id || id === 'null' || id === 'undefined') {
      return res.redirect('/login');
    }

    // 3️⃣ Fetch fullname from DB if not in session
    // if (!userFullname) {
    //   const [rows] = await db
    //     .promise()
    //     .query('SELECT fullname, username FROM users WHERE id = ? LIMIT 1', [
    //       id,
    //     ]);

    //   if (rows.length > 0) {
    //     userFullname = rows[0].fullname || rows[0].username || 'Player';
    //   } else {
    //     userFullname = username || 'Player';
    //   }

    //   // update session safely
    //   req.session.user = {
    //     ...req.session.user,
    //     fullname: userFullname,
    //   };

    //   // IMPORTANT: force save
    //   await new Promise((resolve, reject) => {
    //     req.session.save((err) => {
    //       if (err) {
    //         console.error('Session save failed:', err);
    //         reject(err);
    //       }
    //       resolve();
    //     });
    //   });
    // }

    // 4️⃣ Extract and validate query params
    const question_type = req.query.question_type?.trim() || '';
    const rawLevel = req.query.level;
    const level = Number.isInteger(Number(rawLevel))
      ? parseInt(rawLevel, 10)
      : null;
    const time = req.query.time
      ? decodeURIComponent(req.query.time)
      : '0 min 0 sec';
    const selected_level = req.query.selected_level || '';
    // console.log('Scorecard Query Params:', {
    //   question_type,
    //   rawLevel,
    //   level,
    //   time,
    //   selected_level,
    // });

    if (!question_type || level === null) {
      return res.redirect('/');
    }

    // 5️⃣ Initialize stats with safe defaults
    let question_score = 0,
      game_score = 0,
      time_score = '';
    let question_played = [],
      game_played = [],
      time_played = [];
    let userQuestionRank = '-',
      userGameRank = '-',
      userTimeRank = '-';

    // 6️⃣ Save or update top score (catch errors silently)
    try {
      await Topscore.createOrUpdateTopUser({
        user_id: id,
        username,
        user_type,
        play_time: time,
        play_level: level,
        question_type,
      });
    } catch {}

    // 7️⃣ Fetch Question stats
    try {
      const question_s = await Topscore.getUsedQuestionCount(id, question_type);
      question_score = question_s?.question_score || 0;

      const questionScores =
        await Topscore.getQuestionScoresWithRank(question_type);
      question_played = Array.isArray(questionScores) ? questionScores : [];

      const userQuestionRankData = await Topscore.getUserQuestionRank(
        id,
        question_type,
      );
      userQuestionRank = userQuestionRankData?.rank || '-';
    } catch {}

    // 8️⃣ Fetch Game stats
    try {
      const game_p = await Topscore.getUserGamePlayCount(id, question_type);
      game_score = game_p?.game_played || 0;

      const gameScores = await Topscore.getGameScoresWithRank(question_type);
      game_played = Array.isArray(gameScores) ? gameScores : [];

      const userGameRankData = await Topscore.getUserGameRank(
        id,
        question_type,
      );
      userGameRank = userGameRankData?.rank || '-';
    } catch {}

    // 9️⃣ Fetch Time stats
    try {
      const time_p = await Topscore.getUserTimePlayCount(id, question_type);
      time_score = time_p?.total_play_time || '';

      const timeScores = await Topscore.getTimeScoresWithRank(question_type);
      time_played = Array.isArray(timeScores) ? timeScores : [];

      const userTimeRankData = await Topscore.getUserTimeRank(
        id,
        question_type,
      );
      userTimeRank = userTimeRankData?.rank || '-';
    } catch {}

    // 10️⃣ Render scorecard safely
    res.render('scorecard', {
      username,
      fullname: fullname,
      id,
      user_type: user_type,
      questionType: question_type,
      level: level.toString(),
      time,
      selected_level: selected_level,
      question_score,
      question_played,
      userQuestionRank,
      game_score,
      game_played,
      userGameRank,
      time_score,
      time_played,
      userTimeRank,
    });
  } catch {
    res.status(500).send('Server Error - Check logs');
    res.status(500).send(`
    <h1>Server Error</h1>
    <pre>${err.message}</pre>
    <pre>${err.stack}</pre>
  `);
  }
});
app.get('/api/top-score', async (req, res) => {
  try {
    // console.log('========== TOP SCORE API HIT ==========');

    const user = req.session.user || {};
    const user_id = user.id || null;
    const questionType = 'Basic';

    const isLoggedIn = !!user_id; // true if user is logged in

    // ===== MY SCORES =====
    const questionData = isLoggedIn
      ? await Topscore.getUsedQuestionCount(user_id, questionType)
      : { question_score: 0 };
    const gameData = isLoggedIn
      ? await Topscore.getUserGamePlayCount(user_id, questionType)
      : { game_played: 0 };
    const timeData = isLoggedIn
      ? await Topscore.getUserTimePlayCount(user_id, questionType)
      : { total_play_time: '00h:00m:00s' };

    // console.log('QUESTION DATA =>', questionData);
    // console.log('GAME DATA =>', gameData);
    // console.log('TIME DATA =>', timeData);

    // ===== RANKED TABLES =====
    const question_played =
      await Topscore.getQuestionScoresWithRank(questionType);
    const game_played = await Topscore.getGameScoresWithRank(questionType);
    const time_played = await Topscore.getTimeScoresWithRank(questionType);

    // ===== USER RANKS =====
    const userQuestionRank = isLoggedIn
      ? await Topscore.getUserQuestionRank(user_id, questionType)
      : { rank: '-' };
    const userGameRank = isLoggedIn
      ? await Topscore.getUserGameRank(user_id, questionType)
      : { rank: '-' };
    const userTimeRank = isLoggedIn
      ? await Topscore.getUserTimeRank(user_id, questionType)
      : { rank: '-' };

    // ===== USER FULLNAME RESOLVE =====
    let userFullname = user.fullname || null;

    if (!userFullname && isLoggedIn) {
      // console.log('🔍 FULLNAME NOT IN SESSION, FETCHING FROM DB');

      const [rows] = await db
        .promise()
        .query('SELECT fullname, username FROM users WHERE id = ? LIMIT 1', [
          user_id,
        ]);

      // console.log('DB USER ROW =>', rows);

      if (rows.length > 0) {
        userFullname = rows[0].fullname || rows[0].username || 'Player';
      } else {
        userFullname = user.username || 'Player';
      }

      // Save fullname to session for future requests
      req.session.user = { ...req.session.user, fullname: userFullname };
    }

    // console.log('✅ FINAL USER FULLNAME =>', userFullname);

    // ===== FINAL RENDER =====
    res.render('top_rankers', {
      questionType,

      // MY SCORE
      game_score: gameData?.game_played || 0,
      question_score: questionData?.question_score || 0,
      time_score: timeData?.total_play_time || '00h:00m:00s',

      fullname: userFullname,
      username: user.username || null, // important: null if not logged in
      isLoggedIn, // boolean flag for template

      // TABLE DATA
      question_played,
      game_played,
      time_played,

      // RANKS
      userQuestionRank: userQuestionRank?.rank || '-',
      userGameRank: userGameRank?.rank || '-',
      userTimeRank: userTimeRank?.rank || '-',
    });
  } catch (err) {
    console.error('❌ TOP SCORE ERROR:', err);

    // Render fallback if error occurs
    res.render('top_rankers', {
      questionType: 'Basic',

      game_score: 0,
      question_score: 0,
      time_score: '00h:00m:00s',

      fullname: null,
      username: null,
      isLoggedIn: false,

      question_played: [],
      game_played: [],
      time_played: [],

      userQuestionRank: '-',
      userGameRank: '-',
      userTimeRank: '-',
    });
  }
});

// Connect to db
// mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true }, () =>
//     console.log('Connected to DB')
// );

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST, // MySQL host (e.g., localhost)
  user: process.env.DB_USER, // MySQL username
  password: process.env.DB_PASS, // MySQL password
  database: process.env.DB_NAME, // MySQL database name
  port: process.env.DB_PORT,
});

// Connect to MySQL Database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }
  // console.log('✅ Connected to MySQL');
});

// Listen to server
app.listen(process.env.PORT, () =>
  console.log(`Listening on http://localhost:${process.env.PORT}`),
);
