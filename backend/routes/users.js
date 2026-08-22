import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// GET current user profile
router.get('/me', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const [users] = await pool.query(
    'SELECT id, name, email, goal, role, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (!users.length) throw new AppError('User not found', 404);

  const user = users[0];

  const [profiles] = await pool.query(
    'SELECT * FROM user_profiles WHERE user_id = ?',
    [userId]
  );

  const [streaks] = await pool.query(
    'SELECT current_streak, longest_streak FROM streaks WHERE user_id = ?',
    [userId]
  );

  const [taskStats] = await pool.query(
    'SELECT COUNT(*) as total_tasks, SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed_tasks FROM tasks WHERE user_id = ?',
    [userId]
  );

  res.json({
    success: true,
    user: {
      ...user,
      profile: profiles[0] || {},
      streak: streaks[0] || { current_streak: 0, longest_streak: 0 },
      stats: taskStats[0] || { total_tasks: 0, completed_tasks: 0 }
    }
  });
}));

// UPDATE user profile
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const {
    age, gender, height_cm, weight_kg, target_weight_kg,
    activity_level, medications, health_conditions, dietary_preference,
    daily_water_goal, preferred_time, days_per_week, session_duration, fitness_level
  } = req.body;

  const [existing] = await pool.query(
    'SELECT id FROM user_profiles WHERE user_id = ?',
    [userId]
  );

  if (existing.length) {
    await pool.query(`
      UPDATE user_profiles SET
        age = ?, gender = ?, height_cm = ?, weight_kg = ?, target_weight_kg = ?,
        activity_level = ?, medications = ?, health_conditions = ?,
        dietary_preference = ?, daily_water_goal = ?, preferred_time = ?,
        days_per_week = ?, session_duration = ?, fitness_level = ?,
        updated_at = NOW()
      WHERE user_id = ?
    `, [
      age, gender, height_cm, weight_kg, target_weight_kg,
      activity_level, medications, health_conditions, dietary_preference,
      daily_water_goal, preferred_time, days_per_week, session_duration, fitness_level,
      userId
    ]);
  } else {
    await pool.query(`
      INSERT INTO user_profiles (id, user_id, age, gender, height_cm, weight_kg, target_weight_kg,
        activity_level, medications, health_conditions, dietary_preference, daily_water_goal,
        preferred_time, days_per_week, session_duration, fitness_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), userId, age, gender, height_cm, weight_kg, target_weight_kg,
      activity_level, medications, health_conditions, dietary_preference, daily_water_goal,
      preferred_time, days_per_week, session_duration, fitness_level
    ]);
  }

  res.json({ success: true, message: 'Profile updated successfully' });
}));

// GET preferences
router.get('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const [prefs] = await pool.query(
    'SELECT preferences FROM user_preferences WHERE user_id = ?',
    [userId]
  );

  res.json({ success: true, preferences: prefs[0]?.preferences || {} });
}));

// UPDATE preferences
router.put('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const preferences = req.body;

  await pool.query(
    'UPDATE user_preferences SET preferences = ?, updated_at = NOW() WHERE user_id = ?',
    [JSON.stringify(preferences), userId]
  );

  res.json({ success: true, message: 'Preferences updated' });
}));

export default router;
