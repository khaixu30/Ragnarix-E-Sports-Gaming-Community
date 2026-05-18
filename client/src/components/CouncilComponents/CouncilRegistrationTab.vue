<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  selectedEvent: Object,
  participants:  Array,
  loading:       Boolean,
});

const emit = defineEmits(['save-score', 'remove-participant', 'back']);

// Local copy so edits don't mutate parent directly
const localParticipants = ref([]);

watch(() => props.participants, (val) => {
  localParticipants.value = val.map(p => ({ ...p }));
}, { immediate: true, deep: true });

const saveOne = (reg) => emit('save-score', reg);

const participantLabel = (p) => {
  // The API only returns participant_id; if you join with user/team names later, swap this out
  return p.display_name || p.username || p.team_name || p.participant_id;
};
</script>

<template>
  <div>
    <div class="tab-toolbar">
      <div class="toolbar-left">
        <span v-if="selectedEvent" class="event-pill">
          <i class="fa-solid fa-calendar-days"></i> {{ selectedEvent.title }}
          <span class="badge" :class="`badge-${selectedEvent.status.toLowerCase()}`">{{ selectedEvent.status }}</span>
        </span>
        <span v-else class="count-label">No event selected</span>
      </div>
      <button v-if="selectedEvent" class="btn-ghost" @click="emit('back')">
        ← Back to Events
      </button>
    </div>

    <!-- No event selected hint -->
    <div v-if="!selectedEvent" class="empty-state">
      <i class="fa-solid fa-arrow-up-long"></i>
      <p>Go to the <strong>Events</strong> tab and click <i class="fa-solid fa-users"></i> on an event.</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="loading-state">
      <span class="spinner"></span>
      <span>Loading registrations…</span>
    </div>

    <!-- Table -->
    <div v-else class="panel p0">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Participant</th>
            <th>Type</th>
            <th>Registered</th>
            <th>Score</th>
            <th>Rank</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!localParticipants.length">
            <td colspan="7" class="empty-cell">No registrations for this event.</td>
          </tr>
          <tr v-for="(reg, idx) in localParticipants" :key="reg.registration_id">
            <td class="cell-sub">{{ idx + 1 }}</td>
            <td>
              <div class="cell-primary">{{ participantLabel(reg) }}</div>
            </td>
            <td><span class="tag">{{ reg.participant_type }}</span></td>
            <td class="cell-sub">{{ new Date(reg.registered_at).toLocaleDateString() }}</td>
            <td>
              <input
                type="number"
                v-model="reg.score"
                class="score-input"
                placeholder="—"
              />
            </td>
            <td>
              <input
                type="number"
                v-model="reg.rank"
                class="rank-input"
                placeholder="—"
              />
            </td>
            <td class="right">
              <div class="action-btns">
                <button class="action-btn advance" title="Save" @click="saveOne(reg)">
                  <i class="fa-solid fa-floppy-disk"></i>
                </button>
                <button class="action-btn danger" title="Remove" @click="emit('remove-participant', reg)">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bulk save -->
    <div v-if="localParticipants.length" class="bulk-actions">
      <button class="btn-primary" @click="localParticipants.forEach(p => saveOne(p))">
        <i class="fa-solid fa-floppy-disk"></i> Save All Scores
      </button>
    </div>
  </div>
</template>

<style scoped>
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-left { display: flex; align-items: center; gap: 10px; }

.event-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
}

.count-label {
  font-size: 11px;
  color: var(--text-faint);
  font-weight: 600;
}

.bulk-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>