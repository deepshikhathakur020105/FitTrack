import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/day/:date', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new AppError('Invalid date', 400);
  }

  const [tasks] = await pool.query(`
    SELECT id, title, category, scheduled_time, duration_min, notes, is_completed, task_date
    FROM tasks
    WHERE user_id = ? AND task_date = ?
    ORDER BY scheduled_time ASC
  `, [userId, date]);

  res.json({ success: true, tasks });
}));

router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { startDate, endDate } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (startDate && endDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new AppError('Invalid date', 400);
    }

    if (startDateObj > endDateObj) {
      throw new AppError('startDate must be before endDate', 400);
    }

    query += ' AND task_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY task_date DESC, scheduled_time ASC';
  const [tasks] = await pool.query(query, params);

  res.json({ success: true, tasks });
}));

router.post('/', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { title, category, scheduled_time, duration_min, notes, task_date } = req.body;

  if (!title || !task_date) {
    throw new AppError('Title and date are required', 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(task_date)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const taskId = uuidv4();

  await pool.query(`
    INSERT INTO tasks (id, user_id, title, category, scheduled_time, duration_min, notes, task_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [taskId, userId, title, category || 'other', scheduled_time || null, duration_min || null, notes || null, task_date]);

  res.status(201).json({ success: true, id: taskId, message: 'Task created' });
}));

router.put('/:taskId', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { taskId } = req.params;
  const updates = req.body;

  const [tasks] = await pool.query(
    'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId]
  );

  if (!tasks.length) throw new AppError('Task not found', 404);

  const allowedFields = ['title', 'category', 'scheduled_time', 'duration_min', 'notes', 'is_completed', 'task_date'];
  const updateFields = Object.keys(updates).filter(k => allowedFields.includes(k));

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  if (updates.title !== undefined && (typeof updates.title !== 'string' || updates.title.trim().length === 0)) {
    throw new AppError('Title must be a non-empty string', 400);
  }

  if (updates.duration_min !== undefined) {
    const duration = Number(updates.duration_min);
    if (!Number.isInteger(duration) || duration < 0 || duration > 1440) {
      throw new AppError('Duration must be between 0 and 1440 minutes', 400);
    }
  }

  if (updates.task_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(updates.task_date)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const setClause = updateFields.map(f => `${f} = ?`).join(', ');
  const values = updateFields.map(f => updates[f]);

  const query = `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = ?`;
  values.push(taskId);

  await pool.query(query, values);

  res.json({ success: true, message: 'Task updated' });
}));

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

router.delete('/day/:date', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new AppError('Invalid date', 400);
  }

  await pool.query(
    'DELETE FROM tasks WHERE user_id = ? AND task_date = ?',
    [userId, date]
  );

  res.json({ success: true, message: 'All tasks for day deleted' });
}));

export default router;
