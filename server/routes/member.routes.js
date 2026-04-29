import pool from '../db/db.js';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminAccessMiddleware } from '../middleware/room.middleware.js';
import bcrypt from 'bcrypt'

const memberRouter = Router();

memberRouter.post('/create/:room_id', authMiddleware, async (req, res) => {
    try {
        const { room_id } = req.params
        const user_id = req.user._id;
        const role = 'Member'

        const newMember = await pool.query(
            "INSERT INTO members_rooms (user_id, room_id, role) VALUES ($1, $2, $3) RETURNING *;",
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

memberRouter.get('/:room_id/member', authMiddleware, async (req, res) => {
    try {
        const {room_id} = req.params
        const members_rooms = await pool.query(
            "SELECT * FROM members_rooms WHERE room_id = $1",
            [room_id]
        )
        if (members_rooms.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No member found" })
        }
        res.status(200).json({ success: true, message: "members found", data: members_rooms.rows })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

memberRouter.delete('/delete/:room_id/member/:user_id', authMiddleware, adminAccessMiddleware, async (req, res) => {
    try {
        const { room_id, user_id } = req.params;
        const deleteRoom = await pool.query(
            'DELETE FROM rooms WHERE room_id = $1  AND user_id = $2', 
            [room_id, user_id]
        )
        res.status(200).json({ success: true, message: "member deleted Successfully" });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }

})



export default memberRouter;