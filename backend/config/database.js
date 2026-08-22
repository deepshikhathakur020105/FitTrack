import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  multipleStatements: false
});

poll.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') console.error('Database connection was closed.');
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') console.error('Database had a fatal error.');
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_INVOKING_ERROR') console.error('Database error.');
});

export default pool;
