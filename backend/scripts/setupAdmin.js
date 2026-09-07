import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function setupAdmin() {
  try {
    console.log('\n🔐 FitTrack Admin Setup\n');
    
    const email = await question('Enter admin email: ');
    const name = await question('Enter admin name: ');
    const password = await question('Enter admin password (min 6 chars): ');
    
    // Validation
    if (!email.includes('@')) {
      console.error('\n❌ Invalid email format\n');
      process.exit(1);
    }
    
    if (password.length < 6) {
      console.error('\n❌ Password must be at least 6 characters\n');
      process.exit(1);
    }

    // Check if admin already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE role = ?', ['admin']);
    if (existing.length > 0) {
      console.log('\n⚠️ Admin user already exists!');
      const recreate = await question('Do you want to recreate it? (yes/no): ');
      if (recreate !== 'yes') {
        console.log('Setup cancelled.\n');
        process.exit(0);
      }
      // Delete existing admin
      await pool.query('DELETE FROM users WHERE role = ?', ['admin']);
    }

    // Create admin user
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, role, is_active, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, passwordHash, 'admin', true, true]
    );

    // Create admin profile
    await pool.query(
      'INSERT INTO user_profiles (id, user_id) VALUES (?, ?)',
      [uuidv4(), userId]
    );

    // Create admin preferences
    await pool.query(
      'INSERT INTO user_preferences (id, user_id, preferences) VALUES (?, ?, ?)',
      [uuidv4(), userId, JSON.stringify({})]
    );

    // Create streaks entry
    await pool.query(
      'INSERT INTO streaks (id, user_id, current_streak, longest_streak) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 0, 0]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}\n`);
    
    rl.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Admin setup failed:', err.message, '\n');
    rl.close();
    process.exit(1);
  }
}

setupAdmin();
