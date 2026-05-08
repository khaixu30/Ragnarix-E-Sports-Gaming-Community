// middlewares/teamMiddleware.js
import pool from '../db/db.js';

export const isTeamLeader = async (req, res, next) => {
  try {
    const { team_id } = req.params;

    const result = await pool.query(
      "SELECT leader_id FROM teams WHERE id = $1",
      [team_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (result.rows[0].leader_id !== req.user._id) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};