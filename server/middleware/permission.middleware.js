import pool from "../db/db.js";

/**
 * requireEventExists
 * Fetches the event by :event_id and attaches it to req.event.
 * UUID format validation is handled by the pg-uuid extension — invalid
 * UUIDs will throw a DB error which we catch and return as 400.
 */
export const requireEventExists = async (req, res, next) => {
  const { event_id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [event_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    req.event = result.rows[0];
    next();
  } catch (err) {
    // PostgreSQL error code 22P02 = invalid_text_representation (bad UUID syntax)
    if (err.code === "22P02") {
      return res.status(400).json({ success: false, message: "Invalid event_id format" });
    }
    console.error("requireEventExists error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * requireCouncilOwner
 * Ensures the authenticated user belongs to the council that owns the event.
 * Must run AFTER authenticate and requireEventExists.
 *
 * Bypassed for platform admins (req.user.role === 'admin').
 */
export const requireCouncilOwner = (req, res, next) => {
  const { user, event } = req;

  if (user.role === "admin") return next();

  if (user.council_id !== event.council_id) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to modify this event",
    });
  }

  next();
};

// middleware/permission.middleware.js  — add these to your existing file

// Confirms the match row exists and attaches it to req.match
export const requireMatchExists = async (req, res, next) => {
  const { match_id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM matches WHERE id = $1", [match_id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }
    req.match = result.rows[0];
    next();
  } catch (err) {
    console.error("requireMatchExists:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Only allow the user who owns the match (or an admin) to mutate it
export const requireMatchOwner = (req, res, next) => {
  if (req.user.role === "admin" || req.user.id === req.match.user_id) return next();
  res.status(403).json({ success: false, message: "Forbidden: not your match record" });
};