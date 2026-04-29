import pool from "../db/db.js";

const checkOwnership = async(req, res, next)=> {
    try {
        const user_id = req.user._id;
        const {council_id} = req.params;
        const council = await pool.query(
            "SELECT * FROM rooms WHERE owner_id = $1 AND id = $2",
            [user_id, council_id]
        )
        if(council.rows.length===0){
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

export default checkOwnership