import express from "express";

const gameRoutes = express.Router();

// GET /api/games — List all available games
gameRoutes.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        let query = "SELECT id, name, description, logo_url, rating, added_on FROM games";
        const params = [];
 
        if (search) {
            params.push(`%${search}%`);
            query += " WHERE name ILIKE $1 OR description ILIKE $1";
        }
 
        query += " ORDER BY added_on DESC";
 
        const { rows } = await pool.query(query, params);
 
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// POST /api/games — Add a game to the library
gameRoutes.post("/", async (req, res) => {
    try {
        const { name, description, logo_url, system_requirements } = req.body;
 
        if (!name) {
            return res.status(400).json({ success: false, message: "name is required." });
        }
 
        if (!system_requirements || typeof system_requirements !== "object") {
            return res.status(400).json({
                success: false,
                message: "system_requirements must be a valid JSON object."
            });
        }
 
        const { rows } = await pool.query(
            `INSERT INTO games (name, description, logo_url, system_requirements)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, description || null, logo_url || null, JSON.stringify(system_requirements)]
        );
 
        return res.status(201).json({
            success: true,
            message: "Game added to library.",
            data: rows[0]
        });
    } catch (err) {
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