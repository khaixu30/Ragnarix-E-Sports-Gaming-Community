<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const props  = defineProps({ id: String });
const router = useRouter();

const BASE = import.meta.env.VITE_HOST;

const activeTab     = ref('overview');
const council       = ref(null);
const members       = ref([]);
const events        = ref([]);
const participants  = ref([]);
const selectedEvent = ref(null);
const loading       = ref(true);
const actionLoading = ref(false);

const showEditModal = ref(false);
const showAddMember = ref(false);
const editForm  = ref({ name: '', description: '', logo_url: '' });
const memberForm = ref({ user_id: '', role: 'Moderator' });

const authHeaders = () => ({
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const stats = computed(() => ({
    total:   events.value.length,
    live:    events.value.filter(e => e.status === 'Live').length,
    members: members.value.length,
}));

const statusClass = (s) => ({ Upcoming: 'badge-upcoming', Live: 'badge-live', Completed: 'badge-completed', Cancelled: 'badge-cancelled' }[s] || '');
const nextStatus  = (s) => ({ Upcoming: 'Live', Live: 'Completed' }[s]);

// ── Load ──────────────────────────────────────
// Change /api/event?council_id=... to /api/events?council_id=...
onMounted(async () => {
    try {
        const [c, m, e] = await Promise.all([
            fetch(`${BASE}/api/council/info/${props.id}`).then(r => r.json()),
            fetch(`${BASE}/api/council/${props.id}/members`, { headers: authHeaders() }).then(r => r.json()),
            fetch(`${BASE}/api/events?council_id=${props.id}`, { headers: authHeaders() }).then(r => r.json()), // FIXED HERE
        ]);
        if (c.success) {
            council.value = c.data;
            editForm.value = { name: c.data.name, description: c.data.description || '', logo_url: c.data.logo_url || '' };
        }
        if (m.success) members.value = m.data;
        if (e.success) events.value = e.events;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
});

// ── Council ───────────────────────────────────
const saveCouncilEdit = async () => {
    actionLoading.value = true;
    try {
        const res  = await fetch(`${BASE}/api/council/patch/${props.id}`, {
            method:  'PATCH',
            headers: authHeaders(),
            body:    JSON.stringify(editForm.value),
        });
        const json = await res.json();
        if (json.success) { council.value = json.data; showEditModal.value = false; }
    } finally {
        actionLoading.value = false;
    }
};

const deleteCouncil = async () => {
    if (!confirm(`Delete "${council.value.name}"? This cannot be undone.`)) return;
    await fetch(`${BASE}/api/councils/${props.id}`, { method: 'DELETE', headers: authHeaders() });
    router.push('/councils');
};

// ── Events ────────────────────────────────────
const advanceStatus = async (event) => {
    const next = nextStatus(event.status);
    if (!next || !confirm(`Move "${event.title}" to ${next}?`)) return;
    
    // Change /api/event/ to /api/events/
    const res  = await fetch(`${BASE}/api/events/${event.id}/status`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify({ status: next }),
    });
    const json = await res.json();
    if (json.success) {
        const idx = events.value.findIndex(e => e.id === event.id);
        if (idx !== -1) events.value[idx] = json.event;
    }
};

const deleteEvent = async (event) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    // Change /api/event/ to /api/events/
    await fetch(`${BASE}/api/events/${event.id}`, { method: 'DELETE', headers: authHeaders() });
    events.value = events.value.filter(e => e.id !== event.id);
};

const loadParticipants = async (event) => {
    selectedEvent.value = event;
    activeTab.value = 'registrations';
    // Change /api/event/ to /api/events/
    const res  = await fetch(`${BASE}/api/events/${event.id}/participants`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) participants.value = json.participants;
};


// ── Members ───────────────────────────────────
const addMember = async () => {
    if (!memberForm.value.user_id.trim()) return;
    actionLoading.value = true;
    try {
        const res  = await fetch(`${BASE}/api/council/${props.id}/members`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify(memberForm.value),
        });
        const json = await res.json();
        if (json.success) {
            // Refresh the members list
            const m = await fetch(`${BASE}/api/council/${props.id}/members`, { headers: authHeaders() }).then(r => r.json());
            if (m.success) members.value = m.data;
            showAddMember.value = false;
            memberForm.value = { user_id: '', role: 'Moderator' };
        }
    } finally {
        actionLoading.value = false;
    }
};

const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await fetch(`${BASE}/api/council/${props.id}/members/${userId}`, { method: 'DELETE', headers: authHeaders() });
    members.value = members.value.filter(m => m.id !== userId);
};

// // ── Registrations ─────────────────────────────
// const loadParticipants = async (event) => {
//     selectedEvent.value = event;
//     activeTab.value = 'registrations';
//     const res  = await fetch(`${BASE}/api/events/${event.id}/participants`, { headers: authHeaders() });
//     const json = await res.json();
//     if (json.success) participants.value = json.participants;
// };

const saveScore = async (reg) => {
    await fetch(`${BASE}/api/events/${selectedEvent.value.id}/participants/${reg.registration_id}`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify({ score: reg.score, rank: reg.rank }),
    });
};


</script>

<template>
    <div class="page">
        <div v-if="loading" class="loading-state"><span class="spinner"></span></div>

        <template v-else-if="council">
            <!-- Header -->
            <div class="dash-header">
                <div class="council-logo">
                    <img v-if="council.logo_url" :src="council.logo_url" :alt="council.name" />
                    <span v-else>{{ council.name[0].toUpperCase() }}</span>
                </div>
                <div class="header-info">
                    <div class="header-top">
                        <h1 class="council-name">{{ council.name }}</h1>
                        <span class="owner-badge"><i class="fa-solid fa-crown"></i> Owner</span>
                    </div>
                    <p class="council-desc">{{ council.description || 'No description.' }}</p>
                </div>
                <div class="header-actions">
                    <button class="icon-btn" @click="showEditModal = true" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn danger" @click="deleteCouncil" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
                <button v-for="t in ['overview','events','members','registrations']" :key="t"
                    class="tab" :class="{ active: activeTab === t }" @click="activeTab = t"
                >{{ t.charAt(0).toUpperCase() + t.slice(1) }}</button>
            </div>

            <!-- OVERVIEW -->
            <div v-if="activeTab === 'overview'" class="tab-body">
                <div class="stats-row">
                    <div class="stat"><span class="stat-n">{{ stats.total }}</span><span class="stat-l">Total Events</span></div>
                    <div class="stat"><span class="stat-n live">{{ stats.live }}</span><span class="stat-l">Live Now</span></div>
                    <div class="stat"><span class="stat-n">{{ stats.members }}</span><span class="stat-l">Members</span></div>
                </div>
                <div class="overview-grid">
                    <div class="panel">
                        <p class="panel-label">Recent Events</p>
                        <div v-for="event in events.slice(0,4)" :key="event.id" class="mini-row">
                            <span class="mini-title">{{ event.title }}</span>
                            <span class="badge" :class="statusClass(event.status)">{{ event.status }}</span>
                        </div>
                        <p v-if="!events.length" class="empty-text">No events yet</p>
                    </div>
                    <div class="panel">
                        <p class="panel-label">Team</p>
                        <div v-for="m in members.slice(0,5)" :key="m.id" class="mini-row">
                            <div class="mini-avatar">{{ m.username[0].toUpperCase() }}</div>
                            <span class="mini-title">{{ m.username }}</span>
                            <span class="mini-role">{{ m.role }}</span>
                        </div>
                        <p v-if="!members.length" class="empty-text">No members yet</p>
                    </div>
                </div>
            </div>

            <!-- EVENTS -->
            <div v-if="activeTab === 'events'" class="tab-body">
                <div class="tab-toolbar">
                    <span class="count-label">{{ events.length }} events</span>
                    <a :href="`/councils/${id}/dashboard/events/create`" class="btn-primary">
                        <i class="fa-solid fa-plus"></i> New Event
                    </a>
                </div>
                <div class="panel p0">
                    <table class="data-table">
                        <thead><tr>
                            <th>Event</th><th>Type</th><th>Status</th><th class="right">Actions</th>
                        </tr></thead>
                        <tbody>
                            <tr v-if="!events.length"><td colspan="4" class="empty-cell">No events yet.</td></tr>
                            <tr v-for="event in events" :key="event.id">
                                <td>
                                    <div class="cell-title">{{ event.title }}</div>
                                    <div class="cell-sub">{{ new Date(event.start_time).toLocaleDateString() }}</div>
                                </td>
                                <td><span class="tag">{{ event.event_type }}</span></td>
                                <td><span class="badge" :class="statusClass(event.status)">{{ event.status }}</span></td>
                                <td class="right">
                                    <div class="action-btns">
                                        <button v-if="nextStatus(event.status)" class="action-btn advance"
                                            :title="`Move to ${nextStatus(event.status)}`"
                                            @click="advanceStatus(event)"><i class="fa-solid fa-circle-play"></i></button>
                                        <button class="action-btn" title="Registrations" @click="loadParticipants(event)">
                                            <i class="fa-solid fa-users"></i></button>
                                        <a v-if="event.status === 'Upcoming'"
                                            :href="`/councils/${id}/dashboard/events/${event.id}/edit`"
                                            class="action-btn" title="Edit"><i class="fa-solid fa-pen"></i></a>
                                        <button class="action-btn danger" @click="deleteEvent(event)">
                                            <i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- MEMBERS -->
            <div v-if="activeTab === 'members'" class="tab-body">
                <div class="tab-toolbar">
                    <span class="count-label">{{ members.length }} members</span>
                    <button class="btn-primary" @click="showAddMember = true">
                        <i class="fa-solid fa-user-plus"></i> Add Member
                    </button>
                </div>
                <div class="panel p0">
                    <table class="data-table">
                        <thead><tr><th>User</th><th>Role</th><th>Joined</th><th class="right">Remove</th></tr></thead>
                        <tbody>
                            <tr v-if="!members.length"><td colspan="4" class="empty-cell">No members yet.</td></tr>
                            <tr v-for="member in members" :key="member.id">
                                <td>
                                    <div class="user-cell">
                                        <div class="mini-avatar">{{ member.username[0].toUpperCase() }}</div>
                                        <div>
                                            <div class="cell-title">{{ member.username }}</div>
                                            <div class="cell-sub">{{ member.email }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="tag">{{ member.role }}</span></td>
                                <td class="cell-sub">{{ new Date(member.joined_at).toLocaleDateString() }}</td>
                                <td class="right">
                                    <button class="action-btn danger" @click="removeMember(member.id)">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- REGISTRATIONS -->
            <div v-if="activeTab === 'registrations'" class="tab-body">
                <div class="tab-toolbar">
                    <span class="count-label">{{ selectedEvent ? selectedEvent.title : 'Select an event from Events tab' }}</span>
                    <button v-if="selectedEvent" class="btn-ghost" @click="activeTab = 'events'">← Back to Events</button>
                </div>
                <div v-if="!selectedEvent" class="empty-hint">
                    <i class="fa-solid fa-arrow-up-long"></i>
                    <p>Go to Events tab and click the <i class="fa-solid fa-users"></i> icon.</p>
                </div>
                <div v-else class="panel p0">
                    <table class="data-table">
                        <thead><tr><th>Participant</th><th>Type</th><th>Score</th><th>Rank</th><th class="right">Save</th></tr></thead>
                        <tbody>
                            <tr v-if="!participants.length"><td colspan="5" class="empty-cell">No registrations yet.</td></tr>
                            <tr v-for="reg in participants" :key="reg.registration_id">
                                <td><span class="cell-title">{{ reg.participant_id }}</span></td>
                                <td><span class="tag">{{ reg.participant_type }}</span></td>
                                <td><input type="number" v-model="reg.score" class="score-input" placeholder="—" /></td>
                                <td><input type="number" v-model="reg.rank"  class="rank-input"  placeholder="—" /></td>
                                <td class="right">
                                    <button class="action-btn advance" @click="saveScore(reg)">
                                        <i class="fa-solid fa-check"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <!-- Edit Modal -->
        <div v-if="showEditModal" class="modal-backdrop" @click.self="showEditModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit Council</h2>
                    <button class="modal-close" @click="showEditModal = false"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <div class="field"><label>Name</label><input v-model="editForm.name" type="text" /></div>
                    <div class="field"><label>Description</label><textarea v-model="editForm.description" rows="3"></textarea></div>
                    <div class="field"><label>Logo URL</label><input v-model="editForm.logo_url" type="url" /></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-ghost" @click="showEditModal = false">Cancel</button>
                    <button class="btn-primary" :disabled="actionLoading" @click="saveCouncilEdit">
                        <span v-if="actionLoading" class="spinner-sm"></span>
                        {{ actionLoading ? 'Saving…' : 'Save Changes' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Add Member Modal -->
        <div v-if="showAddMember" class="modal-backdrop" @click.self="showAddMember = false">
            <div class="modal">
                <div class="modal-header">
                    <h2>Add Member</h2>
                    <button class="modal-close" @click="showAddMember = false"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <div class="field"><label>User ID</label><input v-model="memberForm.user_id" type="text" placeholder="Paste user UUID" /></div>
                    <div class="field">
                        <label>Role</label>
                        <select v-model="memberForm.role">
                            <option>Tournament Director</option>
                            <option>Moderator</option>
                            <option>Manager</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-ghost" @click="showAddMember = false">Cancel</button>
                    <button class="btn-primary" :disabled="actionLoading" @click="addMember">
                        <span v-if="actionLoading" class="spinner-sm"></span>
                        {{ actionLoading ? 'Adding…' : 'Add Member' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page { padding: 32px; max-width: 100%; }
.dash-header {
    display: flex; align-items: flex-start; gap: 16px; padding: 20px 22px; border-radius: 14px;
    margin-bottom: 24px; border: 1px solid rgba(188,103,33,0.15); background: rgba(188,103,33,0.03);
}
.council-logo {
    width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0; background: rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900;
    color: var(--primary-color); overflow: hidden;
}
.council-logo img { width: 100%; height: 100%; object-fit: cover; }
.header-info { flex: 1; }
.header-top { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.council-name { font-size: 20px; font-weight: 800; color: var(--text-color); }
.owner-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: rgba(188,103,33,0.15); color: var(--primary-color); }
.council-desc { font-size: 13px; color: var(--text-color); opacity: 0.45; }
.header-actions { display: flex; gap: 8px; }
.tabs { display: flex; gap: 2px; border-bottom: 1px solid rgba(188,103,33,0.12); margin-bottom: 22px; }
.tab {
    padding: 9px 18px; font-size: 13px; font-weight: 600; background: none; border: none;
    border-bottom: 2px solid transparent; color: var(--text-color); opacity: 0.45;
    cursor: pointer; transition: all 0.15s; margin-bottom: -1px;
}
.tab.active { opacity: 1; border-bottom-color: var(--primary-color); color: var(--primary-color); }
.tab:hover { opacity: 0.8; }
.tab-body { display: flex; flex-direction: column; gap: 16px; }
.tab-toolbar { display: flex; align-items: center; justify-content: space-between; }
.count-label { font-size: 13px; color: var(--text-color); opacity: 0.4; }
.stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.stat { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-radius: 10px; background: rgba(188,103,33,0.04); border: 1px solid rgba(188,103,33,0.1); }
.stat-n { font-size: 24px; font-weight: 800; color: var(--text-color); }
.stat-n.live { color: #7effa0; }
.stat-l { font-size: 11px; color: var(--text-color); opacity: 0.4; font-weight: 600; }
.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel { border-radius: 12px; border: 1px solid rgba(188,103,33,0.12); background: rgba(188,103,33,0.02); padding: 16px 18px; }
.panel.p0 { padding: 0; overflow: hidden; }
.panel-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--primary-color); opacity: 0.65; margin-bottom: 12px; }
.mini-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(188,103,33,0.06); }
.mini-row:last-child { border-bottom: none; }
.mini-avatar { width: 26px; height: 26px; border-radius: 6px; flex-shrink: 0; background: rgba(188,103,33,0.15); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: var(--primary-color); }
.mini-title { flex: 1; font-size: 12px; font-weight: 600; color: var(--text-color); }
.mini-role { font-size: 10px; color: var(--text-color); opacity: 0.35; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead tr { background: rgba(188,103,33,0.04); border-bottom: 1px solid rgba(188,103,33,0.1); }
.data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-color); opacity: 0.4; }
.data-table th.right { text-align: right; }
.data-table td { padding: 10px 16px; border-bottom: 1px solid rgba(188,103,33,0.06); vertical-align: middle; }
.data-table td.right { text-align: right; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: rgba(188,103,33,0.03); }
.cell-title { font-size: 13px; font-weight: 600; color: var(--text-color); }
.cell-sub { font-size: 11px; color: var(--text-color); opacity: 0.35; margin-top: 1px; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.empty-cell { text-align: center; color: var(--text-color); opacity: 0.3; padding: 30px !important; font-size: 13px; }
.badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
.badge-upcoming { background: rgba(59,109,17,0.15); color: #7effa0; }
.badge-live { background: rgba(188,103,33,0.15); color: var(--primary-color); }
.badge-completed { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); }
.badge-cancelled { background: rgba(255,107,107,0.1); color: #ff6b6b; }
.tag { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px; background: rgba(188,103,33,0.1); color: var(--primary-color); }
.action-btns { display: flex; justify-content: flex-end; gap: 6px; }
.action-btn {
    width: 30px; height: 30px; border-radius: 7px; border: 1px solid rgba(188,103,33,0.15);
    background: none; cursor: pointer; font-size: 12px; color: var(--text-color); opacity: 0.5;
    transition: all 0.15s; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
}
.action-btn:hover { opacity: 1; background: rgba(188,103,33,0.08); }
.action-btn.advance { color: #7effa0; border-color: rgba(126,255,160,0.2); }
.action-btn.advance:hover { background: rgba(126,255,160,0.08); }
.action-btn.danger { color: #ff6b6b; border-color: rgba(255,107,107,0.2); }
.action-btn.danger:hover { background: rgba(255,107,107,0.08); }
.score-input { width: 80px; padding: 5px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background: rgba(188,103,33,0.05); border: 1px solid rgba(188,103,33,0.2); color: var(--text-color); outline: none; }
.rank-input  { width: 56px; padding: 5px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background: rgba(188,103,33,0.05); border: 1px solid rgba(188,103,33,0.2); color: var(--text-color); outline: none; }
.score-input:focus, .rank-input:focus { border-color: var(--primary-color); }
.empty-hint { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 50px 20px; color: var(--text-color); opacity: 0.3; font-size: 13px; text-align: center; }
.btn-primary {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 700; background: var(--primary-color); color: #fff;
    border: none; cursor: pointer; text-decoration: none; transition: opacity 0.2s;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }
.btn-ghost {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 700; background: none; color: var(--text-color);
    border: 1px solid rgba(188,103,33,0.2); cursor: pointer; opacity: 0.6; transition: opacity 0.2s;
}
.btn-ghost:hover { opacity: 1; }
.icon-btn {
    width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(188,103,33,0.2);
    background: none; cursor: pointer; font-size: 13px; color: var(--text-color);
    opacity: 0.5; transition: all 0.15s; display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover { opacity: 1; background: rgba(188,103,33,0.08); }
.icon-btn.danger { color: #ff6b6b; border-color: rgba(255,107,107,0.2); }
.icon-btn.danger:hover { background: rgba(255,107,107,0.08); }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { width: 460px; border-radius: 14px; background: var(--bg-color); border: 1px solid rgba(188,103,33,0.2); overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(188,103,33,0.1); }
.modal-header h2 { font-size: 15px; font-weight: 800; color: var(--text-color); }
.modal-close { width: 28px; height: 28px; border-radius: 7px; border: none; background: none; cursor: pointer; font-size: 13px; color: var(--text-color); opacity: 0.4; }
.modal-close:hover { opacity: 1; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { padding: 14px 20px; border-top: 1px solid rgba(188,103,33,0.1); display: flex; justify-content: flex-end; gap: 10px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 11px; font-weight: 700; color: var(--text-color); opacity: 0.5; letter-spacing: 0.04em; }
.field input, .field textarea, .field select {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(188,103,33,0.2); border-radius: 8px;
    padding: 9px 12px; font-size: 13px; font-weight: 500; color: var(--text-color); outline: none; resize: vertical;
}
.field input:focus, .field textarea:focus, .field select:focus { border-color: var(--primary-color); }
.loading-state { display: flex; justify-content: center; padding: 80px 0; }
.spinner { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(188,103,33,0.2); border-top-color: var(--primary-color); animation: spin 0.7s linear infinite; }
.spinner-sm { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-text { font-size: 12px; color: var(--text-color); opacity: 0.3; text-align: center; padding: 16px 0; }
</style>