// for mysql database

const mysql = require('mysql2/promise');
require('dotenv').config();

// // Create MySQL connection pool
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME
// });

const pool = require('../db');

class Topscore {
  // // Convert play time string to seconds (e.g., "1 min 2 sec" → 62)
  // static convertPlayTimeToSeconds(playTime) {
  //     let seconds = 0;
  //     const minMatch = playTime.match(/(\d+)\s*min/);
  //     const secMatch = playTime.match(/(\d+)\s*sec/);

  //     if (minMatch) seconds += parseInt(minMatch[1]) * 60;
  //     if (secMatch) seconds += parseInt(secMatch[1]);

  //     return seconds;
  // }

  // // Create or update a top scorer entry
  // static async createOrUpdateTopUser({ user_id, username, user_type, play_time, play_level, question_type }) {
  //     try {
  //         const checkQuery = `SELECT play_time, play_level FROM scorecard WHERE user_id = ? AND question_type = ? LIMIT 1`;
  //         const [rows] = await pool.query(checkQuery, [user_id, question_type]);

  //         const newPlayTimeSec = this.convertPlayTimeToSeconds(play_time);

  //         if (rows.length > 0) {
  //             const currentPlayTimeSec = this.convertPlayTimeToSeconds(rows[0].play_time);
  //             const currentPlayLevel = rows[0].play_level;

  //             // Update only if play_level is higher OR play_time is lower
  //             if (play_level >= currentPlayLevel ||  (play_level >= currentPlayLevel && newPlayTimeSec < currentPlayTimeSec)) {
  //                 const updateQuery = `
  //                     UPDATE scorecard
  //                     SET username = ?, user_type = ?, play_time = ?, play_level = ?, question_type = ?
  //                     WHERE user_id = ? AND question_type = ?
  //                 `;
  //                 // await pool.query(updateQuery, [username, user_type, play_time, play_level, question_type, user_id]);
  //                 await pool.query(updateQuery, [username, user_type, play_time, play_level, question_type, user_id, question_type]);
  //                 return { message: "User updated with new play time or level" };
  //             } else {
  //                 return { message: "No update needed" };
  //             }
  //         }

  //         // User does not exist, insert new record
  //         // const insertQuery = `
  //         //     INSERT INTO scorecard (id, user_id, username, user_type, play_time, play_level, question_type)
  //         //     VALUES (UUID(), ?, ?, ?, ?, ?, ?)
  //         // `;
  //         const insertQuery = `
  //             INSERT INTO scorecard (id, user_id, username, user_type, play_time, play_level, question_type)
  //             VALUES (UUID(), ?, ?, ?, ?, ?, ?)
  //             ON DUPLICATE KEY UPDATE
  //                 username = VALUES(username),
  //                 user_type = VALUES(user_type),
  //                 play_time = VALUES(play_time),
  //                 play_level = VALUES(play_level)
  //         `;
  //         await pool.query(insertQuery, [user_id, username, user_type, play_time, play_level, question_type]);
  //         return { message: "New user added to scorecard" };

  //     } catch (error) {
  //         console.error('Error in createOrUpdateTopUser:', error);
  //         throw error;
  //     }
  // }

  static convertPlayTimeToSeconds(playTime) {
    let seconds = 0;
    if (!playTime) return 0;

    const hrMatch = playTime.match(/(\d+)\s*h/);
    const minMatch = playTime.match(/(\d+)\s*m/);
    const secMatch = playTime.match(/(\d+)\s*s/);

    if (hrMatch) seconds += parseInt(hrMatch[1]) * 3600;
    if (minMatch) seconds += parseInt(minMatch[1]) * 60;
    if (secMatch) seconds += parseInt(secMatch[1]);

    return seconds;
  }

  static formatSecondsToHMS(totalSeconds) {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      '0',
    );
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}h:${minutes}m:${seconds}s`;
  }

  static async createOrUpdateTopUser({
    user_id,
    username,
    user_type,
    play_time,
    play_level,
    question_type,
  }) {
    try {
      const newPlayTimeSec = this.convertPlayTimeToSeconds(play_time);
      const formattedPlayTime = this.formatSecondsToHMS(newPlayTimeSec);

      const checkQuery = `
                SELECT play_time, play_level, total_play_time, game_played, username, user_type 
                FROM scorecard 
                WHERE user_id = ? AND question_type = ? 
                LIMIT 1
            `;
      const [rows] = await pool.query(checkQuery, [user_id, question_type]);

      if (rows.length > 0) {
        const existing = rows[0];

        const currentPlayTimeSec = this.convertPlayTimeToSeconds(
          existing.play_time,
        );
        const currentPlayLevel = existing.play_level;
        const existingTotalTimeSec = this.convertPlayTimeToSeconds(
          existing.total_play_time,
        );
        const updatedTotalSeconds = existingTotalTimeSec + newPlayTimeSec;
        const formattedTotalTime = this.formatSecondsToHMS(updatedTotalSeconds);
        const updatedGamePlayed = (existing.game_played || 0) + 1;

        // ✅ Skip update if all data is the same
        if (
          username === existing.username &&
          user_type === existing.user_type &&
          formattedPlayTime === existing.play_time &&
          play_level === existing.play_level
        ) {
          return { message: 'No update needed — data is already up to date' };
        }

        // ✅ Update only if higher score or lower time at same/higher level
        if (
          play_level > currentPlayLevel ||
          (play_level === currentPlayLevel &&
            newPlayTimeSec < currentPlayTimeSec)
        ) {
          const updateQuery = `
                        UPDATE scorecard 
                        SET 
                            username = ?, 
                            user_type = ?, 
                            play_time = ?, 
                            total_play_time = ?, 
                            game_played = ?, 
                            play_level = ?
                        WHERE user_id = ? AND question_type = ?
                    `;
          await pool.query(updateQuery, [
            username,
            user_type,
            formattedPlayTime,
            formattedTotalTime,
            updatedGamePlayed,
            play_level,
            user_id,
            question_type,
          ]);

          return { message: 'User updated with improved score/time' };
        }
      }

      // 🚀 First-time insert
      const insertQuery = `
                INSERT INTO scorecard 
                    (id, user_id, username, user_type, play_time, total_play_time, game_played, play_level, question_type) 
                VALUES 
                    (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    username = VALUES(username),
                    user_type = VALUES(user_type),
                    play_time = VALUES(play_time),
                    play_level = VALUES(play_level)
            `;
      await pool.query(insertQuery, [
        user_id,
        username,
        user_type,
        formattedPlayTime,
        formattedPlayTime,
        1,
        play_level,
        question_type,
      ]);

      return { message: 'New user added to scorecard' };
    } catch (error) {
      console.error('Error in createOrUpdateTopUser:', error);
      throw error;
    }
  }

  // Get the top 10 unique users sorted by highest play_level, then lowest play_time
  static async getTopScorers(question_type) {
    try {
      // const query = `
      //     SELECT user_id, username, user_type, play_time, play_level, question_type
      //     FROM scorecard
      //     WHERE question_type = ?
      //     GROUP BY user_id, username, user_type, question_type, play_time, play_level
      //     ORDER BY play_level DESC, play_time ASC

      // `;

      const query = `
                SELECT 
                    @rank := @rank + 1 AS \`rank\`,
                    user_id,
                    username,
                    user_type,
                    play_time,
                    play_level,
                    question_type
                FROM (
                    SELECT 
                        user_id,
                        username,
                        user_type,
                        play_time,
                        play_level,
                        question_type
                    FROM scorecard
                    WHERE question_type = "Basic"
                    AND user_type != "guest"
                    GROUP BY user_id, username, user_type, question_type, play_time, play_level
                    ORDER BY play_level DESC, play_time ASC
                ) AS sorted_scores
                CROSS JOIN (SELECT @rank := 0) AS vars;
            `;

      const [rows] = await pool.query(query, [question_type]);
      return rows;
    } catch (error) {
      console.error('Error fetching top scorers:', error);
      throw error;
    }
  }

  static async getUserRank(user_id, question_type) {
    try {
      const query = `
                SELECT * FROM (
                    SELECT 
                        user_id,
                        username,
                        user_type,
                        play_time,
                        play_level,
                        question_type,
                        @rank := @rank + 1 AS \`rank\`
                    FROM (
                        SELECT 
                            user_id,
                            username,
                            user_type,
                            play_time,
                            play_level,
                            question_type
                        FROM scorecard
                        WHERE question_type = ?
                        GROUP BY user_id, username, user_type, question_type, play_time, play_level
                        ORDER BY play_level DESC, play_time ASC
                    ) AS ordered_scores
                    CROSS JOIN (SELECT @rank := 0) AS vars
                ) AS ranked
                WHERE user_id = ?;
            `;

      const [rows] = await pool.query(query, [question_type, user_id]);
      return rows[0]; // Should return one row for the given user_id
    } catch (error) {
      console.error('Error fetching user rank:', error);
      throw error;
    }
  }

  static async getUsedQuestionCount(user_id, question_type) {
    try {
      const query = `
                SELECT COUNT(*) AS question_score 
                FROM used_questions uq
                INNER JOIN questions q ON q.id = uq.question_id
                WHERE q.question_type = ?
                AND uq.user_id = ?
                AND uq.used_datetime IS NOT NULL
            `;
      const [rows] = await pool.query(query, [question_type, user_id]);
      return rows[0]; // returns { question_score: number }
    } catch (error) {
      console.error('Error fetching used question count:', error);
      throw error;
    }
  }

  static async getQuestionScoresWithRank(questionType) {
    try {
      const query = `
            SELECT * FROM (
                SELECT 
                    user_id,
                    CASE 
                        WHEN user_type = 'guest' THEN 'Guest'
                        ELSE username
                    END AS username,
                    fullname,
                    question_score,
                    @rank := @rank + 1 AS \`rank\`
                FROM (
                    SELECT 
                        used_questions.user_id,
                        users.username,
                        users.fullname,
                        users.user_type,
                        COUNT(*) AS question_score
                    FROM used_questions 
                    INNER JOIN questions ON questions.id = used_questions.question_id
                    INNER JOIN users ON users.id = used_questions.user_id
                    WHERE questions.question_type = ?
                      AND used_questions.used_datetime IS NOT NULL
                      AND users.user_type != 'guest'
                    GROUP BY used_questions.user_id, users.username, users.fullname, users.user_type
                    ORDER BY question_score DESC
                ) AS ordered_scores
                CROSS JOIN (SELECT @rank := 0) AS vars
            ) AS ranked;
        `;

      const [rows] = await pool.query(query, [questionType]);
      return rows;
    } catch (error) {
      console.error('Error fetching ranked question scores:', error);
      throw error;
    }
  }

  static async getTopRanked() {
    try {
      const query = `
        SELECT * FROM (
            SELECT 
                user_id,
                CASE 
                    WHEN user_type = 'guest' THEN 'Guest'
                    ELSE username
                END AS username,
                fullname,  -- 👈 Added fullname here
                question_score,
                @rank := @rank + 1 AS \`rank\`
            FROM (
                SELECT 
                    used_questions.user_id,
                    users.username, v       
                    users.fullname,      -- 👈 Select fullname from users table
                    users.user_type,
                    COUNT(*) AS question_score
                FROM used_questions 
                INNER JOIN questions ON questions.id = used_questions.question_id
                INNER JOIN users ON users.id = used_questions.user_id
                WHERE used_questions.used_datetime IS NOT NULL
                  AND users.user_type != 'guest'
                GROUP BY used_questions.user_id, users.username, users.fullname, users.user_type
                ORDER BY question_score DESC
            ) AS ordered_scores
            CROSS JOIN (SELECT @rank := 0) AS vars
        ) AS ranked;
        `;

      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error fetching ranked question scores:', error);
      throw error;
    }
  }

  static async getUserQuestionRank(user_id, question_type) {
    try {
      const query = `
                SELECT * FROM (
                    SELECT 
                        user_id,
                        CASE 
                            WHEN user_type = 'guest' THEN 'Guest'
                            ELSE username
                        END AS username,
                        fullname,
                        question_score,
                        @rank := @rank + 1 AS \`rank\`
                    FROM (
                        SELECT 
                            used_questions.user_id,
                            users.username,
                            users.fullname,
                            users.user_type,
                            COUNT(*) AS question_score
                        FROM used_questions 
                        INNER JOIN questions ON questions.id = used_questions.question_id
                        INNER JOIN users ON users.id = used_questions.user_id
                        WHERE questions.question_type = ?
                        AND used_questions.used_datetime IS NOT NULL
                        GROUP BY used_questions.user_id, users.username, users.fullname, users.user_type
                        ORDER BY question_score DESC
                    ) AS ordered_scores
                    CROSS JOIN (SELECT @rank := 0) AS vars
                ) AS ranked
                WHERE user_id = ?;
            `;

      const [rows] = await pool.query(query, [question_type, user_id]);
      return rows[0]; // Returns one row for the given user_id
    } catch (error) {
      console.error('Error fetching user question rank:', error);
      throw error;
    }
  }

  static async getUserGamePlayCount(user_id, question_type) {
    try {
      const query = `
                SELECT game_played AS game_played 
                FROM scorecard
                WHERE question_type = ?
                AND user_id = ?
            `;
      const [rows] = await pool.query(query, [question_type, user_id]);
      return rows[0]; // returns { game_played: number }
    } catch (error) {
      console.error('Error fetching used game played count:', error);
      throw error;
    }
  }

  static async getGameScoresWithRank(questionType) {
    try {
      const query = `
            SELECT * FROM (
                SELECT 
                    user_id,
                    CASE 
                        WHEN user_type = 'guest' THEN 'Guest'
                        ELSE username
                    END AS username,
                    fullname,
                    game_played,
                    @rank := @rank + 1 AS \`rank\`
                FROM (
                    SELECT 
                        scorecard.user_id,
                        users.username,
                        users.fullname,
                        users.user_type,
                        scorecard.game_played
                    FROM scorecard 
                    INNER JOIN users ON users.id = scorecard.user_id
                    WHERE scorecard.question_type = ?
                    AND users.user_type != 'guest'
                    GROUP BY scorecard.user_id, users.username, users.fullname, users.user_type, scorecard.game_played
                    ORDER BY game_played DESC
                ) AS ordered_scores
                CROSS JOIN (SELECT @rank := 0) AS vars
            ) AS ranked;
        `;

      const [rows] = await pool.query(query, [questionType]);
      return rows;
    } catch (error) {
      console.error('Error fetching ranked game scores:', error);
      throw error;
    }
  }

  static async getUserGameRank(user_id, question_type) {
    try {
      const query = `
                SELECT * FROM (
                    SELECT 
                        user_id,
                        CASE 
                            WHEN user_type = 'guest' THEN 'Guest'
                            ELSE username
                        END AS username,
                        fullname,
                        game_played,
                        @rank := @rank + 1 AS \`rank\`
                    FROM (
                        SELECT 
                            scorecard.user_id,
                            users.username,
                            users.fullname,
                            users.user_type,
                            scorecard.game_played
                        FROM scorecard 
                        INNER JOIN users ON users.id = scorecard.user_id
                        WHERE scorecard.question_type = ?
                        GROUP BY scorecard.user_id, users.username, users.fullname, users.user_type, scorecard.game_played
                        ORDER BY game_played DESC
                    ) AS ordered_scores
                    CROSS JOIN (SELECT @rank := 0) AS vars
                ) AS ranked
                WHERE user_id = ?;
            `;

      const [rows] = await pool.query(query, [question_type, user_id]);
      return rows[0]; // Returns one row for the given user_id
    } catch (error) {
      console.error('Error fetching user game rank:', error);
      throw error;
    }
  }

  static async getUserTimePlayCount(user_id, question_type) {
    try {
      const query = `
                SELECT total_play_time AS total_play_time 
                FROM scorecard
                WHERE question_type = ?
                AND user_id = ?
            `;
      const [rows] = await pool.query(query, [question_type, user_id]);
      return rows[0]; // returns { game_played: number }
    } catch (error) {
      console.error('Error fetching used time played count:', error);
      throw error;
    }
  }

  static async getTimeScoresWithRank(questionType) {
    try {
      const query = `
                SELECT * FROM (
                    SELECT 
                        user_id,
                        CASE 
                            WHEN user_type = 'guest' THEN 'Guest'
                            ELSE username
                        END AS username,
                        fullname,
                        total_play_time,
                        @rank := @rank + 1 AS \`rank\`
                    FROM (
                        SELECT 
                            scorecard.user_id,
                            users.username,
                            users.fullname,
                            users.user_type,
                            scorecard.total_play_time
                        FROM scorecard 
                        INNER JOIN users ON users.id = scorecard.user_id
                        WHERE scorecard.question_type = ?
                        AND users.user_type != 'guest'
                        GROUP BY scorecard.user_id, users.username, users.fullname, users.user_type, scorecard.total_play_time
                        ORDER BY total_play_time DESC
                    ) AS ordered_scores
                    CROSS JOIN (SELECT @rank := 0) AS vars
                ) AS ranked;
            `;

      const [rows] = await pool.query(query, [questionType]);
      return rows;
    } catch (error) {
      console.error('Error fetching ranked time scores:', error);
      throw error;
    }
  }

  static async getUserTimeRank(user_id, question_type) {
    try {
      const query = `
                SELECT * FROM (
                    SELECT 
                        user_id,
                        CASE 
                            WHEN user_type = 'guest' THEN 'Guest'
                            ELSE username
                        END AS username,
                        fullname,
                        total_play_time,
                        @rank := @rank + 1 AS \`rank\`
                    FROM (
                        SELECT 
                            scorecard.user_id,
                            users.username,
                            users.fullname,
                            users.user_type,
                            scorecard.total_play_time
                        FROM scorecard 
                        INNER JOIN users ON users.id = scorecard.user_id
                        WHERE scorecard.question_type = ?
                        GROUP BY scorecard.user_id, users.username, users.fullname, users.user_type, scorecard.total_play_time
                        ORDER BY total_play_time DESC
                    ) AS ordered_scores
                    CROSS JOIN (SELECT @rank := 0) AS vars
                ) AS ranked
                WHERE user_id = ?;
            `;

      const [rows] = await pool.query(query, [question_type, user_id]);
      return rows[0]; // Returns one row for the given user_id
    } catch (error) {
      console.error('Error fetching user time rank:', error);
      throw error;
    }
  }
}

module.exports = Topscore;
