import fs from 'fs';
import pool from '../config/database.js';

const runMigrations = async () => {
  try {
    const schema = fs.readFileSync('./database/schema.sql', 'utf-8');
    const statements = schema.split(';').filter(s => s.trim());

    for (const statement of statements) {
      await pool.query(statement);
      console.log('✅', statement.slice(0, 50) + '...');
    }

    console.log('✅ Database migrations completed!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};

runMigrations();
