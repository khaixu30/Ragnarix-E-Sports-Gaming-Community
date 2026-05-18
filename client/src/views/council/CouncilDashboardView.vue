<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import CouncilSidebar     from '../../components/council/CouncilSidebar.vue';
import CouncilHeader      from '../../components/council/CouncilHeader.vue';
import OverviewTab        from '../../components/council/OverviewTab.vue';
import EventsTab          from '../../components/council/EventsTab.vue';
import MembersTab         from '../../components/council/MembersTab.vue';
import RegistrationsTab   from '../../components/council/RegistrationsTab.vue';
import EventForm          from '../../components/council/EventForm.vue';
import EditCouncilModal   from '../../components/council/EditCouncilModal.vue';

// ── Props / Router ────────────────────────────
const props  = defineProps({ id: String });
const router = useRouter();
const BASE   = import.meta.env.VITE_HOST;

// ── State ─────────────────────────────────────
const loading       = ref(true);
const council       = ref(null);
const members       = ref([]);
const events        = ref([]);
const participants  = ref([]);
const selectedEvent = ref(null);
const regsLoading   = ref(false);

const activeTab     = ref('overview');
const showEventForm = ref(false);
const editingEvent  = ref(null);

const showEditModal   = ref(false);
const editModalLoad   = ref(false);

const eventFormLoad   = ref(false);
const eventFormError  = ref('');
const eventFormOk     = ref('');

const globalError     = ref('');

// ── Helpers ───────────────────────────────────
const authHeaders = () => ({
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const nextStatus  = s => ({ Upcoming: 'Live', Live: 'Completed' }[s]);

// ── Load ──────────────────────────────────────
onMounted(async () => {
  try {
    const [c, m, e] = await Promise.all([
      fetch(`${BASE}/api/council/info/${props.id}`).then(r => r.json()),
      fetch(`${BASE}/api/council/${props.id}/members`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${BASE}/api/events?council_id=${props.id}`, { headers: authHeaders() }).then(r => r.json()),
    ]);
    if (c.success) council.value = c.data;
    if (m.success) members.value = m.data;
    if (e.success) events.value  = e.events;
  } catch (err) {
    console.error(err);
    globalError.value = 'Failed to load council data.';
  } finally {
    loading.value = false;
  }
});

// ── Council Edit / Delete ─────────────────────
const saveCouncilEdit = async (formData) => {
  editModalLoad.value = true;
  try {
    const res  = await fetch(`${BASE}/api/council/patch/${props.id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(formData),
    });
    const json = await res.json();
    if (json.success) { council.value = json.data; showEditModal.value = false; }
    else globalError.value = json.message;
  } finally {
    editModalLoad.value = false;
  }
};

const deleteCouncil = async () => {
  if (!confirm(`Delete "${council.value.name}"? This cannot be undone.`)) return;
  await fetch(`${BASE}/api/councils/${props.id}`, { method: 'DELETE', headers: authHeaders() });
  router.push('/councils');
};

// ── Event CRUD ────────────────────────────────
const openCreateEvent = () => {
  editingEvent.value = null;
  eventFormError.value = '';
  eventFormOk.value    = '';
  showEventForm.value  = true;
  activeTab.value      = 'events';
};

const openEditEvent = (event) => {
  editingEvent.value   = event;
  eventFormError.value = '';
  eventFormOk.value    = '';
  showEventForm.value  = true;
};

const cancelEventForm = () => {
  showEventForm.value = false;
  editingEvent.value  = null;
};

const submitEventForm = async (payload) => {
  eventFormError.value = '';
  eventFormOk.value    = '';
  eventFormLoad.value  = true;

  try {
    let res, json;
    if (editingEvent.value) {
      res  = await fetch(`${BASE}/api/events/${editingEvent.value.id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(payload),
      });
      json = await res.json();
      if (json.success) {
        const idx = events.value.findIndex(e => e.id === editingEvent.value.id);
        if (idx !== -1) events.value[idx] = json.event;
        eventFormOk.value = 'Event updated!';
        setTimeout(cancelEventForm, 1200);
      } else eventFormError.value = json.message;
    } else {
      res  = await fetch(`${BASE}/api/events`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      json = await res.json();
      if (json.success) {
        events.value.unshift(json.event);
        eventFormOk.value = 'Event created!';
        setTimeout(cancelEventForm, 1200);
      } else eventFormError.value = json.message;
    }
  } catch (err) {
    eventFormError.value = 'Network error.';
  } finally {
    eventFormLoad.value = false;
  }
};

const advanceStatus = async (event) => {
  const next = nextStatus(event.status);
  if (!next || !confirm(`Move "${event.title}" → ${next}?`)) return;
  const res  = await fetch(`${BASE}/api/events/${event.id}/status`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: next }),
  });
  const json = await res.json();
  if (json.success) {
    const idx = events.value.findIndex(e => e.id === event.id);
    if (idx !== -1) events.value[idx] = json.event;
  }
};

const deleteEvent = async (event) => {
  if (!confirm(`Delete "${event.title}"?`)) return;
  await fetch(`${BASE}/api/events/${event.id}`, { method: 'DELETE', headers: authHeaders() });
  events.value = events.value.filter(e => e.id !== event.id);
};

// ── Registrations ─────────────────────────────
const viewRegistrations = async (event) => {
  selectedEvent.value = event;
  activeTab.value     = 'registrations';
  regsLoading.value   = true;
  showEventForm.value = false;
  try {
    const res  = await fetch(`${BASE}/api/events/${event.id}/participants`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) participants.value = json.participants;
  } finally {
    regsLoading.value = false;
  }
};

const saveScore = async (reg) => {
  await fetch(`${BASE}/api/events/${selectedEvent.value.id}/participants/${reg.registration_id}`, {
    method: 'PATCH', headers: authHeaders(),
    body: JSON.stringify({ score: Number(reg.score), rank: Number(reg.rank) }),
  });
};

const removeParticipant = async (reg) => {
  if (!confirm('Remove this participant?')) return;
  await fetch(`${BASE}/api/events/${selectedEvent.value.id}/participants/${reg.registration_id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  participants.value = participants.value.filter(p => p.registration_id !== reg.registration_id);
};

// ── Members ───────────────────────────────────
const addMember = async (formData) => {
  try {
    const res  = await fetch(`${BASE}/api/council/${props.id}/members`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(formData),
    });
    const json = await res.json();
    if (json.success) {
      const m = await fetch(`${BASE}/api/council/${props.id}/members`, { headers: authHeaders() }).then(r => r.json());
      if (m.success) members.value = m.data;
    } else globalError.value = json.message;
  } catch { globalError.value = 'Failed to add member.'; }
};

const removeMember = async (userId) => {
  if (!confirm('Remove this member?')) return;
  await fetch(`${BASE}/api/council/${props.id}/members/${userId}`, { method: 'DELETE', headers: authHeaders() });
  members.value = members.value.filter(m => m.id !== userId);
};

// ── Tab nav helpers ───────────────────────────
const changeTab = (tab) => {
  activeTab.value     = tab;
  showEventForm.value = false;
};

const goEvents = () => changeTab('events');
</script>

<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <CouncilSidebar
      :council="council"
      :active-tab="activeTab"
      @tab-change="changeTab"
    />

    <!-- Main -->
    <div class="main-content">
      <div v-if="loading" class="loading-state">
        <span class="spinner"></span>
        <span>Loading dashboard…</span>
      </div>

      <template v-else-if="council">
        <!-- Top bar -->
        <div class="page-topbar">
          <div>
            <div class="page-eyebrow">Dashboard</div>
            <h1 class="page-title">{{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</h1>
          </div>
        </div>

        <div class="page-body">
          <!-- Global error -->
          <div v-if="globalError" class="alert alert-error" style="margin-bottom:16px">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ globalError }}
          </div>

          <!-- Council header -->
          <CouncilHeader
            :council="council"
            @edit="showEditModal = true"
            @delete="deleteCouncil"
          />

          <!-- ── Overview ── -->
          <OverviewTab
            v-if="activeTab === 'overview'"
            :events="events"
            :members="members"
            @go-events="changeTab('events')"
            @go-members="changeTab('members')"
          />

          <!-- ── Events ── -->
          <template v-else-if="activeTab === 'events'">
            <EventForm
              v-if="showEventForm"
              :council-id="props.id"
              :event-data="editingEvent"
              :loading="eventFormLoad"
              :error="eventFormError"
              :success="eventFormOk"
              @submit="submitEventForm"
              @cancel="cancelEventForm"
            />
            <EventsTab
              v-else
              :events="events"
              :council-id="props.id"
              @advance-status="advanceStatus"
              @delete-event="deleteEvent"
              @view-registrations="viewRegistrations"
            />
          </template>

          <!-- ── Members ── -->
          <MembersTab
            v-else-if="activeTab === 'members'"
            :members="members"
            @add-member="addMember"
            @remove-member="removeMember"
          />

          <!-- ── Registrations ── -->
          <RegistrationsTab
            v-else-if="activeTab === 'registrations'"
            :selected-event="selectedEvent"
            :participants="participants"
            :loading="regsLoading"
            @save-score="saveScore"
            @remove-participant="removeParticipant"
            @back="changeTab('events')"
          />
        </div>
      </template>

      <div v-else class="loading-state">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:24px;color:var(--red)"></i>
        <span>Council not found.</span>
      </div>
    </div>

    <!-- Edit Council Modal -->
    <EditCouncilModal
      v-model="showEditModal"
      :council="council"
      :loading="editModalLoad"
      @save="saveCouncilEdit"
    />
  </div>
</template>