import express from "express";
import pool from '../db/db.js';
import { authMiddleware } from "../middleware/auth.middleware.js";

const gameRoutes = express.Router();

// GET /api/games — List all available games
gameRoutes.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        let query = "SELECT id, name, description, logo_url, rating, added_on FROM games";
        const params = [];
 
        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            query += " WHERE name ILIKE $1 OR description ILIKE $1";
        }
 
        query += " ORDER BY added_on DESC";
 
        const { rows } = await pool.query(query, params);
 
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// POST /api/games — Add a game to the library
gameRoutes.post("/add", authMiddleware, async (req, res) => {
    try {
        const { name, description, logo_url, system_requirements } = req.body;

        // Validation
        const errors = [];

        if (!name || typeof name !== "string" || !name.trim()) {
            errors.push("name is required and must be a non-empty string.");
        }

        if (description !== undefined && description !== null && typeof description !== "string") {
            errors.push("description must be a string.");
        }

        if (logo_url !== undefined && logo_url !== null && typeof logo_url !== "string") {
            errors.push("logo_url must be a string.");
        }

        if (!system_requirements || typeof system_requirements !== "object" || Array.isArray(system_requirements)) {
            errors.push("system_requirements must be a valid JSON object (not an array).");
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed", errors });
        }
 
        const { rows } = await pool.query(
            `INSERT INTO games (name, description, logo_url, system_requirements)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name.trim(), description?.trim() || null, logo_url?.trim() || null, JSON.stringify(system_requirements)]
        );
 
        return res.status(201).json({
            success: true,
            message: "Game added to library.",
            data: rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// GET /api/games/:game_id — Get specific game details
gameRoutes.get("/:game_id", async (req, res) => {
    try {
        const { game_id } = req.params;
 
        const { rows } = await pool.query("SELECT * FROM games WHERE id = $1", [game_id]);
 
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Game not found." });
        }
 
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

export default gameRoutes;