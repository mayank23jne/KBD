// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// // Define the User Schema
// const UserSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//     },
//     password: {
//         type: String,
//         required: true,
//         minlength: 6,
//     },
//     userType: {
//         type: String,
//         enum: ['guest', 'registered'],
//         default: 'registered',
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
// });

// // Hash password before saving (using bcryptjs)
// UserSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next(); // Only hash if password is new or modified

//     try {
//         const salt = await bcrypt.genSalt(10); // Generate salt
//         this.password = await bcrypt.hash(this.password, salt); // Hash password
//         next();
//     } catch (err) {
//         next(err);
//     }
// });

// // Compare password method for login
// UserSchema.methods.comparePassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('User', UserSchema);



// for mysql database 



const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// // Create MySQL connection pool
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME
// });

const pool = require('../db');

class User {
    // Create a new user
    static async createUser({ username, email, mobile, password, userType = 'registered' }) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const query = `
                INSERT INTO users (id, username, email, password, user_type, mobile_no) 
                VALUES (UUID(), ?, ?, ?, ?, ?)
            `;
            const [result] = await pool.query(query, [username, email, hashedPassword, userType, mobile]);
            return result;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Find user by email or username
    static async findOne({ username, email, id }) {
        let query = 'SELECT * FROM users WHERE ';
        const values = [];
        if (username) {
            query += 'username = ?';
            values.push(username);
        } else if (email) {
            query += 'email = ?';
            values.push(email);
        } else if (id) {
            query += 'id = ?';
            values.push(id);
        }

        const [rows] = await pool.query(query, values);
        return rows.length ? rows[0] : null;
    }

    // Find user by email
    static async findOneWithGoogle({ email }) {
        const query = 'SELECT * FROM users WHERE email = ? AND user_type = "google"';
        const [rows] = await pool.query(query, [email]);
        return rows.length ? rows[0] : null;
    }

    // Compare hashed password
    static async comparePassword(enteredPassword, storedPassword) {
        return await bcrypt.compare(enteredPassword, storedPassword);
    }
}

module.exports = User;
