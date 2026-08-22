import express from 'express';
import pool from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// GET all users with pagination
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, name, email, goal, is_active, created_at, role FROM users';
  let params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR email LIKE ?';
    const searchTerm = `%${search}%`;
    params = [searchTerm, searchTerm];
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [users] = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  if (search) {
    countQuery += ' WHERE name LIKE ? OR email LIKE ?';
  }
  const [countResult] = await pool.query(countQuery, search ? [`%${search}%`, `%${search}%`] : []);

  // Get stats for each user
  const usersWithStats = await Promise.all(users.map(async (user) => {
    const [stats] = await pool.query(`
      SELECT 
        COALESCE((SELECT COUNT(DISTINCT login_date) FROM login_activity WHERE user_id = ?), 0) as total_logins,
        COALESCE(s.current_streak, 0) as streak,
        COALESCE((SELECT COUNT(*) FROM tasks WHERE user_id = ? AND is_completed = TRUE), 0) as tasks_done
      FROM users u
      LEFT JOIN streaks s ON u.id = s.user_id
      WHERE u.id = ?
    `, [user.id, user.id, user.id]);

    return {
      ...user,
      ...(stats[0] || { total_logins: 0, streak: 0, tasks_done: 0 })
    };
  }));

  res.json({ success: true, users: usersWithStats, total: countResult[0].total, page, limit });
}));

// GET admin dashboard stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [stats] = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE DATE(last_login) = CURDATE()) as active_today,
      (SELECT COUNT(*) FROM tasks WHERE is_completed = TRUE AND DATE(completed_at) = CURDATE()) as tasks_completed_today,
      (SELECT AVG(current_streak) FROM streaks) as avg_streak,
      (SELECT MAX(longest_streak) FROM streaks) as max_streak,
      (SELECT COUNT(DISTINCT user_id) FROM login_activity WHERE login_date = CURDATE()) as unique_logins_today
  `);

  res.json({ success: true, stats: stats[0] });
}));

// GET recent signups
router.get('/recent-signups', asyncHandler(async (req, res) => {
  const [users] = await pool.query(`
    SELECT id, name, email, goal, created_at FROM users
    ORDER BY created_at DESC LIMIT 10
  `);

  res.json({ success: true, users });
}));

// GET top streaks
router.get('/top-streaks', asyncHandler(async (req, res) => {
  const [streaks] = await pool.query(`
    SELECT u.id, u.name, u.email, s.current_streak, s.longest_streak
    FROM streaks s
    JOIN users u ON s.user_id = u.id
    WHERE s.current_streak > 0
    ORDER BY s.current_streak DESC LIMIT 10
  `);

  res.json({ success: true, streaks });
}));

// SUSPEND user
router.put('/users/:userId/suspend', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
  if (!user.length) throw new AppError('User not found', 404);

  await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);

  res.json({ success: true, message: 'User suspended' });
}));

// ACTIVATE user
router.put('/users/:userId/activate', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
  if (!user.length) throw new AppError('User not found', 404);

  await pool.query('UPDATE users SET is_active = TRUE WHERE id = ?', [userId]);

  res.json({ success: true, message: 'User activated' });
}));

// DELETE user (soft delete)
router.delete('/users/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);

  res.json({ success: true, message: 'User deleted' });
}));

// GET user detail
router.get('/users/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const [user] = await pool.query(
    'SELECT id, name, email, goal, role, is_active, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (!user.length) throw new AppError('User not found', 404);

  const [profile] = await pool.query('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
  const [streak] = await pool.query('SELECT * FROM streaks WHERE user_id = ?', [userId]);
  const [tasks] = await pool.query(
    'SELECT id, title, category, is_completed, task_date FROM tasks WHERE user_id = ? ORDER BY task_date DESC LIMIT 20',
    [userId]
  );

  res.json({
    success: true,
    user: {
      ...user[0],
      profile: profile[0] || {},
      streak: streak[0] || {},
      recentTasks: tasks
    }
  });
}));

export default router;
