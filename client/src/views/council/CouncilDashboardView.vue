<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router    = useRouter();
const route     = useRoute();
const councilId = route.params.id;

const BASE  = import.meta.env.VITE_HOST;
const token = () => localStorage.getItem('token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token()}`
});

// ── State ──────────────────────────────────────────────────────────────────
const council          = ref(null);
const members          = ref([]);
const events           = ref([]);
const loading          = ref(true);
const error            = ref('');
const activeTab        = ref('overview');
const sidebarCollapsed = ref(false);

// ── Modals ─────────────────────────────────────────────────────────────────
const showAddMember    = ref(false);
const newMember        = ref({ user_id: '', role: 'Moderator' });
const addMemberError   = ref('');
const addMemberLoading = ref(false);

const showEditCouncil = ref(false);
const editForm        = ref({ name: '', description: '', logo_url: '' });
const editLoading     = ref(false);
const editError       = ref('');

const showDeleteConfirm = ref(false);
const deleteLoading     = ref(false);

// Settings form
const settingsForm    = ref({ name: '', description: '', logo_url: '' });
const settingsSaving  = ref(false);
const settingsSuccess = ref(false);
const settingsError   = ref('');

// Events filter
const activeFilter = ref('All');

// ── API helpers ────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res  = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  // console.log(res.json());
  console.log(json)
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json;
}

// ── Fetch council info ─────────────────────────────────────────────────────
async function fetchCouncil() {
  const json = await apiFetch(`/api/council/info/${councilId}`, { headers: authHeaders() });
  council.value = json.data;
  syncSettingsForm(json.data);
}

function syncSettingsForm(data) {
  settingsForm.value = {
    name:        data.name        ?? '',
    description: data.description ?? '',
    logo_url:    data.logo_url    ?? '',
  };
}

// ── Fetch members ──────────────────────────────────────────────────────────
async function fetchMembers() {
  const json = await apiFetch(`/api/council/${councilId}/members`, { headers: authHeaders() });
  members.value = json.data;
}

// ── Fetch events ───────────────────────────────────────────────────────────
// 🔴 TODO: Confirm the correct endpoint path for council-scoped events.
//    Current assumption: GET /api/events?council_id=<id>
//    Replace with the real path once the events route is finalised.
async function fetchEvents() {
  try {
    const json = await apiFetch(`/api/event?council_id=${councilId}`, { headers: authHeaders() });
    events.value = json.data ?? [];
    console.log(events.value);
  } catch {
    // Endpoint may not exist yet — fail silently and show empty state
    events.value = [];
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await Promise.all([fetchCouncil(), fetchMembers(), fetchEvents()]);
  } catch (e) {
    error.value = e.message || 'Failed to load council.';
  } finally {
    loading.value = false;
  }
});

// ── Computed ───────────────────────────────────────────────────────────────
const totalPrizePool = computed(() =>
  events.value.reduce((s, e) => s + parseFloat(e.prize_pool || 0), 0)
);
const liveCount      = computed(() => events.value.filter(e => e.status === 'Live').length);
const upcomingCount  = computed(() => events.value.filter(e => e.status === 'Upcoming').length);
const completedCount = computed(() => events.value.filter(e => e.status === 'Completed').length);

const filteredEvents = computed(() =>
  activeFilter.value === 'All'
    ? events.value
    : events.value.filter(e => e.status === activeFilter.value)
);

// ── Utils ──────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  name ? name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

const isFree = (fee) => !fee || parseFloat(fee) === 0;

const STATUS_COLORS = {
  Live: '#4ade80', Upcoming: '#fb923c', Completed: '#6b7280', Cancelled: '#f87171'
};
const statusColor = (s) => STATUS_COLORS[s] ?? '#6b7280';

const roleIcon = (role) => ({
  'Tournament Director': 'fa-crown',
  'Moderator':           'fa-shield-halved',
  'Manager':             'fa-user-gear',
}[role] ?? 'fa-user');

// ── Edit council ───────────────────────────────────────────────────────────
const openEdit = () => {
  editForm.value  = { name: council.value.name, description: council.value.description ?? '', logo_url: council.value.logo_url ?? '' };
  editError.value = '';
  showEditCouncil.value = true;
};

const saveEdit = async () => {
  editLoading.value = true;
  editError.value   = '';
  try {
    const json = await apiFetch(`/api/council/patch/${councilId}`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify(editForm.value),
    });
    council.value = json.data;
    syncSettingsForm(json.data);
    showEditCouncil.value = false;
  } catch (e) {
    editError.value = e.message;
  } finally {
    editLoading.value = false;
  }
};

// ── Settings tab save ──────────────────────────────────────────────────────
const saveSettings = async () => {
  settingsSaving.value  = true;
  settingsSuccess.value = false;
  settingsError.value   = '';
  try {
    const json = await apiFetch(`/api/council/patch/${councilId}`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify(settingsForm.value),
    });
    council.value = json.data;
    syncSettingsForm(json.data);
    settingsSuccess.value = true;
    setTimeout(() => { settingsSuccess.value = false; }, 3000);
  } catch (e) {
    settingsError.value = e.message;
  } finally {
    settingsSaving.value = false;
  }
};

// ── Delete council ─────────────────────────────────────────────────────────
const deleteCouncil = async () => {
  deleteLoading.value = true;
  try {
    await apiFetch(`/api/council/${councilId}`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    router.push('/councils');
  } catch (e) {
    error.value = e.message;
    showDeleteConfirm.value = false;
  } finally {
    deleteLoading.value = false;
  }
};

// ── Add member ─────────────────────────────────────────────────────────────
const addMember = async () => {
  if (!newMember.value.user_id.trim()) { addMemberError.value = 'User ID is required.'; return; }
  addMemberLoading.value = true;
  addMemberError.value   = '';
  try {
    await apiFetch(`/api/council/${councilId}/members`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ user_id: newMember.value.user_id.trim(), role: newMember.value.role }),
    });
    await fetchMembers();
    newMember.value     = { user_id: '', role: 'Moderator' };
    showAddMember.value = false;
  } catch (e) {
    addMemberError.value = e.message;
  } finally {
    addMemberLoading.value = false;
  }
};

// ── Remove member ──────────────────────────────────────────────────────────
// 🔴 TODO: Confirm the member identifier used in DELETE /api/council/:id/members/:userId
//    The API path uses userId but members array items have .user_id (not .id).
//    Change `m.user_id` below to match whatever your members endpoint returns.
const removeMember = async (userId) => {
  try {
    await apiFetch(`/api/council/${councilId}/members/${userId}`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    // 🔴 TODO: Adjust the filter field (.user_id vs .id) to match your members schema
    members.value = members.value.filter(m => m.user_id !== userId);
  } catch (e) {
    error.value = e.message;
  }
};
</script>

<template>
  <div class="d-shell" :class="{ collapsed: sidebarCollapsed }">

    <!-- ══ SIDEBAR ══════════════════════════════════════════════════════════ -->
    <aside class="d-side">
      <button class="d-side-toggle" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? 'Expand' : 'Collapse'">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" :d="sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'"/>
        </svg>
      </button>

      <div class="d-side-brand">
        <div class="d-brand-mark">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span class="d-brand-label" v-if="!sidebarCollapsed">COUNCIL</span>
      </div>

      <nav class="d-nav">
        <button v-for="tab in [
            { id: 'overview', label: 'Overview',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'events',   label: 'Events',    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'members',  label: 'Members',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
            { id: 'settings', label: 'Settings',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
          ]"
          :key="tab.id"
          class="d-nav-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
          :title="sidebarCollapsed ? tab.label : ''"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon"/>
          </svg>
          <span v-if="!sidebarCollapsed">{{ tab.label }}</span>
          <span v-if="!sidebarCollapsed && tab.id === 'events' && liveCount > 0" class="d-live-badge">{{ liveCount }}</span>
        </button>
      </nav>

      <div class="d-side-bottom" v-if="!sidebarCollapsed">
        <a href="/councils" class="d-back-link">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          All Councils
        </a>
      </div>
    </aside>

    <!-- ══ MAIN ═════════════════════════════════════════════════════════════ -->
    <main class="d-main">

      <div v-if="loading" class="d-loader">
        <div class="d-loader-ring"></div>
        <span>Loading council…</span>
      </div>

      <div v-else-if="error && !council" class="d-fatal-error">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error }}
      </div>

      <template v-else-if="council">

        <!-- ── TOPBAR ───────────────────────────────────────────────────── -->
        <header class="d-topbar">
          <div class="d-topbar-left">
            <div class="d-council-logo">
              <!-- 🔴 TODO: council.logo_url — served from your file storage / CDN -->
              <img v-if="council.logo_url" :src="council.logo_url" :alt="council.name" />
              <span v-else>{{ getInitials(council.name) }}</span>
            </div>
            <div class="d-topbar-text">
              <h1 class="d-council-title">{{ council.name }}</h1>
              <!-- 🔴 TODO: council.created_at — verify field name matches your DB schema (might be added_on) -->
              <p class="d-council-since">Est. {{ formatDate(council.created_at) }}</p>
            </div>
          </div>
          <div class="d-topbar-actions">
            <button class="d-btn ghost" @click="openEdit">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Edit
            </button>
            <router-link :to="`/${councilId}/create/events`" class="d-btn primary">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              New Event
            </router-link>
          </div>
        </header>

        <!-- Inline error toast -->
        <Transition name="toast">
          <div v-if="error" class="d-toast error">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ error }}
            <button class="d-toast-close" @click="error = ''">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </Transition>

        <!-- ════════════════════════════════════════════════════════════════
             OVERVIEW
        ════════════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'overview'" class="d-content">

          <!-- Stat strip -->
          <div class="d-stats">
            <div class="d-stat">
              <span class="d-stat-n">{{ members.length }}</span>
              <span class="d-stat-l">Members</span>
            </div>
            <div class="d-stat-div"></div>
            <div class="d-stat">
              <span class="d-stat-n live">{{ liveCount }}</span>
              <span class="d-stat-l">Live</span>
            </div>
            <div class="d-stat-div"></div>
            <div class="d-stat">
              <span class="d-stat-n">{{ upcomingCount }}</span>
              <span class="d-stat-l">Upcoming</span>
            </div>
            <div class="d-stat-div"></div>
            <div class="d-stat">
              <span class="d-stat-n gold">${{ totalPrizePool.toLocaleString() }}</span>
              <span class="d-stat-l">Prize Pool</span>
            </div>
            <div class="d-stat-div"></div>
            <div class="d-stat">
              <span class="d-stat-n">{{ completedCount }}</span>
              <span class="d-stat-l">Completed</span>
            </div>
          </div>

          <!-- About -->
          <section class="d-section">
            <p class="d-section-label">About</p>
            <!-- 🔴 TODO: council.description — from DB -->
            <p class="d-prose">{{ council.description || 'No description provided.' }}</p>
          </section>

          <!-- Recent events -->
          <section class="d-section" v-if="events.length">
            <div class="d-section-head">
              <p class="d-section-label">Recent Events</p>
              <button class="d-link-btn" @click="activeTab = 'events'">View all →</button>
            </div>
            <div class="d-card-list">
              <div v-for="ev in events.slice(0, 3)" :key="ev.id" class="d-event-card">
                <div class="d-event-card-left">
                  <span class="d-status-dot" :style="{ background: statusColor(ev.status) }"></span>
                  <div>
                    <!-- 🔴 TODO: ev.title, ev.event_type, ev.start_time, ev.status — from events API -->
                    <p class="d-event-card-name">{{ ev.title }}</p>
                    <p class="d-event-card-meta">{{ ev.event_type }} · {{ formatDate(ev.start_time) }}</p>
                  </div>
                </div>
                <div class="d-event-card-right">
                  <span class="d-status-pill" :style="{ '--sc': statusColor(ev.status) }">{{ ev.status }}</span>
                  <!-- 🔴 TODO: ev.prize_pool — from events API -->
                  <span class="d-prize-chip" v-if="parseFloat(ev.prize_pool) > 0">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ${{ ev.prize_pool }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Team preview -->
          <section class="d-section" v-if="members.length">
            <div class="d-section-head">
              <p class="d-section-label">Team</p>
              <button class="d-link-btn" @click="activeTab = 'members'">Manage →</button>
            </div>
            <div class="d-members-grid">
              <div v-for="m in members.slice(0, 4)" :key="m.id" class="d-member-mini">
                <div class="d-avatar sm">{{ getInitials(m.username) }}</div>
                <div>
                  <!-- 🔴 TODO: m.username, m.role — from members API -->
                  <p class="d-member-mini-name">{{ m.username }}</p>
                  <p class="d-member-mini-role">{{ m.role }}</p>
                </div>
              </div>
            </div>
          </section>

          <div v-if="!events.length && !members.length" class="d-empty">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
            <p>Council is set up. Add members and create your first event to get started.</p>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════════
             EVENTS
        ════════════════════════════════════════════════════════════════ -->
        <div v-else-if="activeTab === 'events'" class="d-content">
          <div class="d-section-head" style="margin-bottom:18px">
            <p class="d-section-label">Events</p>
            <router-link :to="`/${councilId}/create/events`" class="d-btn primary sm">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              Create Event
            </router-link>
          </div>

          <div v-if="!events.length" class="d-empty">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <p>No events yet. Create your first tournament to get started.</p>
          </div>

          <template v-else>
            <!-- Filter pills -->
            <div class="d-filters">
              <button v-for="f in ['All','Live','Upcoming','Completed','Cancelled']" :key="f"
                class="d-filter" :class="{ active: activeFilter === f }"
                @click="activeFilter = f">
                {{ f }}
                <span v-if="f !== 'All'" class="d-filter-count">
                  {{ f === 'Live' ? liveCount : f === 'Upcoming' ? upcomingCount : f === 'Completed' ? completedCount : events.filter(e=>e.status===f).length }}
                </span>
              </button>
            </div>

            <!-- Table -->
            <div class="d-table-wrap">
              <table class="d-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Entry</th>
                    <th>Prize</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ev in filteredEvents" :key="ev.id" class="d-table-row">
                    <!-- 🔴 TODO: ev.title, ev.event_type, ev.registration_fee, ev.prize_pool, ev.start_time, ev.status — all from events API -->
                    <td class="d-td-main">{{ ev.title }}</td>
                    <td><span class="d-chip">{{ ev.event_type }}</span></td>
                    <td class="d-td-dim">{{ isFree(ev.registration_fee) ? 'Free' : `$${ev.registration_fee}` }}</td>
                    <td class="d-td-gold">{{ parseFloat(ev.prize_pool) > 0 ? `$${ev.prize_pool}` : '—' }}</td>
                    <td class="d-td-dim">{{ formatDate(ev.start_time) }}</td>
                    <td><span class="d-status-pill" :style="{ '--sc': statusColor(ev.status) }">{{ ev.status }}</span></td>
                    <td class="d-td-actions">
                      <!-- 🔴 TODO: Wire edit/delete event actions -->
                      <button class="d-icon-btn" title="Edit event">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button class="d-icon-btn danger" title="Delete event">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredEvents.length === 0">
                    <td colspan="7" class="d-table-empty">No {{ activeFilter.toLowerCase() }} events.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- ════════════════════════════════════════════════════════════════
             MEMBERS
        ════════════════════════════════════════════════════════════════ -->
        <div v-else-if="activeTab === 'members'" class="d-content">
          <div class="d-section-head" style="margin-bottom:18px">
            <p class="d-section-label">Members</p>
            <button class="d-btn primary sm" @click="showAddMember = true">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Member
            </button>
          </div>

          <div v-if="!members.length" class="d-empty">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p>No members yet.</p>
          </div>

          <div v-else class="d-member-list">
            <div v-for="m in members" :key="m.id" class="d-member-row">
              <div class="d-avatar md">{{ getInitials(m.username) }}</div>
              <div class="d-member-info">
                <!-- 🔴 TODO: m.username, m.email, m.role, m.joined_at — from members API -->
                <p class="d-member-name">{{ m.username }}</p>
                <p class="d-member-email">{{ m.email }}</p>
              </div>
              <span class="d-role-tag">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path v-if="roleIcon(m.role)==='fa-crown'" stroke-linecap="round" stroke-linejoin="round" d="M5 3l4 9 3-6 3 6 4-9-7 14H12L5 3z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                {{ m.role }}
              </span>
              <p class="d-member-since">{{ formatDate(m.joined_at) }}</p>
              <!-- 🔴 TODO: Confirm m.user_id vs m.id — see removeMember comment in script -->
              <button class="d-icon-btn danger" @click="removeMember(m.user_id)" title="Remove member">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg>
              </button>
            </div>
          </div>

          <!-- Add member modal -->
          <Teleport to="body">
          <div v-if="showAddMember" class="d-overlay" @click.self="showAddMember = false">
            <div class="d-modal">
              <div class="d-modal-head">
                <p class="d-modal-title">Add Member</p>
                <button class="d-icon-btn" @click="showAddMember = false"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div class="d-modal-body">
                <!-- 🔴 TODO: Replace plain User ID input with a user-search / autocomplete -->
                <label class="d-label">User ID <span class="d-hint">(UUID)</span></label>
                <input class="d-input" v-model="newMember.user_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                <label class="d-label" style="margin-top:14px">Role</label>
                <select class="d-input" v-model="newMember.role">
                  <option>Tournament Director</option>
                  <option>Moderator</option>
                  <option>Manager</option>
                </select>
                <div v-if="addMemberError" class="d-inline-error">{{ addMemberError }}</div>
              </div>
              <div class="d-modal-foot">
                <button class="d-btn ghost" @click="showAddMember = false">Cancel</button>
                <button class="d-btn primary" :disabled="addMemberLoading" @click="addMember">
                  <span v-if="addMemberLoading" class="d-spin"></span>
                  {{ addMemberLoading ? 'Adding…' : 'Add Member' }}
                </button>
              </div>
            </div>
          </div>
          </Teleport>
        </div>

        <!-- ════════════════════════════════════════════════════════════════
             SETTINGS
        ════════════════════════════════════════════════════════════════ -->
        <div v-else-if="activeTab === 'settings'" class="d-content">

          <div class="d-settings-block">
            <p class="d-settings-group-label">Council Info</p>
            <div class="d-field">
              <label class="d-label">Name</label>
              <input class="d-input" v-model="settingsForm.name" placeholder="Council name" />
            </div>
            <div class="d-field">
              <label class="d-label">Description</label>
              <textarea class="d-input d-textarea" v-model="settingsForm.description" rows="3" placeholder="What's this council about…"></textarea>
            </div>
            <div class="d-field">
              <!-- 🔴 TODO: Replace with a proper file-upload component; currently just a raw URL input -->
              <label class="d-label">Logo URL</label>
              <input class="d-input" v-model="settingsForm.logo_url" placeholder="https://cdn.example.com/logo.png" />
            </div>
            <Transition name="toast">
              <div v-if="settingsSuccess" class="d-inline-success">Changes saved successfully.</div>
            </Transition>
            <div v-if="settingsError" class="d-inline-error">{{ settingsError }}</div>
            <div class="d-settings-actions">
              <button class="d-btn primary" :disabled="settingsSaving" @click="saveSettings">
                <span v-if="settingsSaving" class="d-spin"></span>
                {{ settingsSaving ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <div class="d-settings-block danger">
            <p class="d-settings-group-label danger">Danger Zone</p>
            <p class="d-danger-copy">Permanently deletes this council and all associated data. Cannot be undone.</p>
            <button class="d-btn danger" @click="showDeleteConfirm = true">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Delete Council
            </button>
          </div>
        </div>

      </template>
    </main>

    <!-- ══ EDIT MODAL ════════════════════════════════════════════════════════ -->
    <Teleport to="body">
    <div v-if="showEditCouncil" class="d-overlay" @click.self="showEditCouncil = false">
      <div class="d-modal">
        <div class="d-modal-head">
          <p class="d-modal-title">Edit Council</p>
          <button class="d-icon-btn" @click="showEditCouncil = false"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div class="d-modal-body">
          <label class="d-label">Name</label>
          <input class="d-input" v-model="editForm.name" />
          <label class="d-label" style="margin-top:14px">Description</label>
          <textarea class="d-input d-textarea" v-model="editForm.description" rows="3"></textarea>
          <!-- 🔴 TODO: Replace with file-upload component -->
          <label class="d-label" style="margin-top:14px">Logo URL</label>
          <input class="d-input" v-model="editForm.logo_url" placeholder="https://…" />
          <div v-if="editError" class="d-inline-error" style="margin-top:10px">{{ editError }}</div>
        </div>
        <div class="d-modal-foot">
          <button class="d-btn ghost" @click="showEditCouncil = false">Cancel</button>
          <button class="d-btn primary" :disabled="editLoading" @click="saveEdit">
            <span v-if="editLoading" class="d-spin"></span>
            {{ editLoading ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- ══ DELETE MODAL ══════════════════════════════════════════════════════ -->
    <Teleport to="body">
    <div v-if="showDeleteConfirm" class="d-overlay" @click.self="showDeleteConfirm = false">
      <div class="d-modal">
        <div class="d-modal-head">
          <p class="d-modal-title" style="color:#f87171">Confirm Delete</p>
          <button class="d-icon-btn" @click="showDeleteConfirm = false"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div class="d-modal-body">
          <p class="d-delete-copy">
            You're about to permanently delete <strong>{{ council?.name }}</strong> and all its events and members. This cannot be undone.
          </p>
        </div>
        <div class="d-modal-foot">
          <button class="d-btn ghost" @click="showDeleteConfirm = false">Cancel</button>
          <button class="d-btn danger" :disabled="deleteLoading" @click="deleteCouncil">
            <span v-if="deleteLoading" class="d-spin"></span>
            {{ deleteLoading ? 'Deleting…' : 'Delete Forever' }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Reset ──────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Shell ──────────────────────────────────────────────────────────────── */
.d-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg, #0f0e0c);
  color: var(--fg, #e2ddd8);
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
.d-side {
  width: 210px;
  flex-shrink: 0;
  background: var(--surface, #161412);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  padding: 16px 10px 20px;
  transition: width 0.22s ease;
  position: relative;
}
.d-shell.collapsed .d-side { width: 56px; }

.d-side-toggle {
  position: absolute;
  top: 16px; right: -12px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--surface, #161412);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(226,221,216,0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: color 0.15s, border-color 0.15s;
  z-index: 10;
}
.d-side-toggle:hover { color: var(--fg, #e2ddd8); border-color: rgba(255,255,255,0.2); }

.d-side-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 4px 6px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 8px;
  overflow: hidden;
}
.d-brand-mark {
  width: 32px; height: 32px; flex-shrink: 0;
  border-radius: 8px;
  background: rgba(188,103,33,0.18);
  display: flex; align-items: center; justify-content: center;
  color: #bc6721;
}
.d-brand-label {
  font-size: 10px; font-weight: 800; letter-spacing: 0.22em;
  color: rgba(226,221,216,0.4); white-space: nowrap; overflow: hidden;
}

.d-nav { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.d-nav-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px;
  background: none; border: none; cursor: pointer;
  color: rgba(226,221,216,0.4);
  font-size: 13px; font-weight: 500;
  text-align: left; white-space: nowrap; overflow: hidden;
  transition: background 0.15s, color 0.15s;
}
.d-shell.collapsed .d-nav-btn { justify-content: center; }
.d-nav-btn svg { flex-shrink: 0; }
.d-nav-btn:hover { background: rgba(255,255,255,0.05); color: var(--fg, #e2ddd8); }
.d-nav-btn.active { background: rgba(188,103,33,0.12); color: #bc6721; }
.d-live-badge {
  margin-left: auto;
  background: #4ade80; color: #0f0e0c;
  font-size: 9px; font-weight: 800;
  padding: 1px 5px; border-radius: 999px;
}

.d-side-bottom {
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.05);
  margin-top: 8px;
}
.d-back-link {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 600; color: rgba(226,221,216,0.3);
  text-decoration: none; padding: 6px 8px; border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.d-back-link:hover { color: #bc6721; background: rgba(188,103,33,0.07); }

/* ── Main ───────────────────────────────────────────────────────────────── */
.d-main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-width: 0; }

/* ── Loader ─────────────────────────────────────────────────────────────── */
.d-loader {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 100px 40px; color: rgba(226,221,216,0.3); font-size: 13px;
}
.d-loader-ring {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid rgba(188,103,33,0.2);
  border-top-color: #bc6721;
  animation: spin 0.8s linear infinite;
}
.d-fatal-error {
  display: flex; align-items: center; gap: 10px;
  margin: 40px 32px; padding: 14px 18px;
  background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2);
  border-radius: 10px; font-size: 13px; color: #f87171;
}

/* ── Topbar ─────────────────────────────────────────────────────────────── */
.d-topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 22px 30px; border-bottom: 1px solid rgba(255,255,255,0.05);
  background: var(--surface, #161412); flex-wrap: wrap; gap: 14px;
  flex-shrink: 0;
}
.d-topbar-left { display: flex; align-items: center; gap: 14px; }
.d-council-logo {
  width: 46px; height: 46px; border-radius: 10px; flex-shrink: 0;
  background: rgba(188,103,33,0.14); border: 1px solid rgba(188,103,33,0.28);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; color: #bc6721; overflow: hidden;
}
.d-council-logo img { width: 100%; height: 100%; object-fit: cover; }
.d-council-title { font-size: 18px; font-weight: 800; letter-spacing: 0.02em; line-height: 1.1; }
.d-council-since { font-size: 11px; color: rgba(226,221,216,0.3); margin-top: 3px; }
.d-topbar-actions { display: flex; gap: 8px; }

/* ── Toast / error ──────────────────────────────────────────────────────── */
.d-toast {
  display: flex; align-items: center; gap: 9px;
  margin: 12px 30px 0;
  padding: 11px 14px; border-radius: 9px; font-size: 12px; font-weight: 600;
}
.d-toast.error {
  background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2); color: #f87171;
}
.d-toast-close {
  margin-left: auto; background: none; border: none;
  color: currentColor; opacity: 0.5; cursor: pointer; padding: 2px;
}
.d-toast-close:hover { opacity: 1; }

.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-5px); }

/* ── Buttons ────────────────────────────────────────────────────────────── */
.d-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 600;
  transition: background 0.15s, opacity 0.15s, transform 0.1s;
  text-decoration: none; white-space: nowrap;
}
.d-btn.sm { padding: 6px 12px; font-size: 12px; }
.d-btn:active { transform: scale(0.97); }
.d-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

.d-btn.primary { background: #bc6721; color: #fff; }
.d-btn.primary:not(:disabled):hover { background: #d0732a; }
.d-btn.ghost { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(226,221,216,0.7); }
.d-btn.ghost:hover { border-color: rgba(188,103,33,0.4); color: #bc6721; }
.d-btn.danger { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #f87171; }
.d-btn.danger:not(:disabled):hover { background: rgba(248,113,113,0.18); }

.d-icon-btn {
  width: 28px; height: 28px; border-radius: 6px; border: none;
  background: transparent; color: rgba(226,221,216,0.3); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.d-icon-btn:hover { background: rgba(255,255,255,0.07); color: var(--fg, #e2ddd8); }
.d-icon-btn.danger:hover { background: rgba(248,113,113,0.1); color: #f87171; }

.d-link-btn {
  background: none; border: none; cursor: pointer;
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  color: #bc6721; transition: color 0.15s;
}
.d-link-btn:hover { color: #d4782a; }

.d-spin {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Content area ───────────────────────────────────────────────────────── */
.d-content { padding: 28px 30px; display: flex; flex-direction: column; gap: 26px; }

/* ── Stats strip ────────────────────────────────────────────────────────── */
.d-stats {
  display: flex; align-items: center; gap: 0;
  background: var(--surface, #161412);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 18px 24px;
  flex-wrap: wrap;
}
.d-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 80px; }
.d-stat-div { width: 1px; height: 32px; background: rgba(255,255,255,0.07); flex-shrink: 0; }
.d-stat-n { font-size: 26px; font-weight: 800; line-height: 1; color: var(--fg, #e2ddd8); }
.d-stat-n.live { color: #4ade80; }
.d-stat-n.gold { color: #fbbf24; }
.d-stat-l { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(226,221,216,0.3); }

/* ── Sections ───────────────────────────────────────────────────────────── */
.d-section { display: flex; flex-direction: column; gap: 12px; }
.d-section-head { display: flex; justify-content: space-between; align-items: center; }
.d-section-label {
  font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(226,221,216,0.35);
}
.d-prose {
  font-size: 13.5px; line-height: 1.65; color: rgba(226,221,216,0.55);
  padding: 16px 18px;
  background: var(--surface, #161412);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
}

/* ── Event cards (overview) ─────────────────────────────────────────────── */
.d-card-list { display: flex; flex-direction: column; gap: 3px; }
.d-event-card {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 16px;
  background: var(--surface, #161412);
  border: 1px solid rgba(255,255,255,0.05); border-radius: 9px;
  transition: border-color 0.15s;
}
.d-event-card:hover { border-color: rgba(188,103,33,0.2); }
.d-event-card-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.d-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.d-event-card-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.d-event-card-meta { font-size: 11px; color: rgba(226,221,216,0.35); margin-top: 2px; }
.d-event-card-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.d-status-pill {
  font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 999px;
  color: var(--sc, #888);
  border: 1px solid color-mix(in srgb, var(--sc, #888) 40%, transparent);
  background: color-mix(in srgb, var(--sc, #888) 10%, transparent);
}

.d-prize-chip {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; color: #fbbf24;
}

/* ── Members mini grid ──────────────────────────────────────────────────── */
.d-members-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.d-member-mini {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: var(--surface, #161412); border: 1px solid rgba(255,255,255,0.05); border-radius: 9px;
}
.d-member-mini-name { font-size: 13px; font-weight: 600; }
.d-member-mini-role { font-size: 10px; color: rgba(226,221,216,0.3); margin-top: 2px; }

/* ── Avatars ────────────────────────────────────────────────────────────── */
.d-avatar {
  background: rgba(188,103,33,0.13); color: #bc6721;
  font-weight: 800; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.d-avatar.sm { width: 34px; height: 34px; font-size: 12px; }
.d-avatar.md { width: 40px; height: 40px; font-size: 14px; border-radius: 10px; }

/* ── Events table ───────────────────────────────────────────────────────── */
.d-filters { display: flex; gap: 5px; flex-wrap: wrap; }
.d-filter {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 12px; border-radius: 999px;
  font-size: 11px; font-weight: 700;
  background: transparent; border: 1px solid rgba(255,255,255,0.08);
  color: rgba(226,221,216,0.4); cursor: pointer; transition: all 0.15s;
}
.d-filter:hover { border-color: rgba(188,103,33,0.3); color: #bc6721; }
.d-filter.active { background: rgba(188,103,33,0.12); border-color: rgba(188,103,33,0.35); color: #bc6721; }
.d-filter-count {
  background: rgba(255,255,255,0.07); border-radius: 999px;
  padding: 0 5px; font-size: 9px; font-weight: 800;
}

.d-table-wrap {
  background: var(--surface, #161412);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;
}
.d-table { width: 100%; border-collapse: collapse; }
.d-table thead tr {
  background: rgba(255,255,255,0.025);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.d-table th {
  padding: 10px 14px; text-align: left;
  font-size: 9px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(226,221,216,0.28);
}
.d-table-row { border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.12s; }
.d-table-row:last-child { border-bottom: none; }
.d-table-row:hover { background: rgba(188,103,33,0.035); }
.d-table td { padding: 11px 14px; font-size: 13px; }

.d-td-main { font-weight: 600; }
.d-td-dim { color: rgba(226,221,216,0.4); }
.d-td-gold { color: #fbbf24; font-weight: 600; }
.d-td-actions { display: flex; gap: 3px; justify-content: flex-end; }

.d-chip {
  font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(226,221,216,0.5); white-space: nowrap;
}
.d-table-empty {
  text-align: center; padding: 32px !important;
  color: rgba(226,221,216,0.25); font-size: 13px;
}

/* ── Members list ───────────────────────────────────────────────────────── */
.d-member-list { display: flex; flex-direction: column; gap: 3px; }
.d-member-row {
  display: flex; align-items: center; gap: 14px; padding: 13px 16px;
  background: var(--surface, #161412);
  border: 1px solid rgba(255,255,255,0.05); border-radius: 9px;
  transition: border-color 0.15s;
}
.d-member-row:hover { border-color: rgba(188,103,33,0.2); }
.d-member-info { flex: 1; min-width: 0; }
.d-member-name { font-size: 14px; font-weight: 700; }
.d-member-email { font-size: 11px; color: rgba(226,221,216,0.35); margin-top: 2px; }
.d-role-tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 999px; white-space: nowrap;
  background: rgba(188,103,33,0.1); border: 1px solid rgba(188,103,33,0.22); color: #bc6721;
}
.d-member-since { font-size: 10px; color: rgba(226,221,216,0.2); white-space: nowrap; }

/* ── Settings ───────────────────────────────────────────────────────────── */
.d-settings-block {
  background: var(--surface, #161412);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
  padding: 22px 24px; display: flex; flex-direction: column; gap: 14px;
}
.d-settings-block.danger { border-color: rgba(248,113,113,0.14); }
.d-settings-group-label {
  font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(226,221,216,0.35);
}
.d-settings-group-label.danger { color: rgba(248,113,113,0.6); }
.d-danger-copy { font-size: 13px; color: rgba(226,221,216,0.4); line-height: 1.55; }
.d-settings-actions { display: flex; justify-content: flex-end; }

/* ── Form elements ──────────────────────────────────────────────────────── */
.d-field { display: flex; flex-direction: column; gap: 6px; }
.d-label {
  font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(226,221,216,0.35); display: block;
}
.d-hint { font-size: 9px; opacity: 0.6; text-transform: none; letter-spacing: 0; font-weight: 500; }
.d-input {
  width: 100%; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  padding: 10px 12px; font-size: 13px; color: var(--fg, #e2ddd8);
  outline: none; transition: border-color 0.15s;
  font-family: inherit; resize: vertical;
}
.d-input:focus { border-color: rgba(188,103,33,0.45); background: rgba(188,103,33,0.04); }
.d-input::placeholder { color: rgba(226,221,216,0.2); }
.d-textarea { min-height: 80px; }

.d-inline-error {
  padding: 9px 13px; border-radius: 7px; font-size: 12px; font-weight: 600;
  color: #f87171; background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2);
}
.d-inline-success {
  padding: 9px 13px; border-radius: 7px; font-size: 12px; font-weight: 600;
  color: #4ade80; background: rgba(74,222,128,0.07); border: 1px solid rgba(74,222,128,0.2);
}

/* ── Modal ──────────────────────────────────────────────────────────────── */
.d-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(3px);
  z-index: 200; display: flex; align-items: center; justify-content: center;
}
.d-modal {
  background: var(--surface, #161412);
  border: 1px solid rgba(188,103,33,0.2); border-radius: 14px;
  width: 420px; max-width: 92vw; max-height: 90vh; overflow-y: auto;
}
.d-modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.d-modal-title { font-size: 13px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
.d-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
.d-modal-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.05);
}
.d-delete-copy { font-size: 13px; line-height: 1.6; color: rgba(226,221,216,0.55); }
.d-delete-copy strong { color: var(--fg, #e2ddd8); }

/* ── Empty state ────────────────────────────────────────────────────────── */
.d-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 20px; color: rgba(226,221,216,0.2); text-align: center;
}
.d-empty svg { opacity: 0.5; }
.d-empty p { font-size: 13px; max-width: 260px; line-height: 1.6; }

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .d-members-grid { grid-template-columns: 1fr; }
  .d-stats { gap: 0; }
}
@media (max-width: 640px) {
  .d-topbar { padding: 16px 18px; }
  .d-content { padding: 20px 18px; }
  .d-table-wrap { overflow-x: auto; }
  .d-table { min-width: 560px; }
  .d-stats { flex-direction: column; align-items: flex-start; gap: 8px; }
  .d-stat-div { width: 100%; height: 1px; }
}
</style>