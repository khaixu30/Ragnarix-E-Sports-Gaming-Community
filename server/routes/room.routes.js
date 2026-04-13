import pool from '../db/db.js';
import {Router} from 'express';
import authMiddleware from '../middleware/auth.middleware.js';


const roomRouter = Router();

roomRouter.post('/create', authMiddleware, async (req, res) => {
    try{

    }catch(err){
        
    }
});

export default roomRouter;