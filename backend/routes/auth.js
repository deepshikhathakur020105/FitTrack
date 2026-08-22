import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { generateTokens } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { signupValidations, loginValidations, resetPasswordValidations, validate } from '../middleware/validation.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// SIGNUP
router.post('/signup', validate(signupValidations), asyncHandler(async (req, res) => {
  const { name, email, password, goal } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      throw new AppError('Email already registered', 400);
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    await conn.query(
      'INSERT INTO users (id, name, email, password_hash, goal, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, passwordHash, goal || 'General Fitness', 'user']
    );

    await conn.query(
      'INSERT INTO user_profiles (id, user_id) VALUES (?, ?)',
      [uuidv4(), userId]
    );

    await conn.query(
      'INSERT INTO user_preferences (id, user_id, preferences) VALUES (?, ?, ?)',
      [uuidv4(), userId, JSON.stringify({})]
    );

    await conn.query(
      'INSERT INTO streaks (id, user_id, current_streak, longest_streak) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 0, 0]
    );

    await conn.commit();
    await sendVerificationEmail(userId, email, name);

    res.status(201).json({
      success: true,
      message: 'Account created! Please verify your email.',
      userId
    });

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.end();
  }
}));

// LOGIN
router.post('/login', validate(loginValidations), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const [users] = await pool.query(
    'SELECT id, password_hash, role, is_active FROM users WHERE email = ?',
    [email]
  );

  if (!users.length) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = users[0];

  if (!user.is_active) {
    throw new AppError('Account has been suspended', 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const today = new Date().toISOString().split('T')[0];
  const [existing] = await pool.query(
    'SELECT id FROM login_activity WHERE user_id = ? AND login_date = ?',
    [user.id, today]
  );

  if (!existing.length) {
    await pool.query(
      'INSERT INTO login_activity (id, user_id, login_date) VALUES (?, ?, ?)',
      [uuidv4(), user.id, today]
    );
  }

  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = ?',
    [user.id]
  );

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: { id: user.id, email }
  });
}));

// VERIFY EMAIL
router.post('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const [tokens] = await pool.query(
    'SELECT user_id FROM email_tokens WHERE token = ? AND is_used = FALSE AND expires_at > NOW()',
    [token]
  );

  if (!tokens.length) {
    throw new AppError('Invalid or expired verification link', 400);
  }

  const userId = tokens[0].user_id;

  await Promise.all([
    pool.query('UPDATE users SET is_email_verified = TRUE WHERE id = ?', [userId]),
    pool.query('UPDATE email_tokens SET is_used = TRUE WHERE token = ?', [token])
  ]);

  res.json({ success: true, message: 'Email verified successfully!' });
}));

// FORGOT PASSWORD
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  if (!users.length) {
    return res.json({ success: true, message: 'If email exists, password reset link sent.' });
  }

  const userId = users[0].id;
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), userId, resetToken, expiresAt]
  );

  await sendPasswordResetEmail(email, resetToken);

  res.json({ success: true, message: 'Password reset link sent to email.' });
}));

// RESET PASSWORD
router.post('/reset-password/:token', validate(resetPasswordValidations), asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const [tokens] = await pool.query(
    'SELECT user_id FROM password_reset_tokens WHERE token = ? AND is_used = FALSE AND expires_at > NOW()',
    [token]
  );

  if (!tokens.length) {
    throw new AppError('Invalid or expired reset link', 400);
  }

  const userId = tokens[0].user_id;
  const passwordHash = await bcrypt.hash(password, 12);

  await Promise.all([
    pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]),
    pool.query('UPDATE password_reset_tokens SET is_used = TRUE WHERE token = ?', [token])
  ]);

  res.json({ success: true, message: 'Password reset successfully!' });
}));

// REFRESH TOKEN
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId, decoded.role);

  res.json({ success: true, accessToken, refreshToken: newRefreshToken });
}));

export default router;
