import pool from '../db/db.js';
import { Router } from 'express';
import { checkOwnership } from '../middleware/council.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const councilRoutes = Router()

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

// ── GET /api/councils/mine — Get current user's councils ──────────────────
councilRoutes.get('/mine', authMiddleware, async (req, res) => {
    try {
        const owner_id = req.user._id;

        const result = await pool.query(
            "SELECT * FROM councils WHERE owner_id = $1 ORDER BY created_at DESC;",
            [owner_id]
        );

        res.status(200).json({
            success: true,
            message: "User's councils retrieved.",
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

councilRoutes.get('/all', async (req, res) => {
    try{
        const councils = await pool.query(
            "SELECT * FROM councils;"
        )

        if(councils.rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "No council found."
            })
        }

        res.status(200).json({
            success: true,
            message: "Councils found.",
            data: councils.rows
        })
    }catch(err){
        res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }
})

councilRoutes.get('/info/:council_id', async (req, res) => {
    try {
        const { council_id } = req.params
        const council = await pool.query(
            "SELECT * FROM councils WHERE id = $1;",
            [council_id]
        )

        if(council.rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "Council not found."
            })
        }

        res.status(200).json({
            success: true,
            message: "Council found.",
            data: council.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

councilRoutes.patch('/patch/:council_id', authMiddleware, checkOwnership, async (req, res) => {
    try{
        const { name, description, logo_url } = req.body
        const {council_id} = req.params
        let updateFields = []
        let updateParams = []
        let paramIndex = 1

        if(name){
            updateFields.push(`name = $${paramIndex}`);
            updateParams.push(name);
            paramIndex++;
        }

        if(description){
            updateFields.push(`description = $${paramIndex}`);
            updateParams.push(description);
            paramIndex++;
        }

        if(logo_url){
            updateFields.push(`logo_url = $${paramIndex}`);
            updateParams.push(logo_url);
            paramIndex++;
        }

        updateParams.push(council_id)

         const updateQuery = `UPDATE councils SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;

        const updatedCouncil = await pool.query(updateQuery, updateParams);

        if(updatedCouncil.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Council not found."
            });
        }

        res.status(200).json({
            success: true,
            message: 'Council Updated Successfully',
            data: updatedCouncil.rows[0]
        });

    }catch(err){
        res.status(500).json({
            success: false,
            message: "Internal Server Error."
        })
    }
})

councilRoutes.delete("/:council_id", authMiddleware, checkOwnership, async (req, res) => {
    try {
        const { council_id } = req.params;
 
        await pool.query("DELETE FROM councils WHERE id = $1", [council_id]);
 
        return res.status(200).json({
            success: true,
            message: "Council deleted successfully."
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error. Issued by route" });
    }
});
 
// POST /api/councils/:council_id/members — Add organizer to council (owner only)
councilRoutes.post("/:council_id/members", checkOwnership, async (req, res) => {
    try {
        const { council_id } = req.params;
        const { user_id, role } = req.body;
 
        const validRoles = ["Tournament Director", "Moderator", "Manager"];
 
        if (!user_id || !role) {
            return res.status(400).json({ success: false, message: "user_id and role are required." });
        }
 
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(", ")}.`
            });
        }
 
        const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
 
        const { rows } = await pool.query(
            `INSERT INTO council_members (user_id, council_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, council_id)
             DO UPDATE SET role = EXCLUDED.role
             RETURNING *`,
            [user_id, council_id, role]
        );
 
        return res.status(201).json({
            success: true,
            message: "Member added to council.",
            data: rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});
 
// GET /api/councils/:council_id/members — List council organizers (public)
councilRoutes.get("/:council_id/members", async (req, res) => {
    try {
        const { council_id } = req.params;
 
        const councilCheck = await pool.query("SELECT id FROM councils WHERE id = $1", [council_id]);
        if (councilCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Council not found." });
        }
 
        const { rows } = await pool.query(
            `SELECT
                u.id,
                u.username,
                u.email,
                cm.role,
                cm.joined_at
             FROM council_members cm
             JOIN users u ON u.id = cm.user_id
             WHERE cm.council_id = $1
             ORDER BY cm.joined_at ASC`,
            [council_id]
        );
 
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});
 
// DELETE /api/councils/:council_id/members/:user_id — Remove organizer (owner only)
councilRoutes.delete("/:council_id/members/:user_id", checkOwnership, async (req, res) => {
    try {
        const { council_id, user_id } = req.params;
 
        const { rowCount } = await pool.query(
            "DELETE FROM council_members WHERE council_id = $1 AND user_id = $2",
            [council_id, user_id]
        );
 
        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: "Member not found in this council." });
        }
 
        return res.status(200).json({ success: true, message: "Member removed from council." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

export default councilRoutes;