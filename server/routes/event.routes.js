import { Router } from "express";
import pool from "../db/db.js";
import { validateCreateEvent, validateUpdateEvent, validateStatusUpdate } from "../middleware/validate.middleware.js";
import { authMiddleware as authenticate } from "../middleware/auth.middleware.js";
import { requireEventExists, requireCouncilOwner } from "../middleware/permission.middleware.js";

const eventRoutes = Router();

// ─────────────────────────────────────────────
// POST /api/events — Create a new event
// ─────────────────────────────────────────────
eventRoutes.post("/", authenticate, validateCreateEvent, async (req, res) => {
  const {
    council_id,
    game_id,
    title,
    description,
    event_type,
    team_size,
    registration_fee,
    prize_pool,
    start_time,
    end_time,
    registration_deadline,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO events
        (council_id, game_id, title, description, event_type, team_size,
         registration_fee, prize_pool, start_time, end_time, registration_deadline, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Upcoming')
       RETURNING *`,
      [
        council_id,
        game_id,
        title,
        description,
        event_type,
        team_size ?? null,
        registration_fee ?? 0.0,
        prize_pool ?? 0.0,
        start_time,
        end_time,
        registration_deadline,
      ]
    );

    res.status(201).json({ success: true, event: result.rows[0] });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/events — List all events (with filters)
// Query params: status, event_type, game_id, council_id, page, limit
// ─────────────────────────────────────────────
eventRoutes.get("/", async (req, res) => {
  const { status, event_type, game_id, council_id, page = 1, limit = 10 } = req.query;

  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page

  const conditions = [];
  const params = [];
  let idx = 1;

  if (status)     { conditions.push(`status = $${idx++}`);     params.push(status); }
  if (event_type) { conditions.push(`event_type = $${idx++}`); params.push(event_type); }
  if (game_id)    { conditions.push(`game_id = $${idx++}`);    params.push(game_id); }
  if (council_id) { conditions.push(`council_id = $${idx++}`); params.push(council_id); }

  const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (pageNum - 1) * limitNum;

  try {
    const [eventsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limitNum, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM events ${where}`, params),
    ]);

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      page: pageNum,
      limit: limitNum,
      events: eventsResult.rows,
    });
  } catch (err) {
    console.error("List events error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/events/:event_id — Get event details
// ─────────────────────────────────────────────
eventRoutes.get("/:event_id", requireEventExists, (req, res) => {
  res.json({ success: true, event: req.event });
});

// ─────────────────────────────────────────────
// PATCH /api/events/:event_id — Update event details
// ─────────────────────────────────────────────
eventRoutes.patch("/:event_id", authenticate, requireEventExists, requireCouncilOwner, validateUpdateEvent, async (req, res) => {
  const { event_id } = req.params;

  if (req.event.status !== "Upcoming") {
    return res.status(400).json({
      success: false,
      message: `Cannot update an event with status '${req.event.status}'`,
    });
  }

  const fields = [
    "title", "description", "game_id", "event_type", "team_size",
    "registration_fee", "prize_pool", "start_time", "end_time", "registration_deadline",
  ];

  const updates = [];
  const params  = [];
  let idx = 1;

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${idx++}`);
      params.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: "No fields provided to update" });
  }

  params.push(event_id);

  try {
    const result = await pool.query(
      `UPDATE events SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );
    res.json({ success: true, event: result.rows[0] });
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/events/:event_id — Cancel or delete event
// ─────────────────────────────────────────────
eventRoutes.delete("/:event_id", authenticate, requireEventExists, requireCouncilOwner, async (req, res) => {
  const { event_id } = req.params;
  const { hard_delete } = req.query;

  try {
    if (hard_delete === "true") {
      await pool.query("DELETE FROM events WHERE id = $1", [event_id]);
      return res.json({ success: true, message: "Event permanently deleted" });
    }

    if (req.event.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed event",
      });
    }

    const result = await pool.query(
      "UPDATE events SET status = 'Cancelled' WHERE id = $1 RETURNING *",
      [event_id]
    );
    res.json({ success: true, message: "Event cancelled", event: result.rows[0] });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/events/:event_id/participants — Get participants / leaderboard
// ─────────────────────────────────────────────
eventRoutes.get("/:event_id/participants", requireEventExists, async (req, res) => {
  const { event_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         r.id            AS registration_id,
         r.participant_type,
         r.participant_id,
         r.score,
         r.rank,
         r.registered_at
       FROM registrations r
       WHERE r.event_id = $1
       ORDER BY r.rank ASC NULLS LAST, r.registered_at ASC`,
      [event_id]
    );

    res.json({
      success: true,
      event_id,
      event_status: req.event.status,
      participants: result.rows,
    });
  } catch (err) {
    console.error("Get participants error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/events/:event_id/status — Start or complete event
// ─────────────────────────────────────────────
eventRoutes.patch("/:event_id/status", authenticate, requireEventExists, requireCouncilOwner, validateStatusUpdate, async (req, res) => {
  const { event_id } = req.params;
  const { status }   = req.body;
  const currentStatus = req.event.status;

  const transitions = {
    Upcoming: ["Live", "Cancelled"],
    Live:     ["Completed", "Cancelled"],
  };

  const allowed = transitions[currentStatus] ?? [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}`,
    });
  }

  try {
    const result = await pool.query(
      "UPDATE events SET status = $1 WHERE id = $2 RETURNING *",
      [status, event_id]
    );
    res.json({ success: true, event: result.rows[0] });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default eventRoutes;