import pool from '../db/db.js';
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAccessMiddleware from '../middleware/room.middleware.js';
import bcrypt from 'bcrypt'

const memberRouter = Router();

memberRouter.post('/create/:room_id', authMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params
        const user_id = req.user._id;
        const role = 'Member'

        const newMember = await pool.query(
            "INSERT INTO rooms (user_id, room_id, role) VALUES ($1, $2, $3) RETURNING *;",
            [user_id, room_id, role]
        );

        res.status(201).json({ success: true, message: "Member joined Successfully", data: newMember.rows[0] });

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
            "SELECT * FROM rooms WHERE visibility = Public"
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
        const { admin_id, room_name, room_logo_url, description, visibility, password, rules } = req.body;
        const password_hash = await bcrypt.hash(password, 10);
        const { room_id } = req.params;
        const updatedRoom = await pool.query(
            'UPDATE rooms SET  admin_id = $1, room_name = $2, room_logo_url = $3, description = $4, visibility = $6, password_hash = $7, rules =$8 WHERE id = $9 RETURNING *;',
            [admin_id, room_name, room_logo_url, description, visibility, password_hash, rules, room_id]
        )
        res.status(200).json({ success: true, message: "Room updated Successfully", data: updatedRoom.rows[0] });
    } catch (error) {
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