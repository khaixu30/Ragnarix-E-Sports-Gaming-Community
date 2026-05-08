// routes/teamRoutes.js
import express from 'express';
import pool from '../db/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isTeamLeader } from '../middleware/team.middleware.js';

const teamRoutes = express.Router();

// ✅ Create Team
teamRoutes.post('/event/:event_id', authMiddleware, async (req, res) => {
  try {
    const { event_id } = req.params;
    const { team_name } = req.body;

    const team = await pool.query(
      `INSERT INTO teams(event_id, team_name, leader_id)
       VALUES($1, $2, $3) RETURNING *`,
      [event_id, team_name, req.user._id]
    );

    // Add leader as member automatically
    await pool.query(
      `INSERT INTO team_members(team_id, user_id) VALUES($1, $2)`,
      [team.rows[0].id, req.user._id]
    );

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ List Teams for an event
teamRoutes.get('/event/:event_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teams WHERE event_id = $1',
      [req.params.event_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get Team by ID
teamRoutes.get('/:team_id', async (req, res) => {
  try {
    const { team_id } = req.params;

    const team = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [team_id]
    );

    const members = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1',
      [team_id]
    );

    res.json({
      success: true,
      data: {
        team: team.rows[0],
        members: members.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Update Team name
teamRoutes.patch('/:team_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_name } = req.body;

    const result = await pool.query(
      'UPDATE teams SET team_name = $1 WHERE id = $2 RETURNING *',
      [team_name, req.params.team_id]
    );

    res.json({
      success: true,
      message: 'Team updated',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Delete Team
teamRoutes.delete('/:team_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [req.params.team_id]);

    res.json({ success: true, message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Add Member by username
teamRoutes.post('/:team_id/members', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_id } = req.params;
    const { username } = req.body;   // frontend sends username, we resolve to user_id here

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    // Resolve username → user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: `User "${username}" not found` });
    }

    const user_id = userResult.rows[0].id;

    // Check if already a member
    const existing = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team_id, user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: `"${username}" is already in this team` });
    }

    await pool.query(
      'INSERT INTO team_members(team_id, user_id) VALUES($1, $2)',
      [team_id, user_id]
    );

    res.status(201).json({ success: true, message: `${username} added to team` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Remove Member
teamRoutes.delete('/:team_id/members/:user_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_id, user_id } = req.params;

    await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team_id, user_id]
    );

    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default teamRoutes;