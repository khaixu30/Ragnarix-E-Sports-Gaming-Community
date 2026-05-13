<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const HOST = import.meta.env.VITE_HOST;

const registrations = ref([]);
const loading = ref(true);
const error = ref('');
const cancellingId = ref(null);
const filterStatus = ref('all');

const statusOptions = [
    { value: 'all',       label: 'All' },
    { value: 'upcoming',  label: 'Upcoming' },
    { value: 'live',      label: 'Live' },
    { value: 'completed', label: 'Completed' },
];

const filtered = computed(() => {
    if (filterStatus.value === 'all') return registrations.value;
    return registrations.value.filter(r =>
        r.status?.toLowerCase() === filterStatus.value
    );
});

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const fetchRegistrations = async () => {
    loading.value = true;
    error.value = '';
    try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const res = await fetch(`${HOST}/api/register/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        registrations.value = json.data || [];
    } catch (err) {
        error.value = err.message || 'Failed to load registrations.';
    } finally {
        loading.value = false;
    }
};

const cancelRegistration = async (event_id, title) => {
    if (!confirm(`Cancel registration for "${title}"?`)) return;
    cancellingId.value = event_id;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${HOST}/api/register/${event_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        registrations.value = registrations.value.filter(r => r.event_id !== event_id);
    } catch (err) {
        alert(err.message);
    } finally {
        cancellingId.value = null;
    }
};

const statusClass = (status) => {
    const s = status?.toLowerCase();
    if (s === 'upcoming') return 'badge-upcoming';
    if (s === 'live')     return 'badge-live';
    if (s === 'completed') return 'badge-completed';
    return 'badge-default';
};

onMounted(fetchRegistrations);
</script>

<template>
    <div class="reg-page">

        <!-- Header -->
        <div class="page-header">
            <div>
                <p class="page-label"><i class="fa-solid fa-file-signature"></i> Dashboard</p>
                <h1>My <span>Registrations</span></h1>
                <p class="page-sub">All events you've signed up for.</p>
            </div>
            <router-link to="/events" class="btn-primary">
                <i class="fa-solid fa-plus"></i> Register for Event
            </router-link>
        </div>

        <!-- Filter pills -->
        <div class="filter-bar">
            <button
                v-for="opt in statusOptions"
                :key="opt.value"
                class="filter-pill"
                :class="{ active: filterStatus === opt.value }"
                @click="filterStatus = opt.value"
            >
                {{ opt.label }}
                <span v-if="opt.value !== 'all'" class="pill-count">
                    {{ registrations.filter(r => opt.value === 'all' || r.status?.toLowerCase() === opt.value).length }}
                </span>
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-center">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading...
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-center error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
        </div>

        <!-- Empty -->
        <div v-else-if="filtered.length === 0" class="empty-state">
            <i class="fa-solid fa-file-circle-xmark"></i>
            <p>No registrations found.</p>
            <router-link to="/events" class="btn-primary sm">Browse Events</router-link>
        </div>

        <!-- Table -->
        <div v-else class="table-wrap">
            <table class="reg-table">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Type</th>
                        <th>Entry Fee</th>
                        <th>Prize Pool</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="reg in filtered" :key="reg.event_id">
                        <td class="event-cell">
                            <div class="event-name-wrap">
                                <router-link :to="`/events/${reg.event_id}`" class="event-name">
                                    {{ reg.title }}
                                </router-link>
                                <span class="event-game" v-if="reg.game_name">{{ reg.game_name }}</span>
                            </div>
                        </td>
                        <td>
                            <span class="badge badge-type">{{ reg.event_type || 'Solo' }}</span>
                        </td>
                        <td>
                            <span v-if="!reg.registration_fee || reg.registration_fee == 0" class="free">Free</span>
                            <span v-else>${{ reg.registration_fee }}</span>
                        </td>
                        <td class="prize">
                            {{ reg.prize_pool > 0 ? `$${reg.prize_pool}` : '—' }}
                        </td>
                        <td class="date-cell">{{ formatDate(reg.start_time) }}</td>
                        <td>
                            <span class="badge" :class="statusClass(reg.status)">
                                {{ reg.status || 'Unknown' }}
                            </span>
                        </td>
                        <td>
                            <button
                                v-if="reg.status?.toLowerCase() === 'upcoming'"
                                class="cancel-btn"
                                @click="cancelRegistration(reg.event_id, reg.title)"
                                :disabled="cancellingId === reg.event_id"
                            >
                                <i v-if="cancellingId !== reg.event_id" class="fa-solid fa-xmark"></i>
                                <i v-else class="fa-solid fa-spinner fa-spin"></i>
                                Cancel
                            </button>
                            <span v-else class="na">—</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Summary footer -->
        <div class="summary-bar" v-if="registrations.length > 0">
            <span>{{ registrations.length }} total registrations</span>
            <span class="sep">·</span>
            <span>{{ registrations.filter(r => r.status?.toLowerCase() === 'upcoming').length }} upcoming</span>
            <span class="sep">·</span>
            <span>{{ registrations.filter(r => r.status?.toLowerCase() === 'completed').length }} completed</span>
        </div>

    </div>
</template>

<style scoped>
.reg-page {
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
    margin-bottom: 28px;
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
    line-height: 1.1;
}
.page-header h1 span { color: var(--primary-color, #bc6721); }
.page-sub { font-size: 12px; opacity: 0.4; margin: 0; }

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
    flex-shrink: 0;
}
.btn-primary:hover { background: var(--hover-color, #d97f34); }
.btn-primary.sm { padding: 8px 16px; font-size: 11px; }

/* ── Filter bar ── */
.filter-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

.filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent;
    color: rgba(240,236,230,0.5);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.filter-pill:hover {
    border-color: rgba(188,103,33,0.4);
    color: var(--text-color, #f0ece6);
}
.filter-pill.active {
    background: rgba(188,103,33,0.15);
    border-color: rgba(188,103,33,0.4);
    color: var(--primary-color, #bc6721);
}

.pill-count {
    background: rgba(188,103,33,0.2);
    color: var(--primary-color, #bc6721);
    font-size: 9px;
    font-weight: 900;
    padding: 1px 7px;
    border-radius: 10px;
}

/* ── States ── */
.state-center {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    gap: 10px;
    opacity: 0.4;
    font-size: 14px;
}
.state-center.error { color: #ff6b6b; opacity: 1; }

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    gap: 14px;
    text-align: center;
}
.empty-state i { font-size: 44px; opacity: 0.12; }
.empty-state p { font-size: 14px; opacity: 0.4; }

/* ── Table ── */
.table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(188,103,33,0.15); }

.reg-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.reg-table th {
    padding: 12px 18px;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(240,236,230,0.4);
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    white-space: nowrap;
}

.reg-table td {
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    vertical-align: middle;
    color: var(--text-color, #f0ece6);
}

.reg-table tr:last-child td { border-bottom: none; }
.reg-table tbody tr:hover td { background: rgba(255,255,255,0.02); }

.event-name-wrap { display: flex; flex-direction: column; gap: 3px; }

.event-name {
    font-weight: 700;
    color: var(--text-color, #f0ece6);
    text-decoration: none;
    transition: color 0.15s;
}
.event-name:hover { color: var(--primary-color, #bc6721); }

.event-game { font-size: 10px; opacity: 0.4; }

.date-cell { white-space: nowrap; opacity: 0.65; }

.prize { color: var(--primary-color, #bc6721); font-weight: 700; }

.free { color: #6fcf97; font-weight: 700; }

/* ── Badges ── */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
}
.badge-type     { background: rgba(188,103,33,0.15); color: var(--primary-color, #bc6721); }
.badge-upcoming { background: rgba(100,181,246,0.12); color: #64b5f6; }
.badge-live     { background: rgba(111,207,151,0.12); color: #6fcf97; }
.badge-completed { background: rgba(255,255,255,0.06); color: rgba(240,236,230,0.5); }
.badge-default  { background: rgba(255,255,255,0.06); color: rgba(240,236,230,0.4); }

/* ── Cancel button ── */
.cancel-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 7px;
    border: 1px solid rgba(255,107,107,0.2);
    background: rgba(255,107,107,0.06);
    color: rgba(255,107,107,0.7);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    white-space: nowrap;
}
.cancel-btn:hover:not(:disabled) {
    background: rgba(255,107,107,0.14);
    color: #ff6b6b;
}
.cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.na { font-size: 12px; opacity: 0.25; }

/* ── Summary bar ── */
.summary-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 0 0;
    font-size: 12px;
    opacity: 0.4;
}
.sep { opacity: 0.3; }

/* ── Responsive ── */
@media (max-width: 768px) {
    .reg-page { padding: 24px 16px 40px; }
    .page-header { flex-direction: column; }
}
</style>