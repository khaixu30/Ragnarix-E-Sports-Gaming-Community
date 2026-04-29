import jwt from 'jsonwebtoken';
import pool from '../db/db.js';

export const authMiddleware = (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({success: false, message: "Access Denied. No token provided."});
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    }catch(err){
        console.log(err);
        return res.status(401).json({success: false, message: "Invalid or expried token."});
    }
}

export const checkOwnership = async (req, res, next) => {
    try{
        const user_id = req.user._id;

        const foundUser = await pool.query(
            "SELECT id FROM users WHERE id = $1;",
            [user_id]
        );

        if(foundUser.rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "No user found."
            });
        }
        if(foundUser.rows[0].id !== user_id){
            return res.status(400).json({
                success: false,
                message: "Unauthorized."
            });
        }

        next();
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }
}
