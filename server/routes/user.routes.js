import { Router } from 'express';
import pool from '../db/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {authMiddleware, checkOwnership} from '../middleware/auth.middleware.js';

const userRouter = Router();

userRouter.post('/signup', async (req, res) => {
    try {

        const { username, email, password, full_name, phone_number, profile_pic, about_info, account_type } = req.body;
        const password_hash = await bcrypt.hash(password, 10);

        const _check_1 = await pool.query(
            "SELECT * FROM users WHERE email = $1;",
            [email]
        )

        if (_check_1.rows.length !== 0) {
            return res.status(400).json({
                success: false,
                message: "Email already in use."
            });
        }

        const _check_2 = await pool.query(
            "SELECT * FROM users WHERE username = $1;",
            [username]
        )

        if (_check_2.rows.length !== 0) {
            return res.status(400).json({
                success: false,
                message: "Username not available."
            });
        }

        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, full_name, phone_number, profile_pic, about_info, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;",
            [username, email, password_hash, full_name, phone_number, profile_pic, about_info, account_type]
        );

        const payload = {
            _id: newUser.rows[0].id,
            email: newUser.rows[0].email,
            username: newUser.rows[0].username
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            success: true,
            message: 'User Created Successfully',
            data: {
                id: newUser.rows[0].id,
                username: newUser.rows[0].username,
                email: newUser.rows[0].email,
                full_name: newUser.rows[0].full_name,
                phone_number: newUser.rows[0].phone_number,
                profile_pic: newUser.rows[0].profile_pic,
                about_info: newUser.rows[0].about_info,
                account_type: newUser.rows[0].account_type,
                is_verified: newUser.rows[0].is_verified
            },
            token
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

userRouter.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const foundUser = await pool.query(
            "SELECT * FROM users WHERE username = $1 OR email = $1;",
            [username || email]
        );

        if (foundUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Username not found'
            });
        }

        const isMatched = await bcrypt.compare(password, foundUser.rows[0].password_hash);
        if (!isMatched) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect Username or Password'
            });
        }

        const payload = {
            _id: foundUser.rows[0].id,
            email: foundUser.rows[0].email,
            username: foundUser.rows[0].username
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            message: 'Login Successful.',
            data: {
                id: foundUser.rows[0].id,
                username: foundUser.rows[0].username,
                email: foundUser.rows[0].email,
                full_name: foundUser.rows[0].full_name,
                phone_number: foundUser.rows[0].phone_number,
                profile_pic: foundUser.rows[0].profile_pic,
                about_info: foundUser.rows[0].about_info,
                account_type: foundUser.rows[0].account_type,
                is_verified: foundUser.rows[0].is_verified
            },
            token
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        });
    }
});

userRouter.get('/get/:user_id', authMiddleware, async (req, res) => {
    try {
        const { user_id } = req.params;
        const foundUser = await pool.query(
            "SELECT * FROM users WHERE id = $1;",
            [user_id]
        );

        if (foundUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "User found",
            data: {
                id: foundUser.rows[0].id,
                username: foundUser.rows[0].username,
                email: foundUser.rows[0].email,
                full_name: foundUser.rows[0].full_name,
                phone_number: foundUser.rows[0].phone_number,
                profile_pic: foundUser.rows[0].profile_pic,
                about_info: foundUser.rows[0].about_info,
                account_type: foundUser.rows[0].account_type,
                is_verified: foundUser.rows[0].is_verified
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        });
    }
});

userRouter.get('/me', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user._id; // 👈 set by authMiddleware, no need for req.params

        const foundUser = await pool.query(
            "SELECT * FROM users WHERE id = $1;",
            [user_id]
        );

        if (foundUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "User found",
            data: {
                id: foundUser.rows[0].id,
                username: foundUser.rows[0].username,
                email: foundUser.rows[0].email,
                full_name: foundUser.rows[0].full_name,
                phone_number: foundUser.rows[0].phone_number,
                profile_pic: foundUser.rows[0].profile_pic,
                about_info: foundUser.rows[0].about_info,
                account_type: foundUser.rows[0].account_type,
                is_verified: foundUser.rows[0].is_verified
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        });
    }
});


userRouter.patch('/update/:id', authMiddleware, checkOwnership, async (req, res) => {
    try{
        const { id } = req.params;
        const { username, password, full_name, phone_number, profile_pic, about_info, account_type } = req.body;

        // Check if username is being updated
        if(username) {
            const _check_username = await pool.query(
                "SELECT * FROM users WHERE username = $1 AND id != $2;",
                [username, id]
            );
            if (_check_username.rows.length !== 0) {
                return res.status(400).json({
                    success: false,
                    message: "Username not available."
                });
            }
        }

        // Build dynamic update query with provided fields
        let updateFields = [];
        let updateParams = [];
        let paramIndex = 1;

        if(username) {
            updateFields.push(`username = $${paramIndex}`);
            updateParams.push(username);
            paramIndex++;
        }

        if(password) {
            const password_hash = await bcrypt.hash(password, 10);
            updateFields.push(`password_hash = $${paramIndex}`);
            updateParams.push(password_hash);
            paramIndex++;
        }

        if(full_name) {
            updateFields.push(`full_name = $${paramIndex}`);
            updateParams.push(full_name);
            paramIndex++;
        }

        if(phone_number) {
            updateFields.push(`phone_number = $${paramIndex}`);
            updateParams.push(phone_number);
            paramIndex++;
        }

        if(profile_pic) {
            updateFields.push(`profile_pic = $${paramIndex}`);
            updateParams.push(profile_pic);
            paramIndex++;
        }

        if(about_info) {
            updateFields.push(`about_info = $${paramIndex}`);
            updateParams.push(about_info);
            paramIndex++;
        }

        if(account_type) {
            updateFields.push(`account_type = $${paramIndex}`);
            updateParams.push(account_type);
            paramIndex++;
        }

        // If no fields to update, return error
        if(updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update."
            });
        }

        // Add user ID to params
        updateParams.push(id);

        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;

        const updatedUser = await pool.query(updateQuery, updateParams);

        if(updatedUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: 'User Updated Successfully',
            data: {
                id: updatedUser.rows[0].id,
                username: updatedUser.rows[0].username,
                email: updatedUser.rows[0].email,
                profile_pic: updatedUser.rows[0].profile_pic,
                account_type: updatedUser.rows[0].account_type,
                about_info: updatedUser.rows[0].about_info,
                full_name: updatedUser.rows[0].full_name,
                phone_number: updatedUser.rows[0].phone_number,
                is_verified: updatedUser.rows[0].is_verified
            }
        });
    }catch(err){
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

export default userRouter;