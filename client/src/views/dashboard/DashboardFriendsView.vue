<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const HOST   = import.meta.env.VITE_HOST;

const activeTab     = ref('friends');
const user          = ref(null);
const friends       = ref([]);
const requests      = ref([]);
const sent          = ref([]);
const searchResults = ref([]);
const loading       = ref(true);
const searchQuery   = ref('');
const searchLoading = ref(false);
const searchDone    = ref(false);
const actionLoading = ref({});

const tabMsg = ref({ text: '', type: '' });
const clearMsg = () => { tabMsg.value = { text: '', type: '' }; };

const tabs = [
    { id: 'friends',  icon: 'fa-user-group',       label: 'Friends'      },
    { id: 'requests', icon: 'fa-user-clock',        label: 'Requests'     },
    { id: 'sent',     icon: 'fa-paper-plane',       label: 'Sent'         },
    { id: 'search',   icon: 'fa-magnifying-glass',  label: 'Find Players' },
];

const token = localStorage.getItem('token');
const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

const getInitials = (name) =>
    name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

watch(activeTab, () => {
    clearMsg();
    if (activeTab.value !== 'search') {
        searchQuery.value = '';
        searchResults.value = [];
        searchDone.value = false;
    }
});

// ── Fetch accepted friends (with joined user info) ───────
const fetchAccepted = async () => {
    try {
        const res  = await fetch(`${HOST}/api/friend/all/accepted`, { headers: authHeaders });
        const json = await res.json();
        if (json.success) {
            // The /all/accepted route returns raw friend rows (requester_id, receiver_id).
            // We need user info too, so we enrich each row using the current user's id.
            // If your backend already JOINs user data here, just use json.data directly.
            friends.value = json.data;
            console.log(friends.value)
        } else {
            friends.value = [];
        }
    } catch (err) {
        console.error('fetchAccepted:', err);
        friends.value = [];
    }
};

// ── Fetch incoming pending requests (receivers = current user) ──
const fetchPending = async () => {
    try {
        const res  = await fetch(`${HOST}/api/friend/all/pending`, { headers: authHeaders });
        const json = await res.json();
        if (json.success) {
            // Filter to only rows where current user is the receiver
            // (the /all/pending route returns both sent and received pending rows)
            requests.value = json.success
                ? json.data.filter(r => r.receiver_id === user.value?.id)
                : [];
        } else {
            requests.value = [];
        }
    } catch (err) {
        console.error('fetchPending:', err);
        requests.value = [];
    }
};

// ── Fetch sent requests (uses the dedicated /all/sent route) ──
const fetchSent = async () => {
    try {
        const res  = await fetch(`${HOST}/api/friend/all/sent`, { headers: authHeaders });
        const json = await res.json();
        sent.value = json.success ? json.data : [];
    } catch (err) {
        console.error('fetchSent:', err);
        sent.value = [];
    }
};

// ── Fetch current user profile ───────────────────────────
const fetchUser = async () => {
    try {
        const res  = await fetch(`${HOST}/api/auth/me`, { headers: authHeaders });
        const json = await res.json();
        if (json.success) user.value = json.data;
    } catch (err) {
        console.error('fetchUser:', err);
    }
};

// ── Master fetch — called on mount and after every action ─
const fetchAll = async () => {
    loading.value = true;
    try {
        // Fetch user first so fetchPending can filter by user.value.id
        await fetchUser();
        await Promise.all([fetchAccepted(), fetchPending(), fetchSent()]);
    } finally {
        loading.value = false;
    }
};

// ── Search ───────────────────────────────────────────────
let searchTimer = null;
watch(searchQuery, (val) => {
    clearTimeout(searchTimer);
    searchResults.value = [];
    searchDone.value = false;
    if (!val.trim() || val.trim().length < 2) {
        searchLoading.value = false;
        return;
    }
    searchLoading.value = true;
    searchTimer = setTimeout(() => doSearch(val.trim()), 400);
});

const doSearch = async (q) => {
    try {
        const res  = await fetch(`${HOST}/api/friend/search?q=${encodeURIComponent(q)}`, { headers: authHeaders });
        const json = await res.json();
        searchResults.value = json.success ? json.data : [];
        searchDone.value = true;
    } catch (err) {
        console.error(err);
    } finally {
        searchLoading.value = false;
    }
};

// ── Friendship status helpers ────────────────────────────
const isFriend = (uid) =>
    friends.value.some(f => f.requester_id === uid || f.receiver_id === uid);

const hasSentTo = (uid) =>
    sent.value.some(s => s.receiver_id === uid);

const hasPendingFrom = (uid) =>
    requests.value.some(r => r.requester_id === uid);

// ── Actions ──────────────────────────────────────────────
const setLoading = (uid, val) => {
    actionLoading.value = { ...actionLoading.value, [uid]: val };
};

const showMsg = (text, type = 'success') => {
    tabMsg.value = { text, type };
    setTimeout(clearMsg, 3000);
};

const sendRequest = async (receiver_id) => {
    setLoading(receiver_id, true);
    clearMsg();
    try {
        const res  = await fetch(`${HOST}/api/friend/send/${receiver_id}`, {
            method: 'POST', headers: authHeaders
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        showMsg('Friend request sent!');
        await fetchAll();
    } catch (err) {
        showMsg(err.message, 'error');
    } finally {
        setLoading(receiver_id, false);
    }
};

const acceptRequest = async (sender_id) => {
    setLoading(sender_id, true);
    clearMsg();
    try {
        const res  = await fetch(`${HOST}/api/friend/accept/${sender_id}`, {
            method: 'PATCH', headers: authHeaders
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        showMsg('Friend request accepted!');
        await fetchAll();
    } catch (err) {
        showMsg(err.message, 'error');
    } finally {
        setLoading(sender_id, false);
    }
};

const rejectRequest = async (sender_id) => {
    setLoading(sender_id, true);
    clearMsg();
    try {
        const res  = await fetch(`${HOST}/api/friend/reject/${sender_id}`, {
            method: 'PATCH', headers: authHeaders
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        showMsg('Request declined.', 'error');
        await fetchAll();
    } catch (err) {
        showMsg(err.message, 'error');
    } finally {
        setLoading(sender_id, false);
    }
};

const removeOrCancel = async (row_id, otherUid) => {
    setLoading(otherUid, true);
    clearMsg();
    try {
        const res  = await fetch(`${HOST}/api/friend/${row_id}`, {
            method: 'DELETE', headers: authHeaders
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        showMsg('Removed successfully.');
        await fetchAll();
    } catch (err) {
        showMsg(err.message, 'error');
    } finally {
        setLoading(otherUid, false);
    }
};

const otherUserId = (row) => {
    if (!user.value) return null;
    return row.requester_id === user.value.id ? row.receiver_id : row.requester_id;
};

onMounted(fetchAll);
</script>

<template>
    <div class="friends-page">

        <!-- ── Header ── -->
        <div class="page-header">
            <div class="header-left">
                <p class="page-label">
                    <i class="fa-solid fa-user-group"></i> Dashboard
                </p>
                <h1>Friends</h1>
                <p class="page-sub">Manage your connections on Ragnarix.</p>
            </div>
            <div class="header-stats" v-if="!loading">
                <div class="hstat">
                    <i class="fa-solid fa-user-group"></i>
                    <div>
                        <p class="hstat-val">{{ friends.length }}</p>
                        <p class="hstat-label">Friends</p>
                    </div>
                </div>
                <div class="hstat warning" v-if="requests.length > 0">
                    <i class="fa-solid fa-user-clock"></i>
                    <div>
                        <p class="hstat-val">{{ requests.length }}</p>
                        <p class="hstat-label">Pending</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Global message bar ── -->
        <transition name="slide-down">
            <div v-if="tabMsg.text" :class="`msg-box msg-${tabMsg.type}`" style="margin-bottom:20px;">
                <i :class="tabMsg.type === 'success'
                    ? 'fa-solid fa-circle-check'
                    : 'fa-solid fa-triangle-exclamation'">
                </i>
                {{ tabMsg.text }}
                <button class="msg-close" @click="clearMsg">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </transition>

        <!-- ── Tabs ── -->
        <div class="tabs-bar">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                class="tab"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
            >
                <i :class="`fa-solid ${tab.icon}`"></i>
                {{ tab.label }}
                <span v-if="tab.id === 'requests' && requests.length > 0" class="tab-badge">
                    {{ requests.length }}
                </span>
            </button>
        </div>

        <!-- ── Loading ── -->
        <div v-if="loading" class="state-center">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading...
        </div>

        <template v-else>

            <!-- ── FRIENDS ── -->
            <div v-if="activeTab === 'friends'" class="tab-content">
                <div v-if="friends.length === 0" class="empty-state">
                    <i class="fa-solid fa-user-group"></i>
                    <p>You haven't added any friends yet.</p>
                    <button class="btn-primary sm" @click="activeTab = 'search'">
                        <i class="fa-solid fa-magnifying-glass"></i> Find Players
                    </button>
                </div>

                <div v-else class="user-grid">
                    <div v-for="f in friends" :key="f.id" class="user-card">
                        <div class="uc-avatar">
                            <img v-if="f.profile_pic" :src="f.profile_pic" :alt="f.full_name" />
                            <span v-else>{{ getInitials(f.full_name) }}</span>
                        </div>
                        <div class="uc-body">
                            <p class="uc-name">{{ f.full_name }}</p>
                            <p class="uc-username">@{{ f.username }}</p>
                            <p class="uc-about" v-if="f.about_info">{{ f.about_info }}</p>
                        </div>
                        <div class="uc-actions">
                            <a href="/dashboard/chats" class="act-btn chat" title="Message">
                                <i class="fa-solid fa-comment"></i>
                            </a>
                            <button
                                class="act-btn remove"
                                @click="removeOrCancel(f.id, otherUserId(f))"
                                :disabled="actionLoading[otherUserId(f)]"
                                title="Remove friend"
                            >
                                <i v-if="actionLoading[otherUserId(f)]" class="fa-solid fa-spinner fa-spin"></i>
                                <i v-else class="fa-solid fa-user-minus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── REQUESTS ── -->
            <div v-else-if="activeTab === 'requests'" class="tab-content">
                <div v-if="requests.length === 0" class="empty-state">
                    <i class="fa-solid fa-user-clock"></i>
                    <p>No incoming friend requests.</p>
                </div>

                <div v-else class="request-list">
                    <div v-for="req in requests" :key="req.id" class="request-card">
                        <div class="rc-avatar">
                            <img v-if="req.profile_pic" :src="req.profile_pic" />
                            <span v-else>{{ getInitials(req.full_name) }}</span>
                        </div>
                        <div class="rc-body">
                            <p class="rc-name">{{ req.full_name }}</p>
                            <p class="rc-username">@{{ req.username }}</p>
                            <p class="rc-about" v-if="req.about_info">{{ req.about_info }}</p>
                        </div>
                        <div class="rc-actions">
                            <button
                                class="act-btn accept"
                                @click="acceptRequest(req.requester_id)"
                                :disabled="actionLoading[req.requester_id]"
                            >
                                <i v-if="actionLoading[req.requester_id]" class="fa-solid fa-spinner fa-spin"></i>
                                <i v-else class="fa-solid fa-check"></i>
                                Accept
                            </button>
                            <button
                                class="act-btn decline"
                                @click="rejectRequest(req.requester_id)"
                                :disabled="actionLoading[req.requester_id]"
                                title="Decline"
                            >
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── SENT ── -->
            <div v-else-if="activeTab === 'sent'" class="tab-content">
                <div v-if="sent.length === 0" class="empty-state">
                    <i class="fa-solid fa-paper-plane"></i>
                    <p>No pending sent requests.</p>
                </div>

                <div v-else class="request-list">
                    <div v-for="req in sent" :key="req.id" class="request-card">
                        <div class="rc-avatar">
                            <img v-if="req.profile_pic" :src="req.profile_pic" />
                            <span v-else>{{ getInitials(req.full_name) }}</span>
                        </div>
                        <div class="rc-body">
                            <p class="rc-name">{{ req.full_name }}</p>
                            <p class="rc-username">@{{ req.username }}</p>
                        </div>
                        <div class="rc-actions">
                            <span class="pending-pill">
                                <i class="fa-solid fa-clock"></i> Pending
                            </span>
                            <button
                                class="act-btn decline"
                                @click="removeOrCancel(req.id, req.receiver_id)"
                                :disabled="actionLoading[req.receiver_id]"
                                title="Cancel request"
                            >
                                <i v-if="actionLoading[req.receiver_id]" class="fa-solid fa-spinner fa-spin"></i>
                                <i v-else class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── SEARCH ── -->
            <div v-else-if="activeTab === 'search'" class="tab-content">

                <div class="search-header">
                    <div class="search-bar-big">
                        <i class="fa-solid fa-magnifying-glass sb-icon"></i>
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search by username or name..."
                            class="sb-input"
                        />
                        <span v-if="searchLoading" class="sb-spinner">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                        </span>
                        <button v-if="searchQuery" class="sb-clear" @click="searchQuery = ''">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <p class="search-hint">
                        <i class="fa-solid fa-circle-info"></i>
                        Type at least 2 characters to search all players.
                    </p>
                </div>

                <div v-if="!searchQuery.trim()" class="empty-state">
                    <i class="fa-solid fa-users"></i>
                    <p>Start typing to find players.</p>
                </div>

                <div v-else-if="searchDone && searchResults.length === 0 && !searchLoading" class="empty-state">
                    <i class="fa-solid fa-user-slash"></i>
                    <p>No players found for "{{ searchQuery }}".</p>
                </div>

                <div v-else-if="searchResults.length > 0" class="user-grid">
                    <div v-for="u in searchResults" :key="u.id" class="user-card">
                        <div class="uc-avatar">
                            <img v-if="u.profile_pic" :src="u.profile_pic" :alt="u.full_name" />
                            <span v-else>{{ getInitials(u.full_name) }}</span>
                        </div>
                        <div class="uc-body">
                            <p class="uc-name">{{ u.full_name }}</p>
                            <p class="uc-username">@{{ u.username }}</p>
                            <p class="uc-about" v-if="u.about_info">{{ u.about_info }}</p>
                        </div>
                        <div class="uc-actions">
                            <span v-if="isFriend(u.id)" class="friend-pill">
                                <i class="fa-solid fa-user-check"></i> Friends
                            </span>
                            <button
                                v-else-if="hasPendingFrom(u.id)"
                                class="act-btn accept"
                                @click="acceptRequest(u.id)"
                                :disabled="actionLoading[u.id]"
                            >
                                <i v-if="actionLoading[u.id]" class="fa-solid fa-spinner fa-spin"></i>
                                <i v-else class="fa-solid fa-check"></i>
                                Accept
                            </button>
                            <span v-else-if="hasSentTo(u.id)" class="pending-pill">
                                <i class="fa-solid fa-clock"></i> Sent
                            </span>
                            <button
                                v-else
                                class="act-btn add"
                                @click="sendRequest(u.id)"
                                :disabled="actionLoading[u.id]"
                            >
                                <i v-if="actionLoading[u.id]" class="fa-solid fa-spinner fa-spin"></i>
                                <i v-else class="fa-solid fa-user-plus"></i>
                                Add
                            </button>
                        </div>
                    </div>
                </div>

            </div>

        </template>
    </div>
</template>

<style scoped>
.friends-page {
    width: 100%;
    min-height: 100vh;
    background: var(--bg-color, #1a1714);
    color: var(--text-color, #f0ece6);
    padding: 36px 40px 60px;
}

/* ── Header ── */
.page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.page-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary-color, #bc6721);
    font-weight: 700;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 7px;
}

.page-header h1 {
    font-size: clamp(26px, 4vw, 40px);
    font-weight: 900;
    margin: 0 0 4px;
}

.page-sub { font-size: 12px; opacity: 0.4; margin: 0; }

.header-stats { display: flex; gap: 12px; align-items: center; }

.hstat {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(188,103,33,0.12);
    border-radius: 12px;
}

.hstat i { font-size: 18px; color: var(--primary-color, #bc6721); }
.hstat.warning i { color: #ffd966; }
.hstat.warning { border-color: rgba(255,217,102,0.2); }
.hstat-val { font-size: 20px; font-weight: 900; line-height: 1; }
.hstat-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.4;
    margin-top: 2px;
    font-weight: 600;
}

/* ── Message bar ── */
.msg-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
}

.msg-box .msg-close {
    margin-left: auto;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.5;
    font-size: 12px;
    padding: 2px 4px;
    transition: opacity 0.2s;
}

.msg-box .msg-close:hover { opacity: 1; }

.msg-success {
    background: rgba(111,207,151,0.08);
    color: #6fcf97;
    border: 1px solid rgba(111,207,151,0.2);
}

.msg-error {
    background: rgba(255,107,107,0.08);
    color: #ff6b6b;
    border: 1px solid rgba(255,107,107,0.2);
}

/* ── Tabs ── */
.tabs-bar {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 28px;
    overflow-x: auto;
}

.tabs-bar::-webkit-scrollbar { display: none; }

.tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 18px;
    border: none;
    background: transparent;
    color: rgba(240,236,230,0.4);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
}

.tab i { font-size: 12px; }
.tab:hover { color: var(--text-color, #f0ece6); }
.tab.active {
    color: var(--primary-color, #bc6721);
    border-bottom-color: var(--primary-color, #bc6721);
}

.tab-badge {
    background: var(--primary-color, #bc6721);
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    padding: 1px 6px;
    border-radius: 10px;
    line-height: 1.4;
}

/* ── States ── */
.state-center {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    gap: 10px;
    opacity: 0.4;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    gap: 14px;
    text-align: center;
}

.empty-state i { font-size: 48px; opacity: 0.1; }
.empty-state p { font-size: 14px; opacity: 0.45; max-width: 300px; }

/* ── Search ── */
.search-header {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 560px;
}

.search-bar-big {
    position: relative;
    display: flex;
    align-items: center;
}

.sb-icon {
    position: absolute;
    left: 16px;
    font-size: 14px;
    color: var(--primary-color, #bc6721);
    opacity: 0.7;
    pointer-events: none;
    z-index: 1;
}

.sb-input {
    width: 100%;
    padding: 13px 80px 13px 46px;
    border-radius: 12px;
    border: 1px solid rgba(188,103,33,0.25);
    background: rgba(255,255,255,0.04);
    color: var(--text-color, #f0ece6);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    font-family: inherit;
}

.sb-input:focus {
    border-color: var(--primary-color, #bc6721);
    background: rgba(188,103,33,0.05);
}

.sb-input::placeholder { opacity: 0.3; }

.sb-spinner {
    position: absolute;
    right: 40px;
    font-size: 13px;
    opacity: 0.5;
    color: var(--primary-color, #bc6721);
    pointer-events: none;
}

.sb-clear {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: var(--text-color, #f0ece6);
    opacity: 0.35;
    cursor: pointer;
    font-size: 13px;
    padding: 4px 6px;
    transition: opacity 0.2s;
}

.sb-clear:hover { opacity: 0.8; }

.search-hint {
    font-size: 11px;
    opacity: 0.35;
    display: flex;
    align-items: center;
    gap: 7px;
    padding-left: 4px;
}

.search-hint i { color: var(--primary-color, #bc6721); opacity: 1; }

/* ── User grid ── */
.user-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
}

.user-card {
    display: flex;
    align-items: center;           /* ← was flex-start, misaligned with row actions */
    gap: 14px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(188,103,33,0.12);
    border-radius: 14px;
    transition: border-color 0.2s, background 0.2s;
}

.user-card:hover {
    border-color: rgba(188,103,33,0.28);
    background: rgba(255,255,255,0.035);
}

.uc-avatar {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--primary-color, #bc6721);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 900;
    color: #fff;
    overflow: hidden;
    flex-shrink: 0;
}

.uc-avatar img { width: 100%; height: 100%; object-fit: cover; }

.uc-body {
    flex: 1;
    min-width: 0;
}

.uc-name {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.uc-username { font-size: 11px; opacity: 0.4; margin-top: 2px; }

.uc-about {
    font-size: 11px;
    opacity: 0.38;
    margin-top: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 1;          /* ← was 2, now 1 to fit row height */
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* ── fixed: uc-actions is now a row, not column ── */
.uc-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

/* ── Request list ── */
.request-list { display: flex; flex-direction: column; gap: 10px; }

.request-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(188,103,33,0.12);
    border-radius: 14px;
    transition: border-color 0.2s;
}

.request-card:hover { border-color: rgba(188,103,33,0.25); }

.rc-avatar {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--primary-color, #bc6721);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 900;
    color: #fff;
    overflow: hidden;
    flex-shrink: 0;
}

.rc-avatar img { width: 100%; height: 100%; object-fit: cover; }

.rc-body { flex: 1; min-width: 0; }
.rc-name { font-size: 13px; font-weight: 700; }
.rc-username { font-size: 11px; opacity: 0.4; margin-top: 2px; }

.rc-about {
    font-size: 11px;
    opacity: 0.35;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;       /* ← was missing on request cards */
    max-width: 100%;
}

.rc-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

/* ── Action buttons ── */
.act-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
    white-space: nowrap;
    line-height: 1;
}

.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.act-btn.add {
    background: rgba(188,103,33,0.12);
    color: var(--primary-color, #bc6721);
    border: 1px solid rgba(188,103,33,0.25);
}
.act-btn.add:hover:not(:disabled) { background: rgba(188,103,33,0.22); }

.act-btn.chat { background: rgba(55,138,221,0.1); color: #64b5f6; }
.act-btn.chat:hover:not(:disabled) { background: rgba(55,138,221,0.2); }

.act-btn.accept {
    background: rgba(111,207,151,0.1);
    color: #6fcf97;
    border: 1px solid rgba(111,207,151,0.2);
}
.act-btn.accept:hover:not(:disabled) { background: rgba(111,207,151,0.2); }

.act-btn.decline {
    background: rgba(255,107,107,0.08);
    color: rgba(255,107,107,0.7);
    padding: 7px 10px;
}
.act-btn.decline:hover:not(:disabled) {
    background: rgba(255,107,107,0.16);
    color: #ff6b6b;
}

.act-btn.remove { background: rgba(255,107,107,0.06); color: rgba(255,107,107,0.5); }
.act-btn.remove:hover:not(:disabled) {
    background: rgba(255,107,107,0.14);
    color: #ff6b6b;
}

/* ── Pills ── */
.pending-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: rgba(240,236,230,0.35);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    padding: 5px 12px;
    border-radius: 20px;
    font-weight: 600;
    white-space: nowrap;
}

.friend-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #7effa0;
    background: rgba(80,200,120,0.08);
    border: 1px solid rgba(80,200,120,0.2);
    padding: 5px 12px;
    border-radius: 20px;
    font-weight: 600;
    white-space: nowrap;
}

/* ── Buttons ── */
.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    background: var(--primary-color, #bc6721);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s;
    white-space: nowrap;
}

.btn-primary:hover:not(:disabled) { background: var(--hover-color, #d97f34); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary.sm { padding: 8px 16px; font-size: 11px; }

/* ── Transitions ── */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
    .friends-page { padding: 24px 16px 40px; }
    .page-header { flex-direction: column; }
    .user-grid { grid-template-columns: 1fr; }
    .header-stats { display: none; }
}
</style>