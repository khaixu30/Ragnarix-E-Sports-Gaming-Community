import pool from '../db/db.js';
import {Router} from 'express';
import authMiddleware from '../middleware/auth.middleware.js';


const roomRouter = Router();

roomRouter.post('/create', authMiddleware, async (req, res) => {
    try{
        const { room_name, visibility } = req.body;
        const admin_id = req.user._id;

        const newRoom = await pool.query(
            "INSERT INTO rooms (admin_id, room_name, visibility) VALUES ($1, $2, $3) RETURNING *;",
            [admin_id, room_name, visibility]
        );

        res.status(201).json({success: true, message: "Room Created Successfully", data: newRoom.rows[0]});

    }catch(err){
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

export default roomRouter;