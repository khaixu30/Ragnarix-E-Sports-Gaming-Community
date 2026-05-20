<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props  = defineProps({ id: String });
const router = useRouter();
const route = useRoute();

const BASE    = import.meta.env.VITE_HOST;
const loading = ref(false);
const error   = ref('');
const step    = ref(1); // 1 = basics, 2 = timing, 3 = review
const councilId = route.params.council_id

// --- Game picker ---
const games = ref([]);
const gameSearch  = ref('');
const showPicker  = ref(false);
const selectedGame = ref(null);

const fetchGames = async () => {
    loading.value = true;
    try{
        const response = await fetch(`${BASE}/api/game/`, {
            method: 'GET'
        });

        const responseData = await response.json();
        games.value = responseData.data
    }catch(err){
        console.log(err)
    }
    loading.value = false;
}

const filteredGames = computed(() =>
    games.value.filter(g =>
        g.name.toLowerCase().includes(gameSearch.value.toLowerCase()) ||
        g.genre.toLowerCase().includes(gameSearch.value.toLowerCase())
    )
);

const pickGame = (g) => {
    selectedGame.value = g;
    showPicker.value   = false;
    gameSearch.value   = '';
};

// --- Form ---
const form = ref({
    title:                 '',
    description:           '',
    event_type:            'Solo',
    team_size:             null,
    registration_fee:      0,
    prize_pool:            0,
    start_time:            '',
    end_time:              '',
    registration_deadline: '',
});

const stepOneValid = computed(() =>
    form.value.title.trim().length > 0
);

const stepTwoValid = computed(() =>
    form.value.start_time && form.value.end_time
);

const goNext = () => {
    error.value = '';
    if (step.value === 1 && !stepOneValid.value) { error.value = 'Event title is required.'; return; }
    if (step.value === 2 && !stepTwoValid.value) { error.value = 'Start and end times are required.'; return; }
    step.value++;
};

const goBack = () => { error.value = ''; step.value--; };

const submit = async () => {
    loading.value = true;
    error.value   = '';
    try {

        // console.log(councilId)
        const res = await fetch(`${BASE}/api/event`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                council_id:            councilId,
                game_id:               selectedGame.value?.id || null,
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
        if (!json.success) { error.value = json.message || 'Failed to create event.'; return; }
        router.push(`/councils/${councilId}/dashboard`);
    } catch (err) {
        console.error(err);
        error.value = 'Network error. Please try again.';
    } finally {
        loading.value = false;
    }
};

const fmtDate = (v) => v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
onMounted(async () => {
    await fetchGames();
})
</script>

<template>
    <div class="ce-page" @click.self="showPicker = false">
        <!-- Back -->
        <button class="ce-back" @click="router.push(`/councils/${councilId}/dashboard`)">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Dashboard
        </button>

        <!-- Header -->
        <div class="ce-header">
            <div class="ce-eyebrow">NEW EVENT</div>
            <h1 class="ce-heading">Create <em>Tournament</em></h1>
        </div>

        <!-- Steps indicator -->
        <div class="ce-steps">
            <div class="ce-step" :class="{ active: step >= 1, done: step > 1 }">
                <div class="ce-step-num">{{ step > 1 ? '✓' : '01' }}</div>
                <span>Basics</span>
            </div>
            <div class="ce-step-line" :class="{ active: step > 1 }"></div>
            <div class="ce-step" :class="{ active: step >= 2, done: step > 2 }">
                <div class="ce-step-num">{{ step > 2 ? '✓' : '02' }}</div>
                <span>Timing</span>
            </div>
            <div class="ce-step-line" :class="{ active: step > 2 }"></div>
            <div class="ce-step" :class="{ active: step >= 3 }">
                <div class="ce-step-num">03</div>
                <span>Review</span>
            </div>
        </div>

        <!-- ── STEP 1: Basics ── -->
        <Transition name="slide" mode="out-in">
        <div v-if="step === 1" class="ce-panel" key="step1">
            <div class="ce-panel-label">Event Identity</div>

            <!-- Title -->
            <div class="ce-field">
                <label class="ce-label">Event Title <span class="req">*</span></label>
                <input class="ce-input" v-model="form.title" type="text" placeholder="e.g. FragMint Open Season 3" />
            </div>

            <!-- Description -->
            <div class="ce-field">
                <label class="ce-label">Description</label>
                <textarea class="ce-input ce-textarea" v-model="form.description" rows="3" placeholder="What's this event about…"></textarea>
            </div>

            <!-- Game Picker -->
            <div class="ce-field">
                <label class="ce-label">Game</label>
                <div class="ce-game-trigger" @click="showPicker = !showPicker">
                    <template v-if="selectedGame">
                        <span class="ce-game-icon">{{ selectedGame.icon }}</span>
                        <span class="ce-game-name">{{ selectedGame.name }}</span>
                        <span class="ce-game-genre">{{ selectedGame.genre }}</span>
                    </template>
                    <template v-else>
                        <span class="ce-game-placeholder">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            Select a game…
                        </span>
                    </template>
                    <svg class="ce-chevron" :class="{ open: showPicker }" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
                </div>

                <!-- Dropdown -->
                <Transition name="drop">
                <div v-if="showPicker" class="ce-game-dropdown" @click.stop>
                    <input class="ce-game-search" v-model="gameSearch" placeholder="Search games…" autofocus />
                    <div class="ce-game-list">
                        <div v-for="g in filteredGames" :key="g.id"
                             class="ce-game-item" :class="{ selected: selectedGame?.id === g.id }"
                             @click="pickGame(g)">
                            <span class="ce-game-item-icon">{{ g.icon }}</span>
                            <div class="ce-game-item-info">
                                <span class="ce-game-item-name">{{ g.name }}</span>
                                <span class="ce-game-item-genre">{{ g.genre }}</span>
                            </div>
                            <svg v-if="selectedGame?.id === g.id" class="ce-check" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <div v-if="filteredGames.length === 0" class="ce-game-empty">No games found</div>
                    </div>
                </div>
                </Transition>
            </div>

            <!-- Type row -->
            <div class="ce-field-row">
                <div class="ce-field">
                    <label class="ce-label">Format</label>
                    <div class="ce-type-group">
                        <button v-for="t in ['Solo','Duo','Team']" :key="t"
                                class="ce-type-btn" :class="{ active: form.event_type === t }"
                                type="button" @click="form.event_type = t">{{ t }}</button>
                    </div>
                </div>
                <div class="ce-field" v-if="form.event_type === 'Team'">
                    <label class="ce-label">Team Size</label>
                    <input class="ce-input ce-input-sm" v-model.number="form.team_size" type="number" min="2" placeholder="5" />
                </div>
            </div>

            <!-- Prize row -->
            <div class="ce-field-row">
                <div class="ce-field">
                    <label class="ce-label">Registration Fee</label>
                    <div class="ce-input-addon">
                        <span class="ce-addon">$</span>
                        <input class="ce-input ce-input-addonned" v-model.number="form.registration_fee" type="number" min="0" step="0.01" />
                    </div>
                </div>
                <div class="ce-field">
                    <label class="ce-label">Prize Pool</label>
                    <div class="ce-input-addon">
                        <span class="ce-addon">$</span>
                        <input class="ce-input ce-input-addonned" v-model.number="form.prize_pool" type="number" min="0" step="0.01" />
                    </div>
                </div>
            </div>

            <p v-if="error" class="ce-error"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {{ error }}</p>

            <div class="ce-actions">
                <button class="ce-btn-ghost" type="button"
                    @click="router.push({ name: 'council-dashboard', params: { id } })">Cancel</button>
                <button class="ce-btn-primary" type="button" @click="goNext">
                    Continue <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
        </div>
        </Transition>

        <!-- ── STEP 2: Timing ── -->
        <Transition name="slide" mode="out-in">
        <div v-if="step === 2" class="ce-panel" key="step2">
            <div class="ce-panel-label">Schedule</div>

            <div class="ce-time-grid">
                <div class="ce-field">
                    <label class="ce-label">Start Time <span class="req">*</span></label>
                    <input class="ce-input" v-model="form.start_time" type="datetime-local" />
                </div>
                <div class="ce-field">
                    <label class="ce-label">End Time <span class="req">*</span></label>
                    <input class="ce-input" v-model="form.end_time" type="datetime-local" />
                </div>
                <div class="ce-field ce-span2">
                    <label class="ce-label">Registration Deadline <span class="opt">(optional)</span></label>
                    <input class="ce-input" v-model="form.registration_deadline" type="datetime-local" />
                </div>
            </div>

            <!-- Duration visual hint -->
            <div v-if="form.start_time && form.end_time" class="ce-duration-hint">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Event runs for
                <strong>
                    {{
                        (() => {
                            const diff = (new Date(form.end_time) - new Date(form.start_time)) / 60000;
                            if (diff <= 0) return '—';
                            if (diff < 60) return `${diff}m`;
                            return `${Math.floor(diff/60)}h ${diff%60 > 0 ? diff%60 + 'm' : ''}`.trim();
                        })()
                    }}
                </strong>
            </div>

            <p v-if="error" class="ce-error"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {{ error }}</p>

            <div class="ce-actions">
                <button class="ce-btn-ghost" type="button" @click="goBack">← Back</button>
                <button class="ce-btn-primary" type="button" @click="goNext">
                    Review <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
        </div>
        </Transition>

        <!-- ── STEP 3: Review ── -->
        <Transition name="slide" mode="out-in">
        <div v-if="step === 3" class="ce-panel" key="step3">
            <div class="ce-panel-label">Confirm Details</div>

            <div class="ce-review-grid">
                <div class="ce-review-item ce-review-wide">
                    <span class="ce-review-key">Title</span>
                    <span class="ce-review-val ce-review-title">{{ form.title }}</span>
                </div>
                <div class="ce-review-item">
                    <span class="ce-review-key">Game</span>
                    <span class="ce-review-val">
                        <template v-if="selectedGame">{{ selectedGame.icon }} {{ selectedGame.name }}</template>
                        <span v-else class="ce-review-none">None</span>
                    </span>
                </div>
                <div class="ce-review-item">
                    <span class="ce-review-key">Format</span>
                    <span class="ce-review-val">{{ form.event_type }}{{ form.event_type === 'Team' && form.team_size ? ` · ${form.team_size}v${form.team_size}` : '' }}</span>
                </div>
                <div class="ce-review-item">
                    <span class="ce-review-key">Entry Fee</span>
                    <span class="ce-review-val">${{ form.registration_fee || 0 }}</span>
                </div>
                <div class="ce-review-item">
                    <span class="ce-review-key">Prize Pool</span>
                    <span class="ce-review-val ce-prize">${{ form.prize_pool || 0 }}</span>
                </div>
                <div class="ce-review-item">
                    <span class="ce-review-key">Starts</span>
                    <span class="ce-review-val">{{ fmtDate(form.start_time) }}</span>
                </div>
                <div class="ce-review-item">
                    <span class="ce-review-key">Ends</span>
                    <span class="ce-review-val">{{ fmtDate(form.end_time) }}</span>
                </div>
                <div v-if="form.registration_deadline" class="ce-review-item ce-review-wide">
                    <span class="ce-review-key">Registration Closes</span>
                    <span class="ce-review-val">{{ fmtDate(form.registration_deadline) }}</span>
                </div>
                <div v-if="form.description" class="ce-review-item ce-review-wide">
                    <span class="ce-review-key">Description</span>
                    <span class="ce-review-val ce-review-desc">{{ form.description }}</span>
                </div>
            </div>

            <p v-if="error" class="ce-error"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {{ error }}</p>

            <div class="ce-actions">
                <button class="ce-btn-ghost" type="button" @click="goBack">← Back</button>
                <button class="ce-btn-launch" :disabled="loading" @click="submit">
                    <span v-if="loading" class="ce-spinner"></span>
                    <svg v-else width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {{ loading ? 'Launching…' : 'Launch Event' }}
                </button>
            </div>
        </div>
        </Transition>
    </div>
</template>

<style scoped>

/* ── Page ── */
.ce-page {
    min-height: 100vh;
    padding: 36px 32px 64px;
    margin: auto;
    max-width: 580px;
}

/* ── Back ── */
.ce-back {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    color: var(--text-color, #ccc); opacity: 0.4;
    font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0; margin-bottom: 36px; transition: opacity 0.2s;
}
.ce-back:hover { opacity: 1; }

/* ── Header ── */
.ce-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: 0.2em;
    color: var(--primary-color, #BC6721); margin-bottom: 6px;
}
.ce-heading {
    font-size: 52px; line-height: 1; letter-spacing: 0.02em;
    color: var(--text-color, #fff); margin: 0 0 32px;
}
.ce-heading em { color: var(--primary-color, #BC6721); font-style: normal; }

/* ── Steps ── */
.ce-steps {
    display: flex; align-items: center; gap: 0;
    margin-bottom: 32px;
}
.ce-step {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.05em;
    color: var(--text-color, #fff); opacity: 0.3;
    transition: opacity 0.3s;
}
.ce-step.active { opacity: 1; }
.ce-step.done { opacity: 0.6; }
.ce-step-num {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid currentColor;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
    transition: background 0.3s, color 0.3s;
}
.ce-step.active .ce-step-num {
    background: var(--primary-color, #BC6721);
    border-color: var(--primary-color, #BC6721);
    color: #fff;
}
.ce-step.done .ce-step-num {
    background: rgba(188,103,33,0.2);
    border-color: var(--primary-color, #BC6721);
    color: var(--primary-color, #BC6721);
}
.ce-step-line {
    flex: 1; height: 1px;
    background: rgba(255,255,255,0.1);
    margin: 0 12px;
    position: relative;
    overflow: hidden;
}
.ce-step-line::after {
    content: '';
    position: absolute; inset: 0;
    background: var(--primary-color, #BC6721);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s ease;
}
.ce-step-line.active::after { transform: scaleX(1); }

/* ── Panel ── */
.ce-panel {
    display: flex; flex-direction: column; gap: 20px;
}
.ce-panel-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--primary-color, #BC6721); margin-bottom: -4px;
}

/* ── Fields ── */
.ce-field { display: flex; flex-direction: column; gap: 8px; }
.ce-field-row { display: flex; gap: 16px; flex-wrap: wrap; }
.ce-field-row .ce-field { flex: 1; min-width: 140px; }
.ce-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--text-color, #fff); opacity: 0.45;
}
.req { color: var(--primary-color, #BC6721); }
.opt { opacity: 0.5; font-weight: 500; text-transform: none; letter-spacing: 0; }

.ce-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 14px; font-weight: 500;
    color: var(--text-color, #fff);
    outline: none; width: 100%;
    transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box;
}
.ce-input:focus {
    border-color: var(--primary-color, #BC6721);
    background: rgba(188,103,33,0.06);
}
.ce-input::placeholder { opacity: 0.3; }
.ce-textarea { resize: vertical; min-height: 80px; }
.ce-input-sm { max-width: 100px; }

/* Addon wrapper */
.ce-input-addon { position: relative; display: flex; align-items: center; }
.ce-addon {
    position: absolute; left: 13px;
    font-size: 13px; font-weight: 700;
    color: var(--text-color, #fff); opacity: 0.35;
    pointer-events: none;
}
.ce-input-addonned { padding-left: 26px !important; }

/* ── Type buttons ── */
.ce-type-group { display: flex; gap: 6px; }
.ce-type-btn {
    flex: 1; padding: 9px 0; border-radius: 9px;
    font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-color, #fff); opacity: 0.45;
    cursor: pointer; transition: all 0.18s;
}
.ce-type-btn:hover { opacity: 0.8; }
.ce-type-btn.active {
    background: var(--primary-color, #BC6721);
    border-color: var(--primary-color, #BC6721);
    color: #fff; opacity: 1;
}

/* ── Game Picker ── */
.ce-game-trigger {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 10px 14px;
    cursor: pointer; transition: border-color 0.2s;
    min-height: 44px;
}
.ce-game-trigger:hover { border-color: var(--primary-color, #BC6721); }
.ce-game-icon { font-size: 18px; line-height: 1; }
.ce-game-name { font-size: 14px; font-weight: 700; color: var(--text-color, #fff); }
.ce-game-genre {
    font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
    color: var(--primary-color, #BC6721); opacity: 0.8;
    background: rgba(188,103,33,0.12); padding: 2px 7px; border-radius: 20px;
}
.ce-game-placeholder {
    display: flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 500;
    color: var(--text-color, #fff); opacity: 0.3;
}
.ce-chevron {
    margin-left: auto; color: var(--text-color, #fff); opacity: 0.3;
    transition: transform 0.2s;
}
.ce-chevron.open { transform: rotate(180deg); }

.ce-game-dropdown {
    margin-top: 6px;
    background: var(--bg-color, #1a1a1a);
    border: 1px solid rgba(188,103,33,0.25);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    z-index: 50; position: relative;
}
.ce-game-search {
    width: 100%; padding: 12px 16px; box-sizing: border-box;
    background: rgba(255,255,255,0.05);
    border: none; border-bottom: 1px solid rgba(255,255,255,0.07);
    font-size: 13px; color: var(--text-color, #fff);
    outline: none;
}
.ce-game-search::placeholder { opacity: 0.35; }
.ce-game-list { max-height: 220px; overflow-y: auto; }
.ce-game-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 16px; cursor: pointer;
    transition: background 0.15s;
}
.ce-game-item:hover { background: rgba(188,103,33,0.08); }
.ce-game-item.selected { background: rgba(188,103,33,0.12); }
.ce-game-item-icon { font-size: 20px; line-height: 1; }
.ce-game-item-info { display: flex; flex-direction: column; gap: 2px; }
.ce-game-item-name { font-size: 13px; font-weight: 700; color: var(--text-color, #fff); }
.ce-game-item-genre { font-size: 11px; color: var(--text-color, #fff); opacity: 0.4; }
.ce-check { margin-left: auto; color: var(--primary-color, #BC6721); }
.ce-game-empty { padding: 20px; text-align: center; font-size: 13px; opacity: 0.4; color: var(--text-color, #fff); }

/* ── Timing ── */
.ce-time-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
.ce-span2 { grid-column: span 2; }

.ce-duration-hint {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 600;
    color: var(--text-color, #fff); opacity: 0.5;
    padding: 10px 14px;
    background: rgba(255,255,255,0.04);
    border-radius: 8px; border: 1px solid rgba(255,255,255,0.07);
}
.ce-duration-hint strong { color: var(--primary-color, #BC6721); opacity: 1; font-weight: 800; }

/* ── Review ── */
.ce-review-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
    background: rgba(255,255,255,0.06);
    border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.07);
}
.ce-review-item {
    background: rgba(255,255,255,0.02);
    padding: 14px 18px;
    display: flex; flex-direction: column; gap: 5px;
}
.ce-review-wide { grid-column: span 2; }
.ce-review-key {
    font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-color, #fff); opacity: 0.35;
}
.ce-review-val { font-size: 14px; font-weight: 600; color: var(--text-color, #fff); }
.ce-review-title { font-size: 22px; letter-spacing: 0.05em; }
.ce-prize { color: #4ade80; }
.ce-review-none { opacity: 0.35; }
.ce-review-desc { font-size: 13px; opacity: 0.7; line-height: 1.5; }

/* ── Error ── */
.ce-error {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 600; color: #f87171;
    padding: 11px 14px; border-radius: 9px;
    background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
    margin: 0;
}

/* ── Actions ── */
.ce-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; }
.ce-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 20px; border-radius: 10px;
    font-size: 13px; font-weight: 700;
    background: none; border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-color, #fff); opacity: 0.5;
    cursor: pointer; transition: opacity 0.2s;
}
.ce-btn-ghost:hover { opacity: 1; }
.ce-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 22px; border-radius: 10px;
    font-size: 13px; font-weight: 800; letter-spacing: 0.02em;
    background: var(--primary-color, #BC6721);
    border: none; color: #fff; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
}
.ce-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.ce-btn-launch {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 10px;
    font-size: 18px; letter-spacing: 0.08em;
    background: var(--primary-color, #BC6721);
    border: none; color: #fff; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 4px 24px rgba(188,103,33,0.35);
}
.ce-btn-launch:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.ce-btn-launch:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

/* ── Spinner ── */
.ce-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transitions ── */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from { opacity: 0; transform: translateX(18px); }
.slide-leave-to   { opacity: 0; transform: translateX(-18px); }

.drop-enter-active, .drop-leave-active { transition: all 0.18s ease; }
.drop-enter-from { opacity: 0; transform: translateY(-6px); }
.drop-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>