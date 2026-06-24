const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDB() {
  try {
    // Connect without database first
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      port: process.env.DB_PORT || 3306
    });

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'kbds';
    console.log(`Creating database ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    
    // Switch to the database
    console.log(`Using database ${dbName}...`);
    await connection.query(`USE \`${dbName}\`;`);

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'mysqlbackup', 'payment_table.sql');
    const sqlStatements = fs.readFileSync(sqlFile, 'utf8')
      .split(';')
      .filter(stmt => stmt.trim() !== '');

    console.log('Executing payment_table.sql...');
    for (let stmt of sqlStatements) {
      if (stmt.trim()) {
        await connection.query(stmt);
      }
    }

    console.log('Database and tables setup completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDB();
