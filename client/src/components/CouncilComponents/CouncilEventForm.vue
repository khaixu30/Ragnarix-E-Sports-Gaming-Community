<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  councilId:   String,
  eventData:   Object,   // null = create mode; object = edit mode
  loading:     Boolean,
  error:       String,
  success:     String,
});

const emit = defineEmits(['submit', 'cancel']);

const defaultForm = () => ({
  title:                 '',
  description:           '',
  event_type:            'Solo',
  team_size:             null,
  game_id:               '',
  registration_fee:      0,
  prize_pool:            0,
  start_time:            '',
  end_time:              '',
  registration_deadline: '',
});

const form = ref(defaultForm());

watch(() => props.eventData, (data) => {
  if (data) {
    const fmt = (d) => d ? new Date(d).toISOString().slice(0,16) : '';
    form.value = {
      title:                 data.title || '',
      description:           data.description || '',
      event_type:            data.event_type || 'Solo',
      team_size:             data.team_size || null,
      game_id:               data.game_id || '',
      registration_fee:      data.registration_fee || 0,
      prize_pool:            data.prize_pool || 0,
      start_time:            fmt(data.start_time),
      end_time:              fmt(data.end_time),
      registration_deadline: fmt(data.registration_deadline),
    };
  }
}, { immediate: true });

const handleSubmit = () => {
  const payload = {
    ...form.value,
    council_id:        props.councilId,
    team_size:         form.value.event_type === 'Team' ? (form.value.team_size || null) : null,
    game_id:           form.value.game_id || null,
    registration_fee:  Number(form.value.registration_fee),
    prize_pool:        Number(form.value.prize_pool),
  };
  emit('submit', payload);
};
</script>

<template>
  <div class="event-form-wrap">
    <div class="form-header-bar">
      <div>
        <div class="page-eyebrow"><i class="fa-solid fa-calendar-plus"></i> {{ eventData ? 'Edit Event' : 'New Event' }}</div>
        <h2 class="form-title">{{ eventData ? 'Update Event Details' : 'Create a New Event' }}</h2>
      </div>
      <button class="btn-ghost" @click="emit('cancel')">
        <i class="fa-solid fa-arrow-left"></i> Back
      </button>
    </div>

    <div v-if="error" class="alert alert-error" style="margin-bottom:16px">
      <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
    </div>
    <div v-if="success" class="alert alert-success" style="margin-bottom:16px">
      <i class="fa-solid fa-circle-check"></i> {{ success }}
    </div>

    <div class="panel">
      <div class="form-grid">
        <!-- Title -->
        <div class="field">
          <label>Event Title <span class="required">*</span></label>
          <input v-model="form.title" type="text" placeholder="e.g. Valorant Summer Cup" maxlength="120" />
        </div>

        <!-- Description -->
        <div class="field">
          <label>Description <span class="optional">optional</span></label>
          <textarea v-model="form.description" rows="3" placeholder="Describe the event…"></textarea>
        </div>

        <div class="form-row">
          <!-- Type -->
          <div class="field">
            <label>Event Type <span class="required">*</span></label>
            <select v-model="form.event_type">
              <option>Solo</option>
              <option>Team</option>
              <option>Duo</option>
              <option>Squad</option>
            </select>
          </div>

          <!-- Team size (conditional) -->
          <div class="field">
            <label>Team Size <span class="optional">optional</span></label>
            <input
              v-model.number="form.team_size"
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 5"
              :disabled="form.event_type === 'Solo'"
            />
          </div>
        </div>

        <!-- Game ID -->
        <div class="field">
          <label>Game ID <span class="optional">optional</span></label>
          <input v-model="form.game_id" type="text" placeholder="UUID of the game (if applicable)" />
        </div>

        <div class="form-row">
          <!-- Registration fee -->
          <div class="field">
            <label>Registration Fee</label>
            <input v-model.number="form.registration_fee" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>

          <!-- Prize pool -->
          <div class="field">
            <label>Prize Pool</label>
            <input v-model.number="form.prize_pool" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>

        <div class="form-row">
          <!-- Start -->
          <div class="field">
            <label>Start Time <span class="required">*</span></label>
            <input v-model="form.start_time" type="datetime-local" />
          </div>

          <!-- End -->
          <div class="field">
            <label>End Time <span class="required">*</span></label>
            <input v-model="form.end_time" type="datetime-local" />
          </div>
        </div>

        <!-- Registration deadline -->
        <div class="field">
          <label>Registration Deadline <span class="required">*</span></label>
          <input v-model="form.registration_deadline" type="datetime-local" />
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button class="btn-ghost" @click="emit('cancel')">Cancel</button>
          <button class="btn-primary" :disabled="loading" @click="handleSubmit">
            <span v-if="loading" class="spinner-sm"></span>
            <i v-else class="fa-solid fa-check"></i>
            {{ loading ? (eventData ? 'Updating…' : 'Creating…') : (eventData ? 'Update Event' : 'Create Event') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-form-wrap { display: flex; flex-direction: column; gap: 18px; }

.form-header-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.form-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
}
</style>