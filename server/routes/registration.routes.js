// routes/registrationRoutes.js
import express from 'express';
import pool from '../db/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const registrationRoutes = express.Router();

// ✅ Register (solo/team)
registrationRoutes.post('/event/:event_id', authMiddleware, async (req, res) => {
  try {
    const { team_id } = req.body;

    const result = await pool.query(
      `INSERT INTO registrations(event_id, user_id, team_id)
       VALUES($1, $2, $3)
       RETURNING *`,
      [req.params.event_id, req.user._id, team_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ My Registrations
registrationRoutes.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, e.title, e.event_type, e.registration_fee, e.prize_pool, e.start_time, e.end_time, e.status
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user._id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Cancel Registration
registrationRoutes.delete('/:event_id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM registrations WHERE event_id = $1 AND user_id = $2',
      [req.params.event_id, req.user._id]
    );

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default registrationRoutes;