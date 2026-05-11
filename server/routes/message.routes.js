import { Router } from 'express';
import pool from '../db/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { broadcastToRoom } from '../ws/broadcast.js';

const messageRouter = Router();

// ── GET /api/message/:room_id — fetch messages (paginated) ──────────────
messageRouter.get('/:room_id', authMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params;
        const { limit = 50, before } = req.query;
        const user_id = req.user._id;                    // ← was req.user._id

        // Check membership
        const memberCheck = await pool.query(
            `SELECT 1 FROM room_members
             WHERE room_id = $1 AND user_id = $2 AND is_banned = FALSE`,
            [room_id, user_id]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this room.'
            });
        }

        const cursorCondition = before
            ? `AND m.created_at < (SELECT created_at FROM messages WHERE id = $3)`
            : '';

        const params = before
            ? [room_id, parseInt(limit), before]
            : [room_id, parseInt(limit)];

        const messages = await pool.query(
            `SELECT
                m.id,
                m.room_id,
                m.content,
                m.message_type,
                m.reply_to,
                m.is_edited,
                m.is_deleted,
                m.created_at,
                u.id          AS sender_id,
                u.username    AS sender_username,
                u.full_name   AS sender_full_name,
                u.profile_pic AS sender_profile_pic,
                rm.content    AS reply_content,
                ru.username   AS reply_username
             FROM messages m
             JOIN  users u  ON u.id  = m.sender_id
             LEFT JOIN messages rm ON rm.id = m.reply_to
             LEFT JOIN users    ru ON ru.id = rm.sender_id
             WHERE m.room_id = $1
             ${cursorCondition}
             ORDER BY m.created_at DESC
             LIMIT $2`,
            params
        );

        res.status(200).json({
            success: true,
            data: messages.rows.reverse(),           // chronological order
            has_more: messages.rows.length === parseInt(limit)
        });

    } catch (err) {
        console.error('[GET /message/:room_id]', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// ── POST /api/message/:room_id — send a message ─────────────────────────
messageRouter.post('/:room_id', authMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params;
        const { content, message_type = 'text', reply_to = null } = req.body;
        const sender_id = req.user._id;               // ← was req.user._id

        if (!content?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message content cannot be empty.'
            });
        }

        // Check membership + not banned
        const memberCheck = await pool.query(
            `SELECT 1 FROM room_members
             WHERE room_id = $1 AND user_id = $2 AND is_banned = FALSE`,
            [room_id, sender_id]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to send messages in this room.'
            });
        }

        const inserted = await pool.query(
            `INSERT INTO messages (room_id, sender_id, content, message_type, reply_to)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [room_id, sender_id, content.trim(), message_type, reply_to]
        );

        // Fetch full message with sender info for the response + broadcast
        const full = await pool.query(
            `SELECT
                m.id, m.room_id, m.content, m.message_type, m.reply_to,
                m.is_edited, m.is_deleted, m.created_at,
                u.id          AS sender_id,
                u.username    AS sender_username,
                u.full_name   AS sender_full_name,
                u.profile_pic AS sender_profile_pic,
                rm.content    AS reply_content,
                ru.username   AS reply_username
             FROM messages m
             JOIN  users u  ON u.id  = m.sender_id
             LEFT JOIN messages rm ON rm.id = m.reply_to
             LEFT JOIN users    ru ON ru.id = rm.sender_id
             WHERE m.id = $1`,
            [inserted.rows[0].id]
        );

        const messageData = full.rows[0];

        // ── Broadcast to all clients in this room ──
        broadcastToRoom(room_id, {
            type: 'new_message',
            data: messageData
        });

        res.status(201).json({
            success: true,
            message: 'Message sent.',
            data: messageData
        });

    } catch (err) {
        console.error('[POST /message/:room_id]', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// ── PATCH /api/message/:message_id — edit a message ─────────────────────
messageRouter.patch('/:message_id', authMiddleware, async (req, res) => {
    try {
        const { message_id } = req.params;
        const { content } = req.body;
        const user_id = req.user._id;                 // ← was req.user._id

        if (!content?.trim()) {
            return res.status(400).json({ success: false, message: 'Content cannot be empty.' });
        }

        // Only sender can edit
        const msgCheck = await pool.query(
            `SELECT room_id FROM messages WHERE id = $1 AND sender_id = $2`,
            [message_id, user_id]
        );

        if (msgCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'You can only edit your own messages.' });
        }

        const updated = await pool.query(
            `UPDATE messages
             SET content = $1, is_edited = TRUE
             WHERE id = $2
             RETURNING *`,
            [content.trim(), message_id]
        );

        const messageData = updated.rows[0];

        // ── Broadcast edit ──
        broadcastToRoom(messageData.room_id, {
            type: 'message_updated',
            data: messageData
        });

        res.status(200).json({ success: true, message: 'Message edited.', data: messageData });

    } catch (err) {
        console.error('[PATCH /message/:message_id]', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// ── DELETE /api/message/:message_id — soft delete ───────────────────────
messageRouter.delete('/:message_id', authMiddleware, async (req, res) => {
    try {
        const { message_id } = req.params;
        const user_id = req.user._id;                 // ← was req.user._id

        const msgCheck = await pool.query(
            `SELECT * FROM messages WHERE id = $1`,
            [message_id]
        );

        if (msgCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Message not found.' });
        }

        const msg = msgCheck.rows[0];

        // Sender or room Admin/Moderator can delete
        const memberCheck = await pool.query(
            `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2`,
            [msg.room_id, user_id]
        );

        const role = memberCheck.rows[0]?.role;
        const canDelete = msg.sender_id === user_id || role === 'Admin' || role === 'Moderator';

        if (!canDelete) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this message.' });
        }

        await pool.query(
            `UPDATE messages
             SET is_deleted = TRUE, content = '[Message deleted]'
             WHERE id = $1`,
            [message_id]
        );

        // ── Broadcast delete ──
        broadcastToRoom(msg.room_id, {
            type: 'message_deleted',
            data: { id: message_id, room_id: msg.room_id }
        });

        res.status(200).json({ success: true, message: 'Message deleted.' });

    } catch (err) {
        console.error('[DELETE /message/:message_id]', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// ── POST /api/message/room/:room_id/join ────────────────────────────────
// NOTE: this route must be defined BEFORE /:room_id to avoid param conflict
messageRouter.post('/room/:room_id/join', authMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params;
        const { password } = req.body;
        const user_id = req.user._id;                 // ← was req.user._id

        const room = await pool.query(
            `SELECT * FROM rooms WHERE id = $1`,
            [room_id]
        );

        if (room.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found.' });
        }

        const roomData = room.rows[0];

        // Already a member?
        const existing = await pool.query(
            `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2`,
            [room_id, user_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Already a member.' });
        }

        // Private room password check
        if (roomData.visibility === 'Private') {
            if (!password) {
                return res.status(401).json({ success: false, message: 'Password required for private rooms.' });
            }
            const bcrypt = await import('bcrypt');
            const valid = await bcrypt.default.compare(password, roomData.password_hash);
            if (!valid) {
                return res.status(401).json({ success: false, message: 'Incorrect password.' });
            }
        }

        const newMember = await pool.query(
            `INSERT INTO room_members (room_id, user_id, role)
             VALUES ($1, $2, 'Member')
             RETURNING *`,
            [room_id, user_id]
        );

        res.status(201).json({ success: true, message: 'Joined room.', data: newMember.rows[0] });

    } catch (err) {
        console.error('[POST /message/room/:room_id/join]', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

export default messageRouter;