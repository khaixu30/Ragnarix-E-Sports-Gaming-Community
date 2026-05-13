import { Router } from 'express';
import pool from '../db/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const friendRouter = Router();

// ── POST /api/friend/send/:receiver_id ───────────────────────────────────────
friendRouter.post('/send/:receiver_id', authMiddleware, async (req, res) => {
    try {
        const { receiver_id } = req.params;
        const sender_id = req.user._id;

        if (sender_id === receiver_id) {
            return res.status(400).json({ success: false, message: "You cannot send a request to yourself." });
        }

        const existing = await pool.query(
            `SELECT 1 FROM friends
             WHERE (requester_id = $1 AND receiver_id = $2)
                OR (requester_id = $2 AND receiver_id = $1);`,
            [sender_id, receiver_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: "A friend relationship already exists." });
        }

        const result = await pool.query(
            `INSERT INTO friends (requester_id, receiver_id, status)
             VALUES ($1, $2, 'Pending')
             RETURNING *;`,
            [sender_id, receiver_id]
        );

        res.status(201).json({ success: true, message: "Request sent.", data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── PATCH /api/friend/accept/:sender_id ─────────────────────────────────────
friendRouter.patch('/accept/:sender_id', authMiddleware, async (req, res) => {
    try {
        const { sender_id } = req.params;
        const receiver_id = req.user._id;

        const result = await pool.query(
            `UPDATE friends
             SET status = 'Accepted'
             WHERE requester_id = $1 AND receiver_id = $2
             RETURNING *;`,
            [sender_id, receiver_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Friend request not found." });
        }

        res.status(200).json({ success: true, message: "Request accepted.", data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── PATCH /api/friend/reject/:sender_id ─────────────────────────────────────
friendRouter.patch('/reject/:sender_id', authMiddleware, async (req, res) => {
    try {
        const { sender_id } = req.params;
        const receiver_id = req.user._id;

        const result = await pool.query(
            `UPDATE friends
             SET status = 'Rejected'
             WHERE requester_id = $1 AND receiver_id = $2
             RETURNING *;`,
            [sender_id, receiver_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Friend request not found." });
        }

        res.status(200).json({ success: true, message: "Request rejected.", data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── DELETE /api/friend/:target_id ────────────────────────────────────────────
// Removes or cancels any friend row between current user and target_id.
// Uses the composite PK (requester_id, receiver_id) — no separate id column.
friendRouter.delete('/:target_id', authMiddleware, async (req, res) => {
    try {
        const { target_id } = req.params;
        const user_id = req.user._id;
        console.log(target_id, user_id)

        if (!target_id || !user_id) {
            return res.status(400).json({ success: false, message: "Missing required parameters." });
        }

        const result = await pool.query(
            `DELETE FROM friends
             WHERE (requester_id = $1 AND receiver_id = $2)
                OR (requester_id = $2 AND receiver_id = $1)
             RETURNING *;`,
            [user_id, target_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Friend relationship not found." });
        }

        res.status(200).json({ success: true, message: "Removed successfully." });

    } catch (err) {
        console.error(err);
        console.log('error by route')
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── GET /api/friend/all ──────────────────────────────────────────────────────
// All relationships for current user (any status), with the other person's info.
friendRouter.get('/all', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user._id;

        const result = await pool.query(
            `SELECT
                f.requester_id,
                f.receiver_id,
                f.status,
                f.created_at,
                u.id          AS other_user_id,
                u.username,
                u.full_name,
                u.profile_pic,
                u.about_info
             FROM friends f
             JOIN users u
               ON u.id = CASE
                    WHEN f.requester_id = $1 THEN f.receiver_id
                    ELSE f.requester_id
                  END
             WHERE f.requester_id = $1 OR f.receiver_id = $1;`,
            [user_id]
        );

        res.status(200).json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── GET /api/friend/all/accepted ─────────────────────────────────────────────
friendRouter.get('/all/accepted', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user._id;

        const result = await pool.query(
            `SELECT
                f.requester_id,
                f.receiver_id,
                f.status,
                f.created_at,
                u.id          AS other_user_id,
                u.username,
                u.full_name,
                u.profile_pic,
                u.about_info
             FROM friends f
             JOIN users u
               ON u.id = CASE
                    WHEN f.requester_id = $1 THEN f.receiver_id
                    ELSE f.requester_id
                  END
             WHERE (f.requester_id = $1 OR f.receiver_id = $1)
               AND f.status = 'Accepted';`,
            [user_id]
        );

        res.status(200).json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── GET /api/friend/all/pending ──────────────────────────────────────────────
// Only incoming requests (current user is the receiver).
friendRouter.get('/all/pending', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user._id;

        const result = await pool.query(
            `SELECT
                f.requester_id,
                f.receiver_id,
                f.status,
                f.created_at,
                u.id          AS other_user_id,
                u.username,
                u.full_name,
                u.profile_pic,
                u.about_info
             FROM friends f
             JOIN users u ON u.id = f.requester_id
             WHERE f.receiver_id = $1
               AND f.status = 'Pending';`,
            [user_id]
        );

        res.status(200).json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── GET /api/friend/all/sent ─────────────────────────────────────────────────
// Outgoing pending requests sent by current user.
friendRouter.get('/all/sent', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user._id;

        const result = await pool.query(
            `SELECT
                f.requester_id,
                f.receiver_id,
                f.status,
                f.created_at,
                u.id          AS other_user_id,
                u.username,
                u.full_name,
                u.profile_pic,
                u.about_info
             FROM friends f
             JOIN users u ON u.id = f.receiver_id
             WHERE f.requester_id = $1
               AND f.status = 'Pending';`,
            [user_id]
        );

        res.status(200).json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── GET /api/friend/all/rejected ─────────────────────────────────────────────
friendRouter.get('/all/rejected', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user._id;

        const result = await pool.query(
            `SELECT
                f.requester_id,
                f.receiver_id,
                f.status,
                f.created_at,
                u.id          AS other_user_id,
                u.username,
                u.full_name,
                u.profile_pic,
                u.about_info
             FROM friends f
             JOIN users u
               ON u.id = CASE
                    WHEN f.requester_id = $1 THEN f.receiver_id
                    ELSE f.requester_id
                  END
             WHERE (f.requester_id = $1 OR f.receiver_id = $1)
               AND f.status = 'Rejected';`,
            [user_id]
        );

        res.status(200).json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// ── GET /api/friend/search?q=... ─────────────────────────────────────────────
friendRouter.get('/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        const user_id = req.user._id;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: "Query too short." });
        }

        const result = await pool.query(
            `SELECT
                u.id,
                u.username,
                u.full_name,
                u.profile_pic,
                u.about_info,
                f.status      AS friend_status,
                f.requester_id,
                f.receiver_id
             FROM users u
             LEFT JOIN friends f
               ON (f.requester_id = $2 AND f.receiver_id = u.id)
               OR (f.receiver_id  = $2 AND f.requester_id = u.id)
             WHERE (u.username ILIKE $1 OR u.full_name ILIKE $1)
               AND u.id != $2
             LIMIT 20;`,
            [`%${q.trim()}%`, user_id]
        );

        res.status(200).json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

export default friendRouter;