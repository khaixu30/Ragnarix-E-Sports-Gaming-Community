// routes/registrationRoutes.js
import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const registrationRoutes = express.Router();


// ✅ Register (solo/team)
registrationRoutes.post('/events/:event_id/register', authMiddleware, async (req, res) => {
  try {
    const { team_id } = req.body;

    const result = await pool.query(
      `INSERT INTO registrations(event_id, user_id, team_id)
       VALUES($1, $2, $3)
       RETURNING *`,
      [req.params.event_id, req.user.id, team_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ My Registrations
registrationRoutes.get('/registrations/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM registrations WHERE user_id = $1",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Cancel Registration
registrationRoutes.delete('/registrations/:event_id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM registrations WHERE event_id = $1 AND user_id = $2",
      [req.params.event_id, req.user.id]
    );

    res.json({ message: "Registration cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default registrationRoutes;