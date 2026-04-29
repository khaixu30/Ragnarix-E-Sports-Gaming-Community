const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');
const { isTeamLeader } = require('../middlewares/teamMiddleware');


// ✅ Create Team
router.post('/events/:event_id/teams', authMiddleware, async (req, res) => {
  try {
    const { event_id } = req.params;
    const { team_name } = req.body;

    const result = await pool.query(
      `INSERT INTO teams(event_id, team_name, leader_id)
       VALUES($1, $2, $3) RETURNING *`,
      [event_id, team_name, req.user.id]
    );

    // add leader as member
    await pool.query(
      `INSERT INTO team_members(team_id, user_id)
       VALUES($1, $2)`,
      [result.rows[0].id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ List Teams
router.get('/events/:event_id/teams', async (req, res) => {
  try {
    const { event_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM teams WHERE event_id = $1",
      [event_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Get Single Team
router.get('/teams/:team_id', async (req, res) => {
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
router.patch('/teams/:team_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_id } = req.params;
    const { team_name } = req.body;

    const result = await pool.query(
      `UPDATE teams SET team_name = $1 WHERE id = $2 RETURNING *`,
      [team_name, team_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Delete Team
router.delete('/teams/:team_id', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_id } = req.params;

    await pool.query("DELETE FROM teams WHERE id = $1", [team_id]);

    res.json({ message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Add Member
router.post('/teams/:team_id/members', authMiddleware, isTeamLeader, async (req, res) => {
  try {
    const { team_id } = req.params;
    const { user_id } = req.body;

    await pool.query(
      "INSERT INTO team_members(team_id, user_id) VALUES($1, $2)",
      [team_id, user_id]
    );

    res.json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Remove Member
router.delete('/teams/:team_id/members/:user_id', authMiddleware, isTeamLeader, async (req, res) => {
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

module.exports = router;