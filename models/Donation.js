const pool = require('../db');

class Donation {
    // Save new donation
    static async save(donationData) {
        const connection = await pool.getConnection();
        try {
            const params = {
                payment_id: donationData.payment_id,
                name: donationData.name || 'Anonymous',
                email: donationData.email || null,
                mobile: donationData.mobile || null,
                amount: donationData.amount,
                currency: donationData.currency || 'INR',
                status: donationData.status || 'success'
            };

            const [result] = await connection.query(
                'INSERT INTO donations SET ?',
                params
            );

            return {
                success: true,
                insertId: result.insertId,
                message: 'Donation saved successfully'
            };
        } catch (error) {
            console.error('Error saving donation:', error);
            
            // Check if duplicate payment_id
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Payment ID already exists');
            }
            
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get donation by payment ID
    static async getByPaymentId(paymentId) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT * FROM donations WHERE payment_id = ?',
                [paymentId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching donation:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get all donations with pagination
    static async getAll(page = 1, limit = 10) {
        const connection = await pool.getConnection();
        try {
            const offset = (page - 1) * limit;
            
            const [rows] = await connection.query(
                `SELECT * FROM donations 
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            const [countResult] = await connection.query(
                'SELECT COUNT(*) as total FROM donations'
            );

            return {
                donations: rows,
                total: countResult[0].total,
                page: page,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            console.error('Error fetching donations:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get donations by user (email or mobile)
    static async getByUser(email = null, mobile = null) {
        const connection = await pool.getConnection();
        try {
            let query = 'SELECT * FROM donations WHERE ';
            const params = [];

            if (email && mobile) {
                query += '(email = ? OR mobile = ?)';
                params.push(email, mobile);
            } else if (email) {
                query += 'email = ?';
                params.push(email);
            } else if (mobile) {
                query += 'mobile = ?';
                params.push(mobile);
            } else {
                return [];
            }

            query += ' ORDER BY created_at DESC';

            const [rows] = await connection.query(query, params);
            return rows;
        } catch (error) {
            console.error('Error fetching user donations:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get total donation amount
    static async getTotalAmount() {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT 
                    COUNT(*) as total_donations,
                    SUM(amount) as total_amount,
                    AVG(amount) as average_amount
                 FROM donations 
                 WHERE status = 'success'`
            );
            return rows[0];
        } catch (error) {
            console.error('Error fetching donation stats:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get recent donations (for displaying on homepage)
    static async getRecent(limit = 5) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT name, amount, created_at 
                 FROM donations 
                 WHERE status = 'success'
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching recent donations:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Update donation status
    static async updateStatus(paymentId, status) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'UPDATE donations SET status = ? WHERE payment_id = ?',
                [status, paymentId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating donation status:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Delete donation (admin only)
    static async delete(id) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'DELETE FROM donations WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting donation:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Donation;