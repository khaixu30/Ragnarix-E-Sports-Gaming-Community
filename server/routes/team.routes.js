// routes/teamRoutes.js
import express from 'express';
import pool from '../db/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isTeamLeader } from '../middleware/team.middleware.js';

const teamRoutes = express.Router();


// ✅ Create Team
teamRoutes.post('/events/:event_id/teams', authMiddleware, async (req, res) => {
  try {
    const { event_id } = req.params;
    const { team_name } = req.body;

    const team = await pool.query(
      `INSERT INTO teams(event_id, team_name, leader_id)
       VALUES($1, $2, $3) RETURNING *`,
      [event_id, team_name, req.user.id]
    );

    // Add leader as member
    await pool.query(
      `INSERT INTO team_members(team_id, user_id)
       VALUES($1, $2)`,
      [team.rows[0].id, req.user.id]
    );

    res.status(201).json(team.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ List Teams
teamRoutes.get('/events/:event_id/teams', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM teams WHERE event_id = $1",
      [req.params.event_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Get Team
teamRoutes.get('/teams/:team_id', async (req, res) => {
  try {
    const { team_id } = req.params;

    const team = await pool.query(
      "SELECT * FROM teams WHERE id = $1",
      [team_id]
    );

    const members = await pool.query(
      "SELECT * FROM team_members WHERE team_id = $1",
      [team_id]
    );

    res.json({
      team: team.rows[0],
      members: members.rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Update Team
teamRoutes.patch('/teams/:team_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_name } = req.body;

    const result = await pool.query(
      "UPDATE teams SET team_name = $1 WHERE id = $2 RETURNING *",
      [team_name, req.params.team_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Delete Team
teamRoutes.delete('/teams/:team_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM teams WHERE id = $1",
      [req.params.team_id]
    );

    res.json({ message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Add Member
teamRoutes.post('/teams/:team_id/members', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { user_id } = req.body;

    await pool.query(
      "INSERT INTO team_members(team_id, user_id) VALUES($1, $2)",
      [req.params.team_id, user_id]
    );

    res.json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Remove Member
teamRoutes.delete('/teams/:team_id/members/:user_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_id, user_id } = req.params;

    await pool.query(
      "DELETE FROM team_members WHERE team_id = $1 AND user_id = $2",
      [team_id, user_id]
    );

    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default teamRoutes;