import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// GET tasks for a specific day
router.get('/day/:date', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const [tasks] = await pool.query(`
    SELECT id, title, category, scheduled_time, duration_min, notes, is_completed, task_date
    FROM tasks
    WHERE user_id = ? AND task_date = ?
    ORDER BY scheduled_time ASC
  `, [userId, date]);

  res.json({ success: true, tasks });
}));

// GET all tasks for a range
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { startDate, endDate } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (startDate && endDate) {
    query += ' AND task_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY task_date DESC, scheduled_time ASC';
  const [tasks] = await pool.query(query, params);

  res.json({ success: true, tasks });
}));

// CREATE task
router.post('/', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { title, category, scheduled_time, duration_min, notes, task_date } = req.body;

  if (!title || !task_date) {
    throw new AppError('Title and date are required', 400);
  }

  const taskId = uuidv4();

  await pool.query(`
    INSERT INTO tasks (id, user_id, title, category, scheduled_time, duration_min, notes, task_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [taskId, userId, title, category || 'other', scheduled_time, duration_min, notes, task_date]);

  res.status(201).json({ success: true, id: taskId, message: 'Task created' });
}));

// UPDATE task
router.put('/:taskId', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { taskId } = req.params;
  const updates = req.body;

  const [tasks] = await pool.query(
    'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId]
  );

  if (!tasks.length) throw new AppError('Task not found', 404);

  const allowedFields = ['title', 'category', 'scheduled_time', 'duration_min', 'notes', 'is_completed'];
  const updateFields = Object.keys(updates).filter(k => allowedFields.includes(k));

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const setClause = updateFields.map(f => `${f} = ?`).join(', ');
  const values = updateFields.map(f => updates[f]);

  const query = `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = ?`;
  values.push(taskId);

  await pool.query(query, values);

  res.json({ success: true, message: 'Task updated' });
}));

// DELETE task
router.delete('/:taskId', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { taskId } = req.params;

  const [result] = await pool.query(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('Task not found', 404);
  }

  res.json({ success: true, message: 'Task deleted' });
}));

// BULK DELETE tasks for a day
router.delete('/day/:date', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.params;

  await pool.query(
    'DELETE FROM tasks WHERE user_id = ? AND task_date = ?',
    [userId, date]
  );

  res.json({ success: true, message: 'All tasks for day deleted' });
}));

export default router;
