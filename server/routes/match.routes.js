// routes/matches.routes.js
import { Router } from "express";
import pool from "../db/db.js";
import { authMiddleware as authenticate } from "../middleware/auth.middleware.js";
import { requireEventExists } from "../middleware/permission.middleware.js";
import { requireMatchExists, requireMatchOwner } from "../middleware/permission.middleware.js";
import { validateCreateMatch, validateLeaderboardQuery } from "../middleware/validate.middleware.js";

const matchRoutes = Router();

// ─────────────────────────────────────────────────────────────────
// Shared helper — builds the leaderboard SQL with optional filters
// ─────────────────────────────────────────────────────────────────
function buildLeaderboardQuery(extraCondition = "") {
  return `
    SELECT
      RANK()   OVER (ORDER BY SUM(m.game_points) DESC) AS rank,
      u.id                                              AS user_id,
      u.username,
      COUNT(m.id)                                       AS matches_played,
      SUM(m.game_points)                                AS total_score,
      SUM(m.universal_pts)                              AS total_universal,
      ARRAY_AGG(DISTINCT g.game_name)                   AS games_played
    FROM matches m
    JOIN users u ON u.id = m.user_id
    JOIN games g ON g.id = m.game_id
    ${extraCondition}
    GROUP BY u.id, u.username
    ORDER BY total_score DESC
  `;
}

// ─────────────────────────────────────────────
// POST /api/matches — Record a new match result
// ─────────────────────────────────────────────
matchRoutes.post(
  "/",
  authenticate,          // must be logged in
  requireEventExists,    // checks event_id in body, attaches req.event
  validateCreateMatch,   // validates all required fields
  async (req, res) => {
    const { event_id, game_id, user_id, game_points, universal_pts, notes } = req.body;

    // Only allow recording matches for Live events
    if (req.event.status !== "Live") {
      return res.status(400).json({
        success: false,
        message: `Matches can only be recorded for Live events. Current status: '${req.event.status}'`,
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO matches (event_id, game_id, user_id, game_points, universal_pts, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [event_id, game_id, user_id, game_points, universal_pts, notes ?? null]
      );

      res.status(201).json({ success: true, match: result.rows[0] });
    } catch (err) {
      console.error("Create match error:", err);
      const isFk = err.code === "23503";
      res.status(isFk ? 409 : 500).json({
        success: false,
        message: isFk ? "Referenced game or user does not exist" : "Internal server error",
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// GET /api/matches — Global leaderboard (optional: ?game_id=&event_id=)
// ─────────────────────────────────────────────────────────────────
matchRoutes.get("/", validateLeaderboardQuery, async (req, res) => {
  const { game_id, event_id, page = 1, limit = 50 } = req.query;

  const pageNum   = Math.max(1, parseInt(page));
  const limitNum  = Math.min(100, Math.max(1, parseInt(limit)));
  const offset    = (pageNum - 1) * limitNum;

  // Build optional WHERE from filters
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (game_id)  { conditions.push(`m.game_id  = $${idx++}`); params.push(game_id); }
  if (event_id) { conditions.push(`m.event_id = $${idx++}`); params.push(event_id); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Wrap ranked query in a CTE so LIMIT/OFFSET applies after RANK() is computed
  const query = `
    WITH ranked AS (
      ${buildLeaderboardQuery(where)}
    )
    SELECT * FROM ranked
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  params.push(limitNum, offset);

  try {
    const [leaderboard, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(DISTINCT m.user_id) FROM matches m ${where}`,
        params.slice(0, -2) // exclude LIMIT/OFFSET from count
      ),
    ]);

    res.json({
      success: true,
      total:  parseInt(countResult.rows[0].count),
      page:   pageNum,
      limit:  limitNum,
      leaderboard: leaderboard.rows,
    });
  } catch (err) {
    console.error("Global leaderboard error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/matches/events/:event_id — Leaderboard for one event
//     Includes per-game JSON breakdown
// ─────────────────────────────────────────────────────────────────
matchRoutes.get(
  "/events/:event_id",
  validateLeaderboardQuery,
  requireEventExists,
  async (req, res) => {
    const { event_id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;

    const query = `
      WITH ranked AS (
        SELECT
          RANK()   OVER (ORDER BY SUM(m.game_points) DESC) AS rank,
          u.id                                              AS user_id,
          u.username,
          COUNT(m.id)                                       AS matches_played,
          SUM(m.game_points)                                AS total_score,
          SUM(m.universal_pts)                              AS total_universal,
          ARRAY_AGG(DISTINCT g.game_name)                   AS games_played,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'match_id',      m.id,
              'game',          g.game_name,
              'game_points',   m.game_points,
              'universal_pts', m.universal_pts,
              'played_at',     m.played_at,
              'notes',         m.notes
            ) ORDER BY m.played_at
          )                                                 AS match_detail
        FROM matches m
        JOIN users u ON u.id = m.user_id
        JOIN games g ON g.id = m.game_id
        WHERE m.event_id = $1
        GROUP BY u.id, u.username
        ORDER BY total_score DESC
      )
      SELECT * FROM ranked
      LIMIT $2 OFFSET $3
    `;

    try {
      const [leaderboard, countResult] = await Promise.all([
        pool.query(query, [event_id, limitNum, offset]),
        pool.query(
          "SELECT COUNT(DISTINCT user_id) FROM matches WHERE event_id = $1",
          [event_id]
        ),
      ]);

      res.json({
        success:     true,
        event_id,
        event_title: req.event.title,
        event_status: req.event.status,
        total:       parseInt(countResult.rows[0].count),
        page:        pageNum,
        limit:       limitNum,
        leaderboard: leaderboard.rows,
      });
    } catch (err) {
      console.error("Event leaderboard error:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// GET /api/matches/users/:user_id — Rank + full history for one user
// ─────────────────────────────────────────────────────────────────
matchRoutes.get("/users/:user_id", validateLeaderboardQuery, async (req, res) => {
  const { user_id } = req.params;
  const { event_id } = req.query;

  const conditions = ["u.id = $1"];
  const globalParams = []; // for the CTE (no user filter there)
  const filterParams = []; // for the WHERE in the CTE

  if (event_id) {
    filterParams.push(event_id);
    conditions.push(`m.event_id = $${filterParams.length + 1}`);
  }

  const where = filterParams.length
    ? `WHERE m.event_id = $${filterParams.length}`
    : "";

  // Global rank is computed across ALL users; then we filter to the one user
  const query = `
    WITH ranked AS (
      ${buildLeaderboardQuery(where)}
    )
    SELECT * FROM ranked WHERE user_id = $${filterParams.length + 1}
  `;

  try {
    const { rows } = await pool.query(query, [...filterParams, user_id]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found or has not played any matches",
      });
    }

    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error("User rank error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/matches/:match_id — Get a single match record
// ─────────────────────────────────────────────────────────────────
matchRoutes.get("/:match_id", requireMatchExists, (req, res) => {
  res.json({ success: true, match: req.match });
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/matches/:match_id — Correct points on an existing match
// ─────────────────────────────────────────────────────────────────
matchRoutes.patch(
  "/:match_id",
  authenticate,
  requireMatchExists,    // attaches req.match
  requireMatchOwner,     // only owner or admin
  async (req, res) => {
    const { match_id }   = req.params;
    const allowed        = ["game_points", "universal_pts", "notes"];

    const updates = [];
    const params  = [];
    let   idx     = 1;

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        params.push(req.body[field]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: "No updatable fields provided (game_points, universal_pts, notes)",
      });
    }

    params.push(match_id);

    try {
      const result = await pool.query(
        `UPDATE matches SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
        params
      );
      res.json({ success: true, match: result.rows[0] });
    } catch (err) {
      console.error("Update match error:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// DELETE /api/matches/:match_id — Remove a match record (admin only)
// ─────────────────────────────────────────────────────────────────
matchRoutes.delete(
  "/:match_id",
  authenticate,
  requireMatchExists,
  requireMatchOwner,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM matches WHERE id = $1", [req.params.match_id]);
      res.json({ success: true, message: "Match record deleted" });
    } catch (err) {
      console.error("Delete match error:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

export default matchRoutes;