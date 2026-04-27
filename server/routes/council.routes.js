import pool from '../db/db.js';
import { Router } from 'express';

const councilRoutes = Router();

councilRoutes.post('/create', authMiddleware, async (req, res) => {
    try{
        const { name, description, logo_url} = req.body;
        const owner_id = req.user._id;

        const newCouncil = await pool.query(
            "INSERT INTO councils (owner_id, name, description, logo_url) VALUES ( $1, $2, $3, $4) RETURNING *;",
            [ owner_id, name, description, logo_url]
        );

        res.status(201).json({ success: true, message: "Council created.", data: newCouncil.rows[0]});

    }catch(err){
        res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
});

export default councilRoutes;