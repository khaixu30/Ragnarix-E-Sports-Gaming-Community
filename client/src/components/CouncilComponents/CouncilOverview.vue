<script setup>
import { computed } from 'vue';

const props = defineProps({
  events:  Array,
  members: Array,
});

const emit = defineEmits(['go-events', 'go-members']);

const stats = computed(() => ({
  total:     props.events.length,
  live:      props.events.filter(e => e.status === 'Live').length,
  upcoming:  props.events.filter(e => e.status === 'Upcoming').length,
  members:   props.members.length,
}));

const statusClass = s => ({
  Upcoming:  'badge-upcoming',
  Live:      'badge-live',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled',
}[s] || '');
</script>

<template>
  <div class="overview-wrap">
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-n">{{ stats.total }}</div>
        <div class="stat-l">Total Events</div>
      </div>
      <div class="stat-card">
        <div class="stat-n live">{{ stats.live }}</div>
        <div class="stat-l">Live Now</div>
      </div>
      <div class="stat-card">
        <div class="stat-n">{{ stats.upcoming }}</div>
        <div class="stat-l">Upcoming</div>
      </div>
      <div class="stat-card">
        <div class="stat-n">{{ stats.members }}</div>
        <div class="stat-l">Members</div>
      </div>
    </div>

    <!-- Grid -->
    <div class="overview-grid">
      <!-- Recent Events -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-label">Recent Events</span>
          <button class="btn-ghost btn-sm" @click="emit('go-events')">View all →</button>
        </div>
        <div v-if="!events.length" class="empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <p>No events yet</p>
        </div>
        <div v-else>
          <div
            v-for="event in events.slice(0, 5)"
            :key="event.id"
            class="mini-row"
          >
            <div class="mini-info">
              <span class="mini-title">{{ event.title }}</span>
              <span class="mini-sub">{{ new Date(event.start_time).toLocaleDateString() }} · {{ event.event_type }}</span>
            </div>
            <span class="badge" :class="statusClass(event.status)">{{ event.status }}</span>
          </div>
        </div>
      </div>

      <!-- Members -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-label">Team</span>
          <button class="btn-ghost btn-sm" @click="emit('go-members')">Manage →</button>
        </div>
        <div v-if="!members.length" class="empty-state">
          <i class="fa-solid fa-user-slash"></i>
          <p>No members yet</p>
        </div>
        <div v-else>
          <div v-for="member in members.slice(0, 6)" :key="member.id" class="mini-row">
            <div class="m-avatar">{{ member.username[0].toUpperCase() }}</div>
            <div class="mini-info">
              <span class="mini-title">{{ member.username }}</span>
              <span class="mini-sub">{{ member.role }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-wrap { display: flex; flex-direction: column; gap: 18px; }

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
}

@media (max-width: 760px) {
  .overview-grid { grid-template-columns: 1fr; }
}

.mini-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(188,103,33,0.05);
}

.mini-row:last-child { border-bottom: none; }

.mini-info { flex: 1; min-width: 0; }
.mini-title { display: block; font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mini-sub   { display: block; font-size: 10px; color: var(--text-faint); margin-top: 1px; }

.m-avatar {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--primary-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  color: var(--primary);
}

.btn-sm { padding: 4px 10px; font-size: 10px; }
</style>