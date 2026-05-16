import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

import userRoutes         from './routes/user.routes.js';
import friendRouter       from './routes/friend.routes.js';
import roomRouter         from './routes/room.routes.js';
import councilRoutes      from './routes/council.routes.js';
import memberRouter       from './routes/member.routes.js';
import teamRoutes         from './routes/team.routes.js';
import eventRoutes        from './routes/event.routes.js';
import gameRoutes         from './routes/game.routes.js';
import registrationRoutes from './routes/registration.routes.js';
import messageRouter      from './routes/message.routes.js';

import { registerClient, unregisterClient } from './ws/broadcast.js';

dotenv.config();

// ── Express app ─────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',     userRoutes);
app.use('/api/friend',   friendRouter);
app.use('/api/room',     roomRouter);
app.use('/api/member',   memberRouter);
app.use('/api/team',     teamRoutes);
app.use('/api/events',   eventRoutes);
app.use('/api/game',     gameRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/council',  councilRoutes);
app.use('/api/message',  messageRouter);

app.get('/', (_req, res) => res.send('Ragnarix API is running.'));

// ── HTTP server (shared by Express + WebSocket) ─────────
const server = createServer(app);

// ── WebSocket server ─────────────────────────────────────
// Client connects to: ws://localhost:3000/ws/room/:room_id?token=<jwt>
const wss = new WebSocketServer({ server, path: undefined });

wss.on('connection', (ws, req) => {
    try {
        // Parse URL — req.url is the raw path+query, e.g. /ws/room/42?token=xxx
        const url    = new URL(req.url, 'http://localhost');
        const parts  = url.pathname.split('/');          // ['', 'ws', 'room', ':id']
        const room_id = parts[3];
        const token   = url.searchParams.get('token');

        // ── Authenticate ──────────────────────────────────
        if (!token || !room_id) {
            ws.close(4001, 'Missing token or room_id');
            return;
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            ws.close(4003, 'Invalid or expired token');
            return;
        }

        ws.user_id = decoded.id;      // attach for reference
        ws.room_id = room_id;

        // ── Register ──────────────────────────────────────
        registerClient(room_id, ws);
        console.log(`[WS] User ${decoded.id} joined room ${room_id} (total open: ${wss.clients.size})`);

        // ── Keep-alive ping every 30 s ────────────────────
        const pingInterval = setInterval(() => {
            if (ws.readyState === 1) ws.ping();
        }, 30_000);

        // ── Cleanup on disconnect ─────────────────────────
        ws.on('close', (code, reason) => {
            clearInterval(pingInterval);
            unregisterClient(room_id, ws);
            console.log(`[WS] User ${decoded.id} left room ${room_id} (code ${code})`);
        });

        ws.on('error', (err) => {
            console.error(`[WS] Error for user ${decoded.id}:`, err.message);
        });

        // We don't expect clients to send WS frames (REST handles writes),
        // but handle it gracefully just in case.
        ws.on('message', (data) => {
            console.warn(`[WS] Unexpected client message from user ${decoded.id}:`, data.toString());
        });

    } catch (err) {
        console.error('[WS] Connection setup error:', err);
        ws.close(1011, 'Server error');
    }
});

// ── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP + WS server running → http://localhost:${PORT}`);
});