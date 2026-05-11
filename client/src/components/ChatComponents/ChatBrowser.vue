<script setup>
import { ref, onMounted, computed } from 'vue';

const emit = defineEmits(['select-room']);

const rooms = ref([]);
const myRooms = ref([]);
const loading = ref(false);
const activeTab = ref('public'); // 'public' | 'my'
const search = ref('');
const showCreateModal = ref(false);
const createLoading = ref(false);
const createError = ref('');

const createForm = ref({
    room_name: '',
    visibility: 'Public',
    description: '',
    password: ''
});

const token = localStorage.getItem('token');

const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

const filteredRooms = computed(() => {
    const list = activeTab.value === 'public' ? rooms.value : myRooms.value;
    if (!search.value.trim()) return list;
    return list.filter(r =>
        r.room_name.toLowerCase().includes(search.value.toLowerCase())
    );
});

const fetch_public_rooms = async () => {
    loading.value = true;
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/room/public`, {
            headers: authHeaders
        });
        const json = await response.json();
        rooms.value = json.success ? json.data : [];
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const fetch_my_rooms = async () => {
    // my rooms = rooms where I am a member
    // for now we load public rooms and filter — extend when /api/room/mine exists
    myRooms.value = rooms.value;
};

const handleCreate = async () => {
    createError.value = '';
    if (!createForm.value.room_name.trim()) {
        createError.value = 'Room name is required.';
        return;
    }
    createLoading.value = true;
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/room/create`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                room_name: createForm.value.room_name.trim(),
                visibility: createForm.value.visibility,
                description: createForm.value.description.trim(),
                password: createForm.value.visibility === 'Private' ? createForm.value.password : undefined
            })
        });
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        showCreateModal.value = false;
        createForm.value = { room_name: '', visibility: 'Public', description: '', password: '' };
        await fetch_public_rooms();
    } catch (err) {
        createError.value = err.message;
    } finally {
        createLoading.value = false;
    }
};

const selectRoom = (room) => emit('select-room', room);

const getInitial = (name) => name?.charAt(0).toUpperCase() || '?';

onMounted(async () => {
    await fetch_public_rooms();
    await fetch_my_rooms();
});
</script>

<template>
    <div class="browser">

        <!-- Header -->
        <div class="browser-header">
            <p class="browser-title">
                <i class="fa-solid fa-comment-dots"></i> Chats
            </p>
            <button class="create-btn" @click="showCreateModal = true">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>

        <!-- Search -->
        <div class="search-wrap">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
                type="text"
                v-model="search"
                placeholder="Search rooms..."
                class="search-input"
            />
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button
                class="tab"
                :class="{ active: activeTab === 'public' }"
                @click="activeTab = 'public'"
            >
                Public
            </button>
            <button
                class="tab"
                :class="{ active: activeTab === 'my' }"
                @click="activeTab = 'my'"
            >
                My Rooms
            </button>
        </div>

        <!-- Room list -->
        <div class="room-list">
            <div v-if="loading" class="list-state">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>

            <div v-else-if="filteredRooms.length === 0" class="list-state">
                <i class="fa-solid fa-comment-slash"></i>
                <p>No rooms found.</p>
            </div>

            <div
                v-else
                v-for="room in filteredRooms"
                :key="room.id"
                class="room-item"
                @click="selectRoom(room)"
            >
                <div class="room-avatar">
                    <img v-if="room.room_logo_url" :src="room.room_logo_url" :alt="room.room_name" />
                    <span v-else>{{ getInitial(room.room_name) }}</span>
                </div>
                <div class="room-meta">
                    <div class="room-meta-top">
                        <p class="room-name">{{ room.room_name }}</p>
                        <span class="visibility-badge" :class="room.visibility === 'Private' ? 'private' : 'public'">
                            <i :class="room.visibility === 'Private' ? 'fa-solid fa-lock' : 'fa-solid fa-globe'"></i>
                        </span>
                    </div>
                    <p class="room-desc">{{ room.description || 'No description.' }}</p>
                </div>
            </div>
        </div>

        <!-- Create Modal -->
        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
            <div class="modal">
                <div class="modal-header">
                    <p class="modal-title"><i class="fa-solid fa-plus"></i> Create Room</p>
                    <button class="modal-close" @click="showCreateModal = false">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div v-if="createError" class="error-box">
                    <i class="fa-solid fa-triangle-exclamation"></i> {{ createError }}
                </div>

                <form class="modal-form" @submit.prevent="handleCreate">
                    <div class="field">
                        <label>Room Name</label>
                        <div class="input-wrap">
                            <i class="fa-solid fa-hashtag input-icon"></i>
                            <input type="text" v-model="createForm.room_name" placeholder="e.g. CS2 Talk" maxlength="100" />
                        </div>
                    </div>
                    <div class="field">
                        <label>Description <span class="opt">optional</span></label>
                        <textarea
                            v-model="createForm.description"
                            class="modal-textarea"
                            placeholder="What's this room about?"
                            rows="2"
                        ></textarea>
                    </div>
                    <div class="field">
                        <label>Visibility</label>
                        <div class="toggle-row">
                            <button
                                type="button"
                                class="toggle-btn"
                                :class="{ active: createForm.visibility === 'Public' }"
                                @click="createForm.visibility = 'Public'"
                            >
                                <i class="fa-solid fa-globe"></i> Public
                            </button>
                            <button
                                type="button"
                                class="toggle-btn"
                                :class="{ active: createForm.visibility === 'Private' }"
                                @click="createForm.visibility = 'Private'"
                            >
                                <i class="fa-solid fa-lock"></i> Private
                            </button>
                        </div>
                    </div>
                    <div v-if="createForm.visibility === 'Private'" class="field">
                        <label>Password</label>
                        <div class="input-wrap">
                            <i class="fa-solid fa-key input-icon"></i>
                            <input type="password" v-model="createForm.password" placeholder="Room password" />
                        </div>
                    </div>
                    <button type="submit" class="btn-primary" :disabled="createLoading">
                        <span v-if="!createLoading"><i class="fa-solid fa-bolt"></i> Create</span>
                        <span v-else><i class="fa-solid fa-spinner fa-spin"></i> Creating...</span>
                    </button>
                </form>
            </div>
        </div>

    </div>
</template>

<style scoped>
.browser {
    width: 300px;
    flex-shrink: 0;
    height: 100vh;
    background: var(--bg-color);
    border-right: 1px solid rgba(188, 103, 33, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ── Header ── */
.browser-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 18px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.browser-title {
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 8px;
}

.browser-title i { color: var(--primary-color); }

.create-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(188, 103, 33, 0.12);
    border: 1px solid rgba(188, 103, 33, 0.3);
    color: var(--primary-color);
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.create-btn:hover {
    background: var(--primary-color);
    color: #fff;
}

/* ── Search ── */
.search-wrap {
    position: relative;
    padding: 10px 14px;
}

.search-icon {
    position: absolute;
    left: 26px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: var(--primary-color);
    opacity: 0.6;
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: 9px 12px 9px 34px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
}

.search-input:focus { border-color: var(--primary-color); }
.search-input::placeholder { opacity: 0.3; }

/* ── Tabs ── */
.tabs {
    display: flex;
    padding: 0 14px;
    gap: 4px;
    margin-bottom: 8px;
}

.tab {
    flex: 1;
    padding: 7px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-color);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    opacity: 0.45;
    transition: all 0.2s;
}

.tab.active {
    opacity: 1;
    background: rgba(188, 103, 33, 0.1);
    border-color: rgba(188, 103, 33, 0.25);
    color: var(--primary-color);
}

/* ── Room list ── */
.room-list {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 4px 8px;
}

.room-list::-webkit-scrollbar { display: none; }

.list-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px 16px;
    opacity: 0.35;
    font-size: 13px;
}

.list-state i { font-size: 24px; color: var(--primary-color); }

.room-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
    border: 1px solid transparent;
}

.room-item:hover {
    background: rgba(188, 103, 33, 0.07);
    border-color: rgba(188, 103, 33, 0.15);
}

.room-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(188, 103, 33, 0.15);
    border: 1px solid rgba(188, 103, 33, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 900;
    color: var(--primary-color);
    flex-shrink: 0;
    overflow: hidden;
}

.room-avatar img { width: 100%; height: 100%; object-fit: cover; }

.room-meta { flex: 1; min-width: 0; }

.room-meta-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
}

.room-name {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.visibility-badge { font-size: 10px; opacity: 0.4; }
.visibility-badge.private { color: #ffd966; opacity: 0.7; }
.visibility-badge.public { color: #7effa0; opacity: 0.7; }

.room-desc {
    font-size: 11px;
    opacity: 0.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── Modal ── */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
}

.modal {
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.25);
    border-radius: 14px;
    padding: 24px;
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-title {
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 8px;
}

.modal-close {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: var(--text-color);
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.modal-close:hover { opacity: 1; }

.modal-form { display: flex; flex-direction: column; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 6px; }

label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.6;
    display: flex;
    align-items: center;
    gap: 6px;
}

.opt { font-size: 9px; opacity: 0.4; font-weight: 400; }

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
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
    font-family: inherit;
    transition: border-color 0.2s;
}

.input-wrap input:focus { border-color: var(--primary-color); }
.input-wrap input::placeholder { opacity: 0.3; }

.modal-textarea {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    resize: none;
    font-family: inherit;
    transition: border-color 0.2s;
}

.modal-textarea:focus { border-color: var(--primary-color); }
.modal-textarea::placeholder { opacity: 0.3; }

.toggle-row { display: flex; gap: 8px; }

.toggle-btn {
    flex: 1;
    padding: 9px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: var(--text-color);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    opacity: 0.5;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: all 0.2s;
}

.toggle-btn.active {
    opacity: 1;
    background: rgba(188, 103, 33, 0.12);
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.btn-primary {
    padding: 11px;
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
    justify-content: center;
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
}
</style>