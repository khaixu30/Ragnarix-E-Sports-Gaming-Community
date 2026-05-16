<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const props  = defineProps({ id: String }); // council id
const router = useRouter();

const BASE    = import.meta.env.VITE_HOST;
const loading = ref(false);
const error   = ref('');

const form = ref({
    title:                 '',
    description:           '',
    game_id:               '',
    event_type:            'Solo',
    team_size:             null,
    registration_fee:      0,
    prize_pool:            0,
    start_time:            '',
    end_time:              '',
    registration_deadline: '',
});

const submit = async () => {
    if (!form.value.title.trim()) { error.value = 'Title is required.'; return; }
    if (!form.value.start_time)   { error.value = 'Start time is required.'; return; }
    if (!form.value.end_time)     { error.value = 'End time is required.'; return; }

    loading.value = true;
    error.value   = '';

    try {
        const res = await fetch(`${BASE}/api/events`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                council_id:            props.id,
                game_id:               form.value.game_id    || null,
                title:                 form.value.title.trim(),
                description:           form.value.description.trim() || null,
                event_type:            form.value.event_type,
                team_size:             form.value.event_type === 'Team' ? Number(form.value.team_size) : null,
                registration_fee:      Number(form.value.registration_fee),
                prize_pool:            Number(form.value.prize_pool),
                start_time:            form.value.start_time,
                end_time:              form.value.end_time,
                registration_deadline: form.value.registration_deadline || null,
            }),
        });

        const json = await res.json();

        if (!json.success) {
            error.value = json.message || 'Failed to create event.';
            return;
        }

        router.push({ name: 'council-dashboard', params: { id: props.id } });

    } catch (err) {
        console.error(err);
        error.value = 'Network error. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="page">
        <div class="back-row">
            <button class="back-link" @click="router.push({ name: 'council-dashboard', params: { id } })">
                <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
            </button>
        </div>

        <div class="form-card">
            <div class="form-header">
                <div class="form-icon"><i class="fa-solid fa-calendar-plus"></i></div>
                <div>
                    <h1 class="form-title">Create Event</h1>
                    <p class="form-sub">Set up a new tournament or competition</p>
                </div>
            </div>

            <div class="form-body">
                <div class="form-row">
                    <div class="field flex2">
                        <label>Title <span class="req">*</span></label>
                        <input v-model="form.title" type="text" placeholder="e.g. FragMint Open Season 3" />
                    </div>
                    <div class="field">
                        <label>Game ID</label>
                        <input v-model="form.game_id" type="text" placeholder="UUID" />
                    </div>
                </div>

                <div class="field">
                    <label>Description</label>
                    <textarea v-model="form.description" rows="3" placeholder="Describe the event…"></textarea>
                </div>

                <div class="form-row">
                    <div class="field">
                        <label>Event Type</label>
                        <select v-model="form.event_type">
                            <option>Solo</option>
                            <option>Team</option>
                            <option>Duo</option>
                        </select>
                    </div>
                    <div class="field" v-if="form.event_type === 'Team'">
                        <label>Team Size</label>
                        <input v-model.number="form.team_size" type="number" min="2" placeholder="5" />
                    </div>
                    <div class="field">
                        <label>Registration Fee ($)</label>
                        <input v-model.number="form.registration_fee" type="number" min="0" step="0.01" />
                    </div>
                    <div class="field">
                        <label>Prize Pool ($)</label>
                        <input v-model.number="form.prize_pool" type="number" min="0" step="0.01" />
                    </div>
                </div>

                <div class="form-row">
                    <div class="field">
                        <label>Start Time <span class="req">*</span></label>
                        <input v-model="form.start_time" type="datetime-local" />
                    </div>
                    <div class="field">
                        <label>End Time <span class="req">*</span></label>
                        <input v-model="form.end_time" type="datetime-local" />
                    </div>
                    <div class="field">
                        <label>Registration Deadline</label>
                        <input v-model="form.registration_deadline" type="datetime-local" />
                    </div>
                </div>

                <p v-if="error" class="form-error">
                    <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
                </p>

                <div class="form-actions">
                    <button type="button" class="btn-ghost"
                        @click="router.push({ name: 'council-dashboard', params: { id } })">Cancel</button>
                    <button class="btn-primary" :disabled="loading" @click="submit">
                        <span v-if="loading" class="spinner-sm"></span>
                        <i v-else class="fa-solid fa-check"></i>
                        {{ loading ? 'Creating…' : 'Create Event' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page { padding: 32px; max-width: 700px; }
.back-link {
    display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
    color: var(--text-color); opacity: 0.5; background: none; border: none; cursor: pointer;
    margin-bottom: 24px; transition: opacity 0.2s; padding: 0;
}
.back-link:hover { opacity: 1; }
.form-card { border-radius: 14px; border: 1px solid rgba(188,103,33,0.15); background: rgba(188,103,33,0.03); overflow: hidden; }
.form-header { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 1px solid rgba(188,103,33,0.1); }
.form-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(188,103,33,0.15); display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 18px; }
.form-title { font-size: 17px; font-weight: 800; color: var(--text-color); margin-bottom: 2px; }
.form-sub { font-size: 12px; color: var(--text-color); opacity: 0.45; }
.form-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 14px; flex-wrap: wrap; }
.form-row .field { flex: 1; min-width: 140px; }
.form-row .field.flex2 { flex: 2; }
.field { display: flex; flex-direction: column; gap: 7px; }
.field label { font-size: 11px; font-weight: 700; color: var(--text-color); opacity: 0.55; letter-spacing: 0.03em; }
.req { color: var(--primary-color); }
.field input, .field textarea, .field select {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(188,103,33,0.2); border-radius: 9px;
    padding: 9px 12px; font-size: 13px; font-weight: 500; color: var(--text-color);
    outline: none; resize: vertical; width: 100%; transition: border-color 0.2s;
}
.field input:focus, .field textarea:focus, .field select:focus { border-color: var(--primary-color); }
.form-error {
    display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #ff6b6b;
    padding: 10px 14px; border-radius: 8px; background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2);
}
.form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
.btn-ghost {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 9px;
    font-size: 13px; font-weight: 700; background: none; color: var(--text-color);
    border: 1px solid rgba(188,103,33,0.15); cursor: pointer; opacity: 0.55; transition: opacity 0.2s;
}
.btn-ghost:hover { opacity: 1; }
.btn-primary {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 9px;
    font-size: 13px; font-weight: 700; background: var(--primary-color); color: #fff;
    border: none; cursor: pointer; transition: opacity 0.2s;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }
.spinner-sm { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>