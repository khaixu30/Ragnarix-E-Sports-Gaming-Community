import pool from '../db/db.js';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminAccessMiddleware } from '../middleware/room.middleware.js';
import bcrypt from 'bcrypt';

const roomRouter = Router();

roomRouter.post('/create', authMiddleware, async (req, res) => {
    try {
        const { room_name, visibility } = req.body;
        const admin_id = req.user._id;

        const newRoom = await pool.query(
            "INSERT INTO rooms (admin_id, room_name, visibility) VALUES ($1, $2, $3) RETURNING *;",
            [admin_id, room_name, visibility]
        );

        res.status(201).json({ success: true, message: "Room Created Successfully", data: newRoom.rows[0] });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});


roomRouter.get('/public', authMiddleware, async (req, res) => {
    try {
        const rooms = await pool.query(
            "SELECT * FROM rooms WHERE visibility = 'Public'"
        )
        if (rooms.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No room found" })
        }
        res.status(200).json({ success: true, message: "Rooms found", data: rooms.rows })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

roomRouter.get('/id/:room_id', authMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params
        const rooms = await pool.query(
            "SELECT * FROM rooms WHERE id = $1",
            [room_id]
        )
        if (rooms.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No room found" })
        }
        res.status(200).json({ success: true, message: "Rooms found", data: rooms.rows[0] })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

roomRouter.patch('/update/:room_id', authMiddleware, adminAccessMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params;
        const { room_name, room_logo_url, description, visibility, password, rules } = req.body;

        // Field validation
        const errors = [];

        if (room_name !== undefined && typeof room_name !== 'string') {
            errors.push("room_name must be a string");
        }
        if (room_name !== undefined && room_name.trim().length === 0) {
            errors.push("room_name cannot be empty");
        }

        if (room_logo_url !== undefined && typeof room_logo_url !== 'string') {
            errors.push("room_logo_url must be a string");
        }

        if (description !== undefined && typeof description !== 'string') {
            errors.push("description must be a string");
        }

        if (visibility !== undefined && !['Public', 'Private'].includes(visibility)) {
            errors.push("visibility must be 'Public' or 'Private'");
        }

        if (password !== undefined && (typeof password !== 'string' || password.trim().length === 0)) {
            errors.push("password must be a non-empty string");
        }

        if (rules !== undefined && typeof rules !== 'string') {
            errors.push("rules must be a string");
        }

        // Return validation errors if any
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed", errors });
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (room_name !== undefined) {
            updateFields.push(`room_name = $${paramCount++}`);
            updateValues.push(room_name);
        }

        if (room_logo_url !== undefined) {
            updateFields.push(`room_logo_url = $${paramCount++}`);
            updateValues.push(room_logo_url);
        }

        if (description !== undefined) {
            updateFields.push(`description = $${paramCount++}`);
            updateValues.push(description);
        }

        if (visibility !== undefined) {
            updateFields.push(`visibility = $${paramCount++}`);
            updateValues.push(visibility);
        }

        if (password !== undefined) {
            const password_hash = await bcrypt.hash(password, 10);
            updateFields.push(`password_hash = $${paramCount++}`);
            updateValues.push(password_hash);
        }

        if (rules !== undefined) {
            updateFields.push(`rules = $${paramCount++}`);
            updateValues.push(rules);
        }

        // If no fields to update, return error
        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update provided" });
        }

        // Add room_id to the end
        updateValues.push(room_id);

        const query = `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *;`;
        const updatedRoom = await pool.query(query, updateValues);

        if (updatedRoom.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        res.status(200).json({ success: true, message: "Room updated successfully", data: updatedRoom.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
})

roomRouter.delete('/delete/:room_id', authMiddleware, adminAccessMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params;
        const deleteRoom = await pool.query(
            'DELETE FROM rooms WHERE id= $1', 
            [room_id]
        )
        res.status(200).json({ success: true, message: "Room deleted Successfully" });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }

})



export default roomRouter;