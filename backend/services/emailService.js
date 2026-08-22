import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendVerificationEmail = async (userId, email, name) => {
  try {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO email_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, token, expiresAt]
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🎉 Verify Your FitTrack Account',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'DM Sans', sans-serif;">
          <h2>Welcome to FitTrack, ${name.split(' ')[0]}!</h2>
          <p>Please verify your email to get started on your fitness journey.</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #c8ff00; color: #000; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy this link: ${verificationLink}</p>
          <p style="color: #888; font-size: 12px;">Link expires in 24 hours.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Email verification error:', err);
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔐 Reset Your FitTrack Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'DM Sans', sans-serif;">
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #c8ff00; color: #000; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy this link: ${resetLink}</p>
          <p style="color: #888; font-size: 12px;">Link expires in 24 hours. If you didn't request this, ignore this email.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Password reset email error:', err);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '💪 Start Your Fitness Journey with FitTrack',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'DM Sans', sans-serif;">
          <h2>Welcome to FitTrack, ${name}!</h2>
          <p>Your account is all set up. Time to crush your fitness goals! 🎉</p>
          <ul style="line-height: 2;">
            <li>📊 Track your daily progress and achievements</li>
            <li>🧘 Access our curated video library</li>
            <li>📅 Plan your workouts with the daily planner</li>
            <li>🔥 Build your streak and stay motivated</li>
          </ul>
          <p style="font-size: 16px; font-weight: 600; margin-top: 20px;">Let's do this! 💪</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Welcome email error:', err);
  }
};
