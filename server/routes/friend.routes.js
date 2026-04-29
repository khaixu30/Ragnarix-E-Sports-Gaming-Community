import { Router } from 'express';
import pool from '../db/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js'

const friendRouter = Router();

friendRouter.post('/send/:receiver_id', authMiddleware, async (req, res) => {
    try {
        const { receiver_id } = req.params;
        const sender_id = req.user._id;

        const existing = await pool.query(
            "SELECT * FROM friends WHERE requester_id = $1 AND receiver_id = $2;",
            [sender_id, receiver_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Request already sent."
            });
        }

        const friendInstance = await pool.query(
            "INSERT INTO friends (requester_id, receiver_id, status) VALUES( $1, $2, 'Pending') RETURNING *;",
            [sender_id, receiver_id]
        );

        res.status(201).json({ success: true, message: "Request sent.", data: friendInstance.rows[0] })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
});

friendRouter.patch('/accept/:sender_id', authMiddleware, async (req, res) => {
    try {
        const { sender_id } = req.params;
        const receiver_id = req.user._id;
        
        const friendInstance = await pool.query(
            "UPDATE friends SET status = $1 WHERE requester_id = $2 AND receiver_id = $3 RETURNING *;",
            ["Accepted", sender_id, receiver_id]
        );

        res.status(200).json({ success: true, message: `Request Accepted.`, data: friendInstance.rows[0] });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

friendRouter.patch('/reject/:sender_id', authMiddleware, async (req, res) => {
    try {
        const { sender_id } = req.params;
        const receiver_id = req.user._id;
        
        const friendInstance = await pool.query(
            "UPDATE friends SET status = $1 WHERE requester_id = $2 AND receiver_id = $3 RETURNING *;",
            [`Rejected`, sender_id, receiver_id]
        );

        res.status(200).json({ success: true, message: `Request Rejected.`, data: friendInstance.rows[0] });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

friendRouter.get('/all', authMiddleware, async (req, res) => {
    try{
        const user_id = req.user._id;

        const fetchFriends = await pool.query(
            "SELECT * FROM friends WHERE requester_id = $1 OR receiver_id = $1;",
            [user_id]
        );

        if(fetchFriends.rows.length === 0){
            return res.status(404).json({success: false, message: "You don't have friends. Try adding some.", data: {}});
        }

        res.status(200).json({success: true, message: "Friends fetched successfully.", data: fetchFriends.rows});

    }catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error."});
    }
});

friendRouter.get('/all/accepted', authMiddleware, async (req, res) => {
    try{
        const user_id = req.user._id;

        const fetchFriends = await pool.query(
            "SELECT * FROM friends WHERE (requester_id = $1 OR receiver_id = $1) AND status = 'Accepted';",
            [user_id]
        );

        if(fetchFriends.rows.length === 0){
            return res.status(404).json({success: false, message: "You don't have any accepted requests.", data: {}});
        }

        res.status(200).json({success: true, message: "Friends fetched successfully.", data: fetchFriends.rows});

    }catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error."});
    }
});

friendRouter.get('/all/pending', authMiddleware, async (req, res) => {
    try{
        const user_id = req.user._id;

        const fetchFriends = await pool.query(
            "SELECT * FROM friends WHERE (requester_id = $1 OR receiver_id = $1) AND status = 'Pending';",
            [user_id]
        );

        if(fetchFriends.rows.length === 0){
            return res.status(404).json({success: false, message: "You don't have any pending requests.", data: {}});
        }

        res.status(200).json({success: true, message: "Friends fetched successfully.", data: fetchFriends.rows});

    }catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error."});
    }
});

friendRouter.get('/all/rejected', authMiddleware, async (req, res) => {
    try{
        const user_id = req.user._id;

        const fetchFriends = await pool.query(
            "SELECT * FROM friends WHERE (requester_id = $1 OR receiver_id = $1) AND status = 'Rejected';",
            [user_id]
        );

        if(fetchFriends.rows.length === 0){
            return res.status(404).json({success: false, message: "You don't have any rejected requests.", data: {}});
        }

        res.status(200).json({success: true, message: "Friends fetched successfully.", data: fetchFriends.rows});

    }catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error."});
    }
});

export default friendRouter;