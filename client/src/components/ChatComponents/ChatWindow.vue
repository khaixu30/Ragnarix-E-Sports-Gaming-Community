<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';

const props = defineProps({
    room: { type: Object, default: null }
});

const messages = ref([]);
const loading = ref(false);
const sending = ref(false);
const messageText = ref('');
const replyTo = ref(null);
const messagesEnd = ref(null);
const messagesContainer = ref(null);
const user = ref(null);
const joined = ref(false);
const joinLoading = ref(false);
const joinPassword = ref('');
const joinError = ref('');
const wsConnected = ref(false);

const token = localStorage.getItem('token');
const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// ── WebSocket ────────────────────────────────────────────
let ws = null;

// Notification sound — generated via Web Audio API, no file needed
const playNotificationSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Two-tone "pop" — high then slightly lower
        const tones = [
            { freq: 880, start: 0,    duration: 0.06 },
            { freq: 660, start: 0.07, duration: 0.08 },
        ];

        tones.forEach(({ freq, start, duration }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

            gain.gain.setValueAtTime(0, ctx.currentTime + start);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration + 0.05);
        });
    } catch (err) {
        // AudioContext not available — silently skip
        console.warn('Notification sound unavailable:', err);
    }
};

const connectWebSocket = () => {
    if (!props.room || !user.value) return;

    // Close any existing connection first
    disconnectWebSocket();

    const wsUrl = `ws://${import.meta.env.VITE_WS_URL}/ws/room/${props.room.id}?token=${token}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        wsConnected.value = true;
        console.log(`[WS] Connected to room ${props.room.id}`);
    };

    ws.onmessage = async (event) => {
        try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'new_message') {
                const incoming = payload.data;

                // Avoid duplicates (our own optimistic pushes)
                const alreadyExists = messages.value.some(m => m.id === incoming.id);
                if (alreadyExists) return;

                messages.value.push(incoming);
                await scrollToBottom();

                // Only play sound for messages from others
                if (incoming.sender_id !== user.value?.id) {
                    playNotificationSound();
                }
            }

            if (payload.type === 'message_deleted') {
                const idx = messages.value.findIndex(m => m.id === payload.data.id);
                if (idx !== -1) messages.value[idx].is_deleted = true;
            }

            if (payload.type === 'message_updated') {
                const idx = messages.value.findIndex(m => m.id === payload.data.id);
                if (idx !== -1) messages.value[idx] = { ...messages.value[idx], ...payload.data };
            }

        } catch (err) {
            console.error('[WS] Failed to parse message:', err);
        }
    };

    ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        wsConnected.value = false;
    };

    ws.onclose = (event) => {
        wsConnected.value = false;
        console.log(`[WS] Disconnected (code ${event.code})`);

        // Auto-reconnect after 3s unless we deliberately closed (code 1000)
        if (event.code !== 1000 && props.room) {
            setTimeout(() => {
                if (props.room) connectWebSocket();
            }, 3000);
        }
    };
};

const disconnectWebSocket = () => {
    if (ws) {
        ws.close(1000, 'Room changed');
        ws = null;
        wsConnected.value = false;
    }
};

// ── Helpers ─────────────────────────────────────────────
const isMyMessage = (msg) => msg.sender_id === user.value?.id;

const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });
};

const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
    });
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const scrollToBottom = async () => {
    await nextTick();
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' });
};

// ── API calls ────────────────────────────────────────────
const fetch_user = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_HOST}/api/auth/me`, { headers: authHeaders });
        const json = await res.json();
        if (json.success) user.value = json.data;
    } catch (err) {
        console.error(err);
    }
};

const check_membership = async () => {
    if (!props.room) return;
    try {
        const res = await fetch(`${import.meta.env.VITE_HOST}/api/message/${props.room.id}?limit=1`, {
            headers: authHeaders
        });
        joined.value = res.ok;
    } catch (err) {
        joined.value = false;
    }
};

const join_room = async () => {
    joinError.value = '';
    joinLoading.value = true;
    try {
        const res = await fetch(`${import.meta.env.VITE_HOST}/api/message/room/${props.room.id}/join`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ password: joinPassword.value })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        joined.value = true;
        await fetch_messages();
        connectWebSocket();
    } catch (err) {
        joinError.value = err.message;
    } finally {
        joinLoading.value = false;
    }
};

const fetch_messages = async () => {
    if (!props.room) return;
    loading.value = true;
    try {
        const res = await fetch(`${import.meta.env.VITE_HOST}/api/message/${props.room.id}`, {
            headers: authHeaders
        });
        const json = await res.json();
        if (json.success) {
            messages.value = json.data;
            await scrollToBottom();
        }
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const send_message = async () => {
    if (!messageText.value.trim() || sending.value) return;
    sending.value = true;
    const content = messageText.value.trim();
    messageText.value = '';

    try {
        const res = await fetch(`${import.meta.env.VITE_HOST}/api/message/${props.room.id}`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                content,
                message_type: 'text',
                reply_to: replyTo.value?.id || null
            })
        });
        const json = await res.json();
        if (json.success) {
            // Push optimistically — WS echo will be deduplicated by id check
            messages.value.push(json.data);
            replyTo.value = null;
            await scrollToBottom();
        }
    } catch (err) {
        console.error(err);
        messageText.value = content; // restore on fail
    } finally {
        sending.value = false;
    }
};

const delete_message = async (msg) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_HOST}/api/message/${msg.id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        const json = await res.json();
        if (json.success) {
            const idx = messages.value.findIndex(m => m.id === msg.id);
            if (idx !== -1) messages.value[idx].is_deleted = true;
        }
    } catch (err) {
        console.error(err);
    }
};

const handleKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send_message();
    }
};

// ── Computed ─────────────────────────────────────────────
const groupedMessages = computed(() => {
    const groups = [];
    let lastDate = null;
    for (const msg of messages.value) {
        const date = new Date(msg.created_at).toDateString();
        if (date !== lastDate) {
            groups.push({ type: 'date', label: formatDate(msg.created_at) });
            lastDate = date;
        }
        groups.push({ type: 'message', data: msg });
    }
    return groups;
});

// ── Watchers ─────────────────────────────────────────────

// Re-run when room prop changes
watch(() => props.room, async (room) => {
    if (!room) {
        disconnectWebSocket();
        return;
    }
    messages.value = [];
    replyTo.value = null;
    await check_membership();
    if (joined.value) {
        await fetch_messages();
        connectWebSocket();
    }
}, { immediate: true });

// Connect WebSocket once user is loaded (covers the initial mount race)
watch(user, (u) => {
    if (u && joined.value && props.room && !ws) {
        connectWebSocket();
    }
});

// ── Lifecycle ────────────────────────────────────────────
onMounted(() => fetch_user());
onUnmounted(() => disconnectWebSocket());
</script>

<template>
    <div class="chat-window">

        <!-- Empty state -->
        <div v-if="!room" class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-comment-dots"></i></div>
            <h3>Select a Room</h3>
            <p>Pick a chat room from the left panel to start messaging.</p>
        </div>

        <template v-else>

            <!-- Room header -->
            <div class="room-header">
                <div class="room-header-left">
                    <div class="room-avatar">
                        <img v-if="room.room_logo_url" :src="room.room_logo_url" :alt="room.room_name" />
                        <span v-else>{{ room.room_name?.charAt(0) }}</span>
                    </div>
                    <div>
                        <p class="room-header-name">{{ room.room_name }}</p>
                        <p class="room-header-desc">{{ room.description || 'No description.' }}</p>
                    </div>
                </div>
                <div class="room-header-right">
                    <span class="vis-pill" :class="room.visibility === 'Private' ? 'private' : 'public'">
                        <i :class="room.visibility === 'Private' ? 'fa-solid fa-lock' : 'fa-solid fa-globe'"></i>
                        {{ room.visibility }}
                    </span>
                </div>
            </div>

            <!-- Join gate (not a member yet) -->
            <div v-if="!joined" class="join-gate">
                <div class="join-card">
                    <div class="join-icon">
                        <i class="fa-solid fa-door-open"></i>
                    </div>
                    <h3>Join <span>{{ room.room_name }}</span></h3>
                    <p>You need to join this room to see and send messages.</p>

                    <div v-if="room.visibility === 'Private'" class="field" style="width:100%;max-width:300px;">
                        <label>Room Password</label>
                        <div class="input-wrap">
                            <i class="fa-solid fa-key input-icon"></i>
                            <input type="password" v-model="joinPassword" placeholder="Enter room password" />
                        </div>
                    </div>

                    <div v-if="joinError" class="error-box">
                        <i class="fa-solid fa-triangle-exclamation"></i> {{ joinError }}
                    </div>

                    <button class="btn-primary" @click="join_room" :disabled="joinLoading">
                        <span v-if="!joinLoading"><i class="fa-solid fa-right-to-bracket"></i> Join Room</span>
                        <span v-else><i class="fa-solid fa-spinner fa-spin"></i> Joining...</span>
                    </button>
                </div>
            </div>

            <template v-else>

                <!-- Messages area -->
                <div class="messages-area" ref="messagesContainer">
                    <div v-if="loading" class="messages-loading">
                        <i class="fa-solid fa-spinner fa-spin"></i> Loading messages...
                    </div>

                    <div v-else-if="messages.length === 0" class="messages-empty">
                        <i class="fa-solid fa-comment-slash"></i>
                        <p>No messages yet. Say something!</p>
                    </div>

                    <template v-else>
                        <template v-for="(item, idx) in groupedMessages" :key="idx">

                            <!-- Date separator -->
                            <div v-if="item.type === 'date'" class="date-sep">
                                <div class="sep-line"></div>
                                <span>{{ item.label }}</span>
                                <div class="sep-line"></div>
                            </div>

                            <!-- Message bubble -->
                            <div
                                v-else
                                class="message-wrap"
                                :class="{ mine: isMyMessage(item.data) }"
                            >
                                <!-- Avatar (others only) -->
                                <div v-if="!isMyMessage(item.data)" class="msg-avatar">
                                    <img
                                        v-if="item.data.sender_profile_pic"
                                        :src="item.data.sender_profile_pic"
                                        :alt="item.data.sender_username"
                                    />
                                    <span v-else>{{ getInitials(item.data.sender_full_name || item.data.sender_username) }}</span>
                                </div>

                                <div class="msg-body">
                                    <!-- Sender name (others only) -->
                                    <p v-if="!isMyMessage(item.data)" class="msg-sender">
                                        {{ item.data.sender_full_name || item.data.sender_username }}
                                    </p>

                                    <!-- Reply preview -->
                                    <div v-if="item.data.reply_content" class="reply-preview">
                                        <span class="reply-who">@{{ item.data.reply_username }}</span>
                                        <span class="reply-text">{{ item.data.reply_content }}</span>
                                    </div>

                                    <!-- Bubble -->
                                    <div
                                        class="msg-bubble"
                                        :class="{
                                            'bubble-mine': isMyMessage(item.data),
                                            'bubble-deleted': item.data.is_deleted
                                        }"
                                    >
                                        <span v-if="item.data.is_deleted" class="deleted-text">
                                            <i class="fa-solid fa-ban"></i> Message deleted
                                        </span>
                                        <span v-else>{{ item.data.content }}</span>
                                        <span v-if="item.data.is_edited && !item.data.is_deleted" class="edited-tag">edited</span>
                                    </div>

                                    <!-- Actions + time -->
                                    <div class="msg-meta" :class="{ 'meta-mine': isMyMessage(item.data) }">
                                        <span class="msg-time">{{ formatTime(item.data.created_at) }}</span>
                                        <div class="msg-actions" v-if="!item.data.is_deleted">
                                            <button class="action-btn" @click="replyTo = item.data" title="Reply">
                                                <i class="fa-solid fa-reply"></i>
                                            </button>
                                            <button
                                                v-if="isMyMessage(item.data)"
                                                class="action-btn danger"
                                                @click="delete_message(item.data)"
                                                title="Delete"
                                            >
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </template>
                        <div ref="messagesEnd"></div>
                    </template>
                </div>

                <!-- Reply bar -->
                <div v-if="replyTo" class="reply-bar">
                    <div class="reply-bar-inner">
                        <i class="fa-solid fa-reply reply-icon"></i>
                        <div>
                            <p class="reply-bar-who">Replying to @{{ replyTo.sender_username }}</p>
                            <p class="reply-bar-preview">{{ replyTo.content }}</p>
                        </div>
                    </div>
                    <button class="reply-clear" @click="replyTo = null">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Input area -->
                <div class="input-area">
                    <div class="input-wrap">
                        <textarea
                            v-model="messageText"
                            class="message-input"
                            placeholder="Type a message... (Enter to send)"
                            rows="1"
                            @keydown="handleKeydown"
                        ></textarea>
                        <button
                            class="send-btn"
                            @click="send_message"
                            :disabled="!messageText.trim() || sending"
                        >
                            <i v-if="!sending" class="fa-solid fa-paper-plane"></i>
                            <i v-else class="fa-solid fa-spinner fa-spin"></i>
                        </button>
                    </div>
                </div>

            </template>
        </template>
    </div>
</template>

<style scoped>
.chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: #1a1410;
}

/* ── Empty state ── */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    opacity: 0.35;
    text-align: center;
    padding: 48px;
}

.empty-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(188, 103, 33, 0.1);
    border: 1px solid rgba(188, 103, 33, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: var(--primary-color);
}

.empty-state h3 {
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
}

.empty-state p { font-size: 13px; }

/* ── Room header ── */
.room-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: var(--bg-color);
    border-bottom: 1px solid rgba(188, 103, 33, 0.15);
    flex-shrink: 0;
}

.room-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.room-avatar {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: rgba(188, 103, 33, 0.15);
    border: 1px solid rgba(188, 103, 33, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 900;
    color: var(--primary-color);
    flex-shrink: 0;
    overflow: hidden;
}

.room-avatar img { width: 100%; height: 100%; object-fit: cover; }

.room-header-name {
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.room-header-desc { font-size: 11px; opacity: 0.4; margin-top: 1px; }

.vis-pill {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    gap: 5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.vis-pill.public {
    background: rgba(80, 200, 120, 0.1);
    border: 1px solid rgba(80, 200, 120, 0.3);
    color: #7effa0;
}

.vis-pill.private {
    background: rgba(255, 200, 50, 0.1);
    border: 1px solid rgba(255, 200, 50, 0.3);
    color: #ffd966;
}

/* ── Join gate ── */
.join-gate {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
}

.join-card {
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.2);
    border-radius: 16px;
    padding: 36px 40px;
    text-align: center;
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.join-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(188, 103, 33, 0.12);
    border: 1px solid rgba(188, 103, 33, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: var(--primary-color);
}

.join-card h3 {
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
}

.join-card h3 span { color: var(--primary-color); }
.join-card p { font-size: 13px; opacity: 0.55; }

.field { display: flex; flex-direction: column; gap: 7px; }

label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.6;
}

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.input-icon {
    position: absolute;
    left: 12px;
    font-size: 11px;
    color: var(--primary-color);
    opacity: 0.7;
    pointer-events: none;
}

.input-wrap input {
    width: 100%;
    padding: 10px 12px 10px 34px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
}

.input-wrap input:focus { border-color: var(--primary-color); }
.input-wrap input::placeholder { opacity: 0.3; }

.btn-primary {
    padding: 11px 28px;
    border-radius: 9px;
    background: var(--primary-color);
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) { background: var(--hover-color); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.error-box {
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(255, 107, 107, 0.08);
    border: 1px solid rgba(255, 107, 107, 0.25);
    color: #ff6b6b;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    text-align: left;
}

/* ── Messages area ── */
.messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(188, 103, 33, 0.2) transparent;
}

.messages-loading,
.messages-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex: 1;
    opacity: 0.4;
    font-size: 13px;
    padding: 40px;
}

.messages-empty i { font-size: 28px; color: var(--primary-color); }

/* ── Date separator ── */
.date-sep {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0 8px;
}

.sep-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
}

.date-sep span {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.35;
    white-space: nowrap;
}

/* ── Message ── */
.message-wrap {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin-bottom: 4px;
}

.message-wrap.mine {
    flex-direction: row-reverse;
}

.msg-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(188, 103, 33, 0.15);
    border: 1px solid rgba(188, 103, 33, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    color: var(--primary-color);
    flex-shrink: 0;
    overflow: hidden;
}

.msg-avatar img { width: 100%; height: 100%; object-fit: cover; }

.msg-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-width: 65%;
}

.mine .msg-body { align-items: flex-end; }

.msg-sender {
    font-size: 10px;
    font-weight: 700;
    color: var(--primary-color);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-left: 4px;
}

/* ── Reply preview ── */
.reply-preview {
    background: rgba(188, 103, 33, 0.08);
    border-left: 2px solid var(--primary-color);
    border-radius: 0 6px 6px 0;
    padding: 4px 10px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-width: 100%;
}

.reply-who {
    font-size: 9px;
    font-weight: 700;
    color: var(--primary-color);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.reply-text {
    font-size: 11px;
    opacity: 0.55;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
}

/* ── Bubble ── */
.msg-bubble {
    padding: 10px 14px;
    border-radius: 14px 14px 14px 4px;
    background: var(--bg-color);
    border: 1px solid rgba(255, 255, 255, 0.07);
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-color);
    word-break: break-word;
    position: relative;
}

.bubble-mine {
    border-radius: 14px 14px 4px 14px;
    background: rgba(188, 103, 33, 0.18);
    border-color: rgba(188, 103, 33, 0.3);
}

.bubble-deleted {
    opacity: 0.4;
    font-style: italic;
}

.deleted-text {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
}

.edited-tag {
    font-size: 9px;
    opacity: 0.35;
    margin-left: 6px;
    font-style: italic;
}

/* ── Meta + actions ── */
.msg-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 2px;
}

.meta-mine { flex-direction: row-reverse; }

.msg-time {
    font-size: 10px;
    opacity: 0.3;
}

.msg-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
}

.message-wrap:hover .msg-actions { opacity: 1; }

.action-btn {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 9px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
}

.action-btn:hover { background: rgba(188, 103, 33, 0.15); color: var(--primary-color); }
.action-btn.danger:hover { background: rgba(255, 107, 107, 0.12); color: #ff6b6b; }

/* ── Reply bar ── */
.reply-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: rgba(188, 103, 33, 0.07);
    border-top: 1px solid rgba(188, 103, 33, 0.2);
    flex-shrink: 0;
}

.reply-bar-inner {
    display: flex;
    align-items: center;
    gap: 10px;
}

.reply-icon { color: var(--primary-color); font-size: 12px; }

.reply-bar-who {
    font-size: 10px;
    font-weight: 700;
    color: var(--primary-color);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.reply-bar-preview {
    font-size: 11px;
    opacity: 0.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
}

.reply-clear {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: var(--text-color);
    cursor: pointer;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.reply-clear:hover { opacity: 1; }

/* ── Input area ── */
.input-area {
    padding: 14px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: var(--bg-color);
    font-family: inherit;
    flex-shrink: 0;
}

.input-area .input-wrap {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 10px 12px;
    transition: border-color 0.2s;
}

.input-area .input-wrap:focus-within {
    border-color: rgba(188, 103, 33, 0.4);
}

.message-input {
    flex: 1;
    padding: 8px;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-family: inherit;
    color: var(--text-color);
}

.message-input::placeholder { opacity: 0.3; }

.send-btn {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--primary-color);
    border: none;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.15s;
}

.send-btn:hover:not(:disabled) {
    background: var(--hover-color);
    transform: scale(1.05);
}

.send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
</style>