import pool from '../db/db.js';
import { Router } from 'express';
import checkOwnership from '../middleware/council.middleware.js'

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
        res.stauts(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

councilRoutes.patch('/patch/:council_id', authMiddleware, checkOwnership, async (req, res) => {
    try{
        const { name, description, logo_url } = req.body
        const {council_id} = req.params
        let updateFeilds = []
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
            data: updatedCouncil
        });

    }catch(err){
        res.status(500).json({
            success: false,
            message: "Internal Server Error."
        })
    }
})

export default councilRoutes;