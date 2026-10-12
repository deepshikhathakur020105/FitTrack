import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { profileValidations, validate } from '../middleware/validation.js';

const router = express.Router();

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

router.put('/profile', validate(profileValidations), asyncHandler(async (req, res) => {
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
      age ?? null, gender ?? null, height_cm ?? null, weight_kg ?? null, target_weight_kg ?? null,
      activity_level ?? null, medications ?? null, health_conditions ?? null, dietary_preference ?? null,
      daily_water_goal ?? null, preferred_time ?? null, days_per_week ?? null, session_duration ?? null, fitness_level ?? null,
      userId
    ]);
  } else {
    await pool.query(`
      INSERT INTO user_profiles (id, user_id, age, gender, height_cm, weight_kg, target_weight_kg,
        activity_level, medications, health_conditions, dietary_preference, daily_water_goal,
        preferred_time, days_per_week, session_duration, fitness_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), userId, age ?? null, gender ?? null, height_cm ?? null, weight_kg ?? null, target_weight_kg ?? null,
      activity_level ?? null, medications ?? null, health_conditions ?? null, dietary_preference ?? null, daily_water_goal ?? null,
      preferred_time ?? null, days_per_week ?? null, session_duration ?? null, fitness_level ?? null
    ]);
  }

  res.json({ success: true, message: 'Profile updated successfully' });
}));

router.get('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const [prefs] = await pool.query(
    'SELECT preferences FROM user_preferences WHERE user_id = ?',
    [userId]
  );

  res.json({ success: true, preferences: prefs[0]?.preferences || {} });
}));

router.put('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const preferences = req.body;

  if (typeof preferences !== 'object' || Array.isArray(preferences) || preferences === null) {
    throw new AppError('Preferences must be a valid JSON object', 400);
  }

  await pool.query(
    'UPDATE user_preferences SET preferences = ?, updated_at = NOW() WHERE user_id = ?',
    [JSON.stringify(preferences), userId]
  );

  res.json({ success: true, message: 'Preferences updated' });
}));

export default router;
