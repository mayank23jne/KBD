-- Create donations table

CREATE TABLE IF NOT EXISTS donations (

    id INT AUTO_INCREMENT PRIMARY KEY,

    payment_id VARCHAR(255) NOT NULL UNIQUE,

    name VARCHAR(255) DEFAULT 'Anonymous',

    email VARCHAR(255) DEFAULT NULL,

    mobile VARCHAR(15) DEFAULT NULL,

    amount DECIMAL(10, 2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'INR',

    status ENUM('success', 'failed', 'pending') DEFAULT 'success',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_payment_id (payment_id),

    INDEX idx_email (email),

    INDEX idx_mobile (mobile),

    INDEX idx_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- Optional: Create a view for donation statistics

CREATE OR REPLACE VIEW donation_stats AS

SELECT 

    COUNT(*) as total_donations,

    SUM(amount) as total_amount,

    AVG(amount) as average_amount,

    MAX(amount) as highest_donation,

    MIN(amount) as lowest_donation,

    DATE(created_at) as donation_date

FROM donations

WHERE status = 'success'

GROUP BY DATE(created_at)

ORDER BY donation_date DESC;
 