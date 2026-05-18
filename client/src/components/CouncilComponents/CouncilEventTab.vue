<script setup>
const props = defineProps({
  events:    Array,
  councilId: String,
});

const emit = defineEmits(['advance-status', 'delete-event', 'view-registrations']);

const statusClass = s => ({
  Upcoming:  'badge-upcoming',
  Live:      'badge-live',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled',
}[s] || '');

const nextStatus = s => ({ Upcoming: 'Live', Live: 'Completed' }[s]);
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="tab-toolbar">
      <span class="count-label">{{ events.length }} event{{ events.length !== 1 ? 's' : '' }}</span>
      <a :href="`/councils/${councilId}/dashboard/events/create`" class="btn-primary">
        <i class="fa-solid fa-plus"></i> New Event
      </a>
    </div>

    <!-- Table -->
    <div class="panel p0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Type</th>
            <th>Date</th>
            <th>Status</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!events.length">
            <td colspan="5" class="empty-cell">No events yet — create your first!</td>
          </tr>
          <tr v-for="event in events" :key="event.id">
            <td>
              <div class="cell-primary">{{ event.title }}</div>
              <div class="cell-sub">{{ event.description?.slice(0, 50) || '—' }}</div>
            </td>
            <td><span class="tag">{{ event.event_type }}</span></td>
            <td class="cell-sub">{{ new Date(event.start_time).toLocaleDateString() }}</td>
            <td><span class="badge" :class="statusClass(event.status)">{{ event.status }}</span></td>
            <td class="right">
              <div class="action-btns">
                <button
                  v-if="nextStatus(event.status)"
                  class="action-btn advance"
                  :title="`→ ${nextStatus(event.status)}`"
                  @click="emit('advance-status', event)"
                >
                  <i class="fa-solid fa-circle-play"></i>
                </button>
                <button
                  class="action-btn"
                  title="Registrations"
                  @click="emit('view-registrations', event)"
                >
                  <i class="fa-solid fa-users"></i>
                </button>
                <a
                  v-if="event.status === 'Upcoming'"
                  :href="`/councils/${councilId}/dashboard/events/${event.id}/edit`"
                  class="action-btn"
                  title="Edit"
                >
                  <i class="fa-solid fa-pen"></i>
                </a>
                <button
                  class="action-btn danger"
                  title="Delete"
                  @click="emit('delete-event', event)"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.count-label {
  font-size: 11px;
  color: var(--text-faint);
  font-weight: 600;
  letter-spacing: 0.04em;
}
</style>