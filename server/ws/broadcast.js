// ws/broadcast.js
// Singleton map: room_id (string) → Set<WebSocket>
// Imported by both index.js (to register clients) and routes (to broadcast).

const roomClients = new Map();

/**
 * Register a WebSocket client into a room.
 * Called from the WebSocket upgrade handler in index.js.
 */
export const registerClient = (room_id, ws) => {
    const key = String(room_id);
    if (!roomClients.has(key)) roomClients.set(key, new Set());
    roomClients.get(key).add(ws);
};

/**
 * Remove a WebSocket client from a room.
 * Called on 'close' event.
 */
export const unregisterClient = (room_id, ws) => {
    const key = String(room_id);
    roomClients.get(key)?.delete(ws);
    if (roomClients.get(key)?.size === 0) roomClients.delete(key);
};

/**
 * Broadcast a JSON payload to every connected client in a room.
 * Called from message routes after INSERT / UPDATE / DELETE.
 */
export const broadcastToRoom = (room_id, payload) => {
    const key = String(room_id);
    const clients = roomClients.get(key);
    if (!clients || clients.size === 0) return;

    const serialized = JSON.stringify(payload);
    clients.forEach(ws => {
        // readyState 1 = OPEN
        if (ws.readyState === 1) {
            ws.send(serialized);
        }
    });
};