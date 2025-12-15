// const { type, required } = require('@hapi/joi/lib/types/object');
// const mongoose = require('mongoose');

// const QuestionSchema = mongoose.Schema({
//     question: {
//         type: String,
//         required: true
//     },
//     option1: {
//         type: String,
//         required: true
//     },
//     option2: {
//         type: String,
//         required: true
//     },
//     option3: {
//         type: String,
//         required: true
//     },
//     option4: {
//         type: String,
//         required: true
//     },
//     answer: {
//         type: Number,
//         required: true
//     },
//     slot: {
//         type: Number,
//         required: true
//     },
//     question_type: {
//         type: String,
//         required: true
//     },
//     language_select: {
//         type: String,
//         required: true
//     }
// });





// const localizedStringSchema = new mongoose.Schema({
//     en: { type: String, required: true },
//     hi: { type: String, required: true }
// });

// const QuestionSchema = new mongoose.Schema({
//     question: { type: localizedStringSchema, required: true },
//     option1: { type: localizedStringSchema, required: true },
//     option2: { type: localizedStringSchema, required: true },
//     option3: { type: localizedStringSchema, required: true },
//     option4: { type: localizedStringSchema, required: true },
//     explanation: { type: localizedStringSchema },
//     answer: { type: Number, required: true }, // Store the correct option number (1-4)
//     slot: { type: Number, required: true },
//     level: { type: Number, required: true },
//     question_type: { type: String, required: true },
//     user_id: { type: String, required: false }
// });

// module.exports = mongoose.model('Questions', QuestionSchema);






// for mysql database 

const mysql = require('mysql2/promise');
require('dotenv').config();

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

const pool = require('../db');

class Question {
    // Create a new question
    static async createQuestion({ question, option1, option2, option3, option4, FixOption, explanation, answer, slot, level, question_type, user_id = '' }) {
        try {
            const query = `
                INSERT INTO questions (
                    id, question, option1, option2, option3, option4, FixOption, explanation, answer, slot, level, question_type, user_id
                ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                question, option1, option2, option3, option4, FixOption, explanation, answer, slot, level, question_type, user_id
            ]);
            return result.insertId; // Return the newly inserted question ID
        } catch (error) {
            console.error('❌ Error creating question:', error);
            throw new Error('Database error: Failed to create question');
        }
    }

    // Find a question by ID
    static async findById(questionId) {
        try {
            let query = 'SELECT * FROM questions WHERE id = ?';

            const [rows] = await pool.query(query, [questionId]);

            if (!rows.length) return null;

            // Parse JSON fields
            const question = rows[0];
            question.explanation = JSON.parse(question.explanation);
            question.question = JSON.parse(question.question);
            question.option1 = JSON.parse(question.option1);
            question.option2 = JSON.parse(question.option2);
            question.option3 = JSON.parse(question.option3);
            question.option4 = JSON.parse(question.option4);
            question._id = question.id;
            
            return question;
        } catch (error) {
            console.error('❌ Error finding question by ID:', error);
            throw new Error('Database error: Failed to find question');
        }
    }


    // Count questions by filter
    static async countByFilter({ slot, user_id = '', question_type = null }) {
        // try {
        //     let query = `
        //         SELECT COUNT(*) AS count FROM questions
        //         WHERE slot = ? AND user_id = ?
        //     `;
        //     const values = [slot, user_id];

        //     if (question_type) {
        //         query += ' AND question_type = ?';
        //         values.push(question_type);
        //     }

        //     const [rows] = await pool.query(query, values);
        //     return rows[0].count || 0;
        // } catch (error) {
        //     console.error('❌ Error counting questions:', error);
        //     throw new Error('Database error: Failed to count questions');
        // }

        try {
            let query = `
                SELECT COUNT(*) AS count FROM questions q
                WHERE q.slot = ?
                AND q.id NOT IN (
                    SELECT uq.question_id FROM used_questions uq WHERE uq.user_id = ?
                )
            `;
            const values = [slot, user_id];
    
            if (question_type) {
                query += ' AND q.question_type = ?';
                values.push(question_type);
            }
    
            const [rows] = await pool.query(query, values);
            return rows[0].count || 0;
        } catch (error) {
            console.error('❌ Error counting questions:', error);
            throw new Error('Database error: Failed to count questions');
        }
    }

    // Find a random question by slot and parse JSON fields
    static async findRandomBySlot({ slot, user_id = '', question_type = null, questionId = null }) {

        try {
            // Count the total number of unused questions
            let totalCountQuery = `
                SELECT COUNT(*) AS total FROM questions q
                WHERE q.slot = ? AND q.question_type = ? 
            `;
    
            let values = [slot ,question_type];
    
            if (user_id) {
                totalCountQuery += ` AND q.id NOT IN (SELECT uq.question_id FROM used_questions uq WHERE uq.user_id = ?)`;
                values.push(user_id);
            }
            console.log(totalCountQuery,values)
            const [countResult] = await pool.query(totalCountQuery, values);
            const totalCount = countResult[0].total;
    
            if (totalCount === 0) return null;
    
            const randomOffset = Math.floor(Math.random() * totalCount);
    
            // Fetch a random unused question
            let query = `
                SELECT * FROM questions q
                WHERE q.slot = ? 
            `;
    
            values = [slot];
    
            if (user_id) {
                query += ` AND q.id NOT IN (SELECT uq.question_id FROM used_questions uq WHERE uq.user_id = ?)`;
                values.push(user_id);
            }
    
            if (question_type) {
                query += ' AND q.question_type = ?';
                values.push(question_type);
            }
    
            if (questionId) {
                query += ' AND q.id != ?';
                values.push(questionId);
            }
    
            query += ' LIMIT 1 OFFSET ?';
            values.push(randomOffset);
            console.log(query ,values);
            const [rows] = await pool.query(query, values);
    
            if (!rows.length) return null;
    
            // Parse JSON fields
            const question = rows[0];
            question.explanation = JSON.parse(question.explanation);
            question.question = JSON.parse(question.question);
            question.option1 = JSON.parse(question.option1);
            question.option2 = JSON.parse(question.option2);
            question.option3 = JSON.parse(question.option3);
            question.option4 = JSON.parse(question.option4);
    
            question._id = question.id;
    
            return question;
        } catch (error) {
            console.error('❌ Error fetching random unused question:', error);
            throw new Error('Database error: Failed to fetch random unused question');
        }
    }


    // Update a question's user_id (e.g., mark as used)
    static async updateUserId(questionId, userId) {

        try {
            const query = `
                INSERT INTO used_questions (id, question_id, user_id) 
                VALUES (UUID(), ?, ?)
            `;
            const [result] = await pool.query(query, [questionId, userId]);
            return result.affectedRows > 0; // Returns true if insertion was successful
        } catch (error) {
            console.error('❌ Error inserting into used_questions:', error);
            throw new Error('Database error: Failed to mark question as used');
        }
    }

    // check duplicate questions
    static async CheckDuplicateQuestion(questionTextHi, question_type) {
        try {
            const query = `
                SELECT 1 FROM questions
                WHERE JSON_EXTRACT(question, '$.hi') = ? AND question_type = ?
                LIMIT 1
            `;
            const [rows] = await pool.query(query, [questionTextHi, question_type]);
            return rows.length > 0;
        } catch (error) {
            console.error('❌ Error checking duplicates:', error);
            throw new Error('Database error: Failed to check duplicate question');
        }
    }    
      
}

module.exports = Question;
