import pool from "../db/db.js";

const adminAccessMiddleware = async(req, res, next)=> {
    try {
        const user_id = req.user._id;
        const {room_id} = req.params;
        const room = await pool.query(
            "SELECT * FROM rooms WHERE admin_id = $1 AND id = $2",
            [user_id, room_id]
        )
        if(room.rows.length===0){
            return res.status(400).json({success: false, message: "Unauthorized."})
        }

        next();

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}

export default adminAccessMiddleware