// for mysql database 


const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

class Topscore {
    // Convert play time string to seconds (e.g., "1 min 2 sec" → 62)
    static convertPlayTimeToSeconds(playTime) {
        let seconds = 0;
        const minMatch = playTime.match(/(\d+)\s*min/);
        const secMatch = playTime.match(/(\d+)\s*sec/);

        if (minMatch) seconds += parseInt(minMatch[1]) * 60;
        if (secMatch) seconds += parseInt(secMatch[1]);

        return seconds;
    }

    // Create or update a top scorer entry
    static async createOrUpdateTopUser({ user_id, username, user_type, play_time, play_level, question_type }) {
        try {
            const checkQuery = `SELECT play_time, play_level FROM scorecard WHERE user_id = ? AND question_type = ? LIMIT 1`;
            const [rows] = await pool.query(checkQuery, [user_id, question_type]);

            const newPlayTimeSec = this.convertPlayTimeToSeconds(play_time);
            
            if (rows.length > 0) {
                const currentPlayTimeSec = this.convertPlayTimeToSeconds(rows[0].play_time);
                const currentPlayLevel = rows[0].play_level;

                // Update only if play_level is higher OR play_time is lower
                if (play_level >= currentPlayLevel ||  (play_level >= currentPlayLevel && newPlayTimeSec < currentPlayTimeSec)) {
                    const updateQuery = `
                        UPDATE scorecard 
                        SET username = ?, user_type = ?, play_time = ?, play_level = ?, question_type = ?
                        WHERE user_id = ? AND question_type = ?
                    `;
                    // await pool.query(updateQuery, [username, user_type, play_time, play_level, question_type, user_id]);
                    await pool.query(updateQuery, [username, user_type, play_time, play_level, question_type, user_id, question_type]);
                    return { message: "User updated with new play time or level" };
                } else {
                    return { message: "No update needed" };
                }
            }

            // User does not exist, insert new record
            // const insertQuery = `
            //     INSERT INTO scorecard (id, user_id, username, user_type, play_time, play_level, question_type) 
            //     VALUES (UUID(), ?, ?, ?, ?, ?, ?)
            // `;
            const insertQuery = `
                INSERT INTO scorecard (id, user_id, username, user_type, play_time, play_level, question_type) 
                VALUES (UUID(), ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    username = VALUES(username),
                    user_type = VALUES(user_type),
                    play_time = VALUES(play_time),
                    play_level = VALUES(play_level)
            `;
            await pool.query(insertQuery, [user_id, username, user_type, play_time, play_level, question_type]);
            return { message: "New user added to scorecard" };

        } catch (error) {
            console.error('Error in createOrUpdateTopUser:', error);
            throw error;
        }
    }

    // Get the top 10 unique users sorted by highest play_level, then lowest play_time
    static async getTopScorers(question_type) {
        try {
            const query = `
                SELECT user_id, username, user_type, play_time, play_level, question_type
                FROM scorecard
                WHERE question_type = ?
                GROUP BY user_id, username, user_type, question_type, play_time, play_level
                ORDER BY play_level DESC, play_time ASC
                LIMIT 10
            `;
            const [rows] = await pool.query(query, [question_type]);
            return rows;
        } catch (error) {
            console.error('Error fetching top scorers:', error);
            throw error;
        }
    }
}

module.exports = Topscore;