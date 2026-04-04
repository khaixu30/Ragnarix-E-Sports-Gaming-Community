import express, { urlencoded } from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';   // Authentication Routes
import friendRouter from './routes/friend.routes.js';

dotenv.config();

const app = express();

app.use(express.json());

// Using routes;

app.use('/api/auth', userRoutes);
app.use('/api/firend', friendRouter);
// Default main route;
app.get('/', (req, res) => {
    res.send('Hello, World');
});

app.listen(3000, () => {
    console.log("http://locahost:3000");
});