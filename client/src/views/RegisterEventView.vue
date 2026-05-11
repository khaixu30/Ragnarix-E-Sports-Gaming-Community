<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const event_id = route.params.id;

const step = ref(1); // 1 = event info, 2 = registration form, 3 = success
const loading = ref(false);
const eventLoading = ref(true);
const error = ref('');
const event = ref(null);
const user = ref(null);

// Team form
const teamName = ref('');
const memberUsernames = ref(['']); // list of username inputs for team members

const isTeamEvent = computed(() => event.value?.event_type === 'Team');
const isFree = computed(() => !event.value?.registration_fee || event.value.registration_fee == 0);

const formatDeadline = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });
};

const formatTime = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const addMember = () => {
    if (memberUsernames.value.length < (event.value?.team_size || 5) - 1) {
        memberUsernames.value.push('');
    }
};

const removeMember = (index) => {
    memberUsernames.value.splice(index, 1);
};

const fetch_event = async () => {
    eventLoading.value = true;
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/event/${event_id}`);
        console.log('Event response status:', response.status);
        console.log('Event URL hit:', `${import.meta.env.VITE_HOST}/api/event/${event_id}`);
        console.log('event_id from route:', event_id); // 👈 is this undefined?
        const json = await response.json();
        console.log('RAW event json:', json);
        if (!json.success) throw new Error(json.message);
        event.value = json.event;
    } catch (err) {
        error.value = `Failed to load event: ${err.message}`;
    } finally {
        eventLoading.value = false;
    }
};

const fetch_user = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const response = await fetch(`${import.meta.env.VITE_HOST}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();
        if (!json.success) { router.push('/login'); return; }
        user.value = json.data;
    } catch (err) {
        console.error('Auth error:', err);
        router.push('/login');
    }
};

const handleRegister = async () => {
    error.value = '';
    loading.value = true;

    try {
        const token = localStorage.getItem('token');

        // ── Solo registration ────────────────────────────────
        if (!isTeamEvent.value) {
            const response = await fetch(`${import.meta.env.VITE_HOST}/api/register/event/${event_id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            const json = await response.json();
            if (!json.success) throw new Error(json.message);
            step.value = 3;
            return;
        }

        // ── Team registration ────────────────────────────────
        if (!teamName.value.trim()) {
            error.value = 'Please enter a team name.';
            loading.value = false;
            return;
        }

        // Step 1: Create team — route is POST /api/team/event/:event_id
        const teamResponse = await fetch(`${import.meta.env.VITE_HOST}/api/team/event/${event_id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ team_name: teamName.value.trim() })
        });
        const teamJson = await teamResponse.json();
        console.log(teamResponse)
        if (!teamJson.success) throw new Error(teamJson.message);
        const team_id = teamJson.data.id;

        // Step 2: Add members — route is POST /api/team/:team_id/members with { username }
        const validMembers = memberUsernames.value.filter(u => u.trim() !== '');
        for (const username of validMembers) {
            const memberRes = await fetch(`${import.meta.env.VITE_HOST}/api/team/${team_id}/members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username.trim() })
            });
            const memberJson = await memberRes.json();
            if (!memberJson.success) throw new Error(memberJson.message);
        }

        // Step 3: Register team for event — route is POST /api/register/event/:event_id
        const regResponse = await fetch(`${import.meta.env.VITE_HOST}/api/register/event/${event_id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ team_id })
        });
        const regJson = await regResponse.json();
        if (!regJson.success) throw new Error(regJson.message);

        step.value = 3;

    } catch (err) {
        error.value = err.message || 'Registration failed. Please try again.';
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await Promise.all([fetch_event(), fetch_user()]);
});
</script>

<template>
    <div class="page">

        <!-- Loading -->
        <div v-if="eventLoading" class="full-state">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading event...
        </div>

        <!-- Error loading event -->
        <div v-else-if="error && !event" class="full-state error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
        </div>

        <template v-else-if="event">

            <!-- ── Step 3: Success ── -->
            <div v-if="step === 3" class="success-page">
                <div class="success-card">
                    <div class="success-icon">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <h1>You're <span>Registered!</span></h1>
                    <p>You have successfully registered for <strong>{{ event.title }}</strong>. Good luck!</p>
                    <div class="success-actions">
                        <a href="/dashboard/registrations" class="btn-primary">
                            <i class="fa-solid fa-clipboard"></i> View My Registrations
                        </a>
                        <a href="/events" class="btn-ghost">
                            <i class="fa-solid fa-calendar-days"></i> Browse More Events
                        </a>
                    </div>
                </div>
            </div>

            <!-- ── Step 1 & 2 ── -->
            <div v-else class="layout">

                <!-- Left: Event Info -->
                <div class="left">
                    <div class="event-img-wrap">
                        <img :src="event.gameData?.logo_url || event.logo_url" :alt="event.title" />
                        <div class="img-fade"></div>
                        <span class="status-pill" :class="event.status === 'Live' ? 'pill-live' : 'pill-upcoming'">
                            {{ event.status }}
                        </span>
                    </div>

                    <div class="event-info">
                        <p class="event-label"><i class="fa-solid fa-gamepad"></i> {{ event.game_name || 'Tournament' }}</p>
                        <h2>{{ event.title }}</h2>
                        <p class="event-desc">{{ event.description }}</p>

                        <div class="info-grid">
                            <div class="info-item">
                                <i class="fa-solid fa-users"></i>
                                <div>
                                    <p class="info-label">Type</p>
                                    <p class="info-val">{{ event.event_type }}{{ event.team_size ? ` · ${event.team_size} players` : '' }}</p>
                                </div>
                            </div>
                            <div class="info-item">
                                <i class="fa-solid fa-wallet"></i>
                                <div>
                                    <p class="info-label">Entry Fee</p>
                                    <p class="info-val" :class="isFree ? 'free' : ''">
                                        {{ isFree ? 'Free' : `$${event.registration_fee}` }}
                                    </p>
                                </div>
                            </div>
                            <div class="info-item">
                                <i class="fa-solid fa-trophy"></i>
                                <div>
                                    <p class="info-label">Prize Pool</p>
                                    <p class="info-val prize">
                                        {{ event.prize_pool > 0 ? `$${event.prize_pool}` : 'No Prize' }}
                                    </p>
                                </div>
                            </div>
                            <div class="info-item">
                                <i class="fa-solid fa-clock"></i>
                                <div>
                                    <p class="info-label">Starts</p>
                                    <p class="info-val">{{ formatTime(event.start_time) }}</p>
                                </div>
                            </div>
                            <div class="info-item">
                                <i class="fa-solid fa-flag-checkered"></i>
                                <div>
                                    <p class="info-label">Ends</p>
                                    <p class="info-val">{{ formatTime(event.end_time) }}</p>
                                </div>
                            </div>
                            <div class="info-item">
                                <i class="fa-solid fa-hourglass-half"></i>
                                <div>
                                    <p class="info-label">Deadline</p>
                                    <p class="info-val deadline">{{ formatDeadline(event.registration_deadline) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: Registration Form -->
                <div class="right">
                    <div class="form-wrap">

                        <!-- Steps indicator -->
                        <div class="steps">
                            <div class="step" :class="{ active: step >= 1, done: step > 1 }">
                                <div class="step-circle">
                                    <i v-if="step > 1" class="fa-solid fa-check"></i>
                                    <span v-else>1</span>
                                </div>
                                <p>Review</p>
                            </div>
                            <div class="step-line" :class="{ done: step > 1 }"></div>
                            <div class="step" :class="{ active: step >= 2 }">
                                <div class="step-circle">
                                    <span>2</span>
                                </div>
                                <p>Confirm</p>
                            </div>
                        </div>

                        <!-- ── Step 1: Review ── -->
                        <div v-if="step === 1" class="step-content">
                            <div class="form-header">
                                <p class="form-label"><i class="fa-solid fa-magnifying-glass"></i> Step 1</p>
                                <h3>Review & <span>Confirm</span></h3>
                                <p class="form-sub">Make sure the event details are correct before proceeding.</p>
                            </div>

                            <div class="review-card">
                                <div class="review-row">
                                    <span>Event</span>
                                    <span>{{ event.title }}</span>
                                </div>
                                <div class="review-row">
                                    <span>Type</span>
                                    <span>{{ event.event_type }}</span>
                                </div>
                                <div class="review-row">
                                    <span>Entry Fee</span>
                                    <span :class="isFree ? 'free' : 'fee'">
                                        {{ isFree ? 'Free' : `$${event.registration_fee}` }}
                                    </span>
                                </div>
                                <div class="review-row">
                                    <span>Registering As</span>
                                    <span>{{ user?.full_name || user?.username }}</span>
                                </div>
                                <div class="review-row">
                                    <span>Deadline</span>
                                    <span class="deadline">{{ formatDeadline(event.registration_deadline) }}</span>
                                </div>
                            </div>

                            <button class="btn-primary full" @click="step = 2">
                                Continue <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>

                        <!-- ── Step 2: Form ── -->
                        <div v-if="step === 2" class="step-content">
                            <div class="form-header">
                                <p class="form-label"><i class="fa-solid fa-file-signature"></i> Step 2</p>
                                <h3>
                                    <span v-if="isTeamEvent">Team <span class="highlight">Details</span></span>
                                    <span v-else>Solo <span class="highlight">Registration</span></span>
                                </h3>
                                <p class="form-sub">
                                    {{ isTeamEvent ? 'Create your team and invite members by username.' : 'You are registering as a solo player.' }}
                                </p>
                            </div>

                            <!-- Error -->
                            <div v-if="error" class="error-box">
                                <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
                            </div>

                            <!-- Solo: no form needed -->
                            <div v-if="!isTeamEvent" class="solo-info">
                                <div class="solo-player">
                                    <div class="player-avatar">
                                        {{ user?.full_name?.charAt(0) || '?' }}
                                    </div>
                                    <div>
                                        <p class="player-name">{{ user?.full_name || user?.username }}</p>
                                        <p class="player-tag">@{{ user?.username }}</p>
                                    </div>
                                </div>
                                <p class="solo-note">
                                    <i class="fa-solid fa-circle-info"></i>
                                    You will be registered as a solo participant under your account.
                                </p>
                            </div>

                            <!-- Team: form -->
                            <div v-else class="team-form">
                                <div class="field">
                                    <label>Team Name</label>
                                    <div class="input-wrap">
                                        <i class="fa-solid fa-shield-halved input-icon"></i>
                                        <input
                                            type="text"
                                            v-model="teamName"
                                            placeholder="e.g. Shadow Squad"
                                            maxlength="40"
                                        />
                                    </div>
                                </div>

                                <div class="field">
                                    <label>
                                        Team Members
                                        <span class="optional">
                                            {{ memberUsernames.length }} / {{ (event.team_size || 5) - 1 }} added
                                        </span>
                                    </label>

                                    <div class="members-list">
                                        <!-- Leader (you) -->
                                        <div class="member-row leader">
                                            <div class="input-wrap">
                                                <i class="fa-solid fa-crown input-icon" style="color:#ffd966;"></i>
                                                <input
                                                    type="text"
                                                    :value="user?.username"
                                                    disabled
                                                    placeholder="You (leader)"
                                                />
                                            </div>
                                        </div>

                                        <!-- Other members -->
                                        <div
                                            v-for="(member, index) in memberUsernames"
                                            :key="index"
                                            class="member-row"
                                        >
                                            <div class="input-wrap">
                                                <i class="fa-solid fa-user input-icon"></i>
                                                <input
                                                    type="text"
                                                    v-model="memberUsernames[index]"
                                                    :placeholder="`Member ${index + 1} username`"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                class="remove-btn"
                                                @click="removeMember(index)"
                                            >
                                                <i class="fa-solid fa-xmark"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        class="add-member-btn"
                                        @click="addMember"
                                        :disabled="memberUsernames.length >= (event.team_size || 5) - 1"
                                    >
                                        <i class="fa-solid fa-plus"></i> Add Member
                                    </button>
                                </div>
                            </div>

                            <!-- Payment notice -->
                            <div v-if="!isFree" class="payment-notice">
                                <i class="fa-solid fa-circle-info"></i>
                                A registration fee of <strong>${{ event.registration_fee }}</strong> is required.
                                Payment status will be set to <strong>Pending</strong> and processed separately.
                            </div>

                            <div class="form-actions">
                                <button class="btn-ghost" @click="step = 1">
                                    <i class="fa-solid fa-arrow-left"></i> Back
                                </button>
                                <button
                                    class="btn-primary"
                                    @click="handleRegister"
                                    :disabled="loading"
                                >
                                    <span v-if="!loading">
                                        <i class="fa-solid fa-bolt"></i>
                                        {{ isFree ? 'Register Now' : 'Register & Pay Later' }}
                                    </span>
                                    <span v-else>
                                        <i class="fa-solid fa-spinner fa-spin"></i> Registering...
                                    </span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </template>

    </div>
</template>

<style scoped>
.page {
    min-height: 100vh;
    background: #1a1410;
    color: var(--text-color);
}

/* ── Full state ── */
.full-state {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 15px;
    opacity: 0.5;
}

.full-state.error { color: #ff6b6b; opacity: 1; }

/* ── Layout ── */
.layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
}

/* ── Left ── */
.left {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.event-img-wrap {
    position: relative;
    height: 280px;
    flex-shrink: 0;
}

.event-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.img-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 30%, #1a1410 100%);
}

.status-pill {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 999px;
}

.pill-upcoming {
    background: rgba(188,103,33,0.25);
    border: 1px solid rgba(188,103,33,0.5);
    color: var(--hover-color);
}

.pill-live {
    background: rgba(80,200,120,0.2);
    border: 1px solid rgba(80,200,120,0.4);
    color: #7effa0;
}

.event-info {
    flex: 1;
    overflow-y: auto;
    padding: 0 40px 40px;
    scrollbar-width: none;
    border-right: 1px solid rgba(188,103,33,0.15);
}

.event-info::-webkit-scrollbar { display: none; }

.event-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--primary-color);
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.event-info h2 {
    font-size: 28px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 10px;
    line-height: 1.1;
}

.event-desc {
    font-size: 13px;
    opacity: 0.55;
    line-height: 1.7;
    margin-bottom: 24px;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.info-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: rgba(188,103,33,0.05);
    border: 1px solid rgba(188,103,33,0.12);
    border-radius: 10px;
    padding: 12px 14px;
}

.info-item i {
    color: var(--primary-color);
    font-size: 13px;
    margin-top: 2px;
    flex-shrink: 0;
}

.info-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.45;
    margin-bottom: 3px;
}

.info-val {
    font-size: 13px;
    font-weight: 700;
}

.info-val.free { color: #7effa0; }
.info-val.prize { color: #ffd966; }
.info-val.deadline { color: var(--hover-color); }

/* ── Right ── */
.right {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 40px;
    background: var(--bg-color);
    overflow-y: auto;
}

.form-wrap {
    width: 100%;
    max-width: 460px;
    display: flex;
    flex-direction: column;
    gap: 28px;
}

/* ── Steps ── */
.steps {
    display: flex;
    align-items: center;
    gap: 0;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.step-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.3);
    transition: all 0.3s;
}

.step.active .step-circle {
    border-color: var(--primary-color);
    background: rgba(188,103,33,0.15);
    color: var(--primary-color);
}

.step.done .step-circle {
    border-color: #7effa0;
    background: rgba(80,200,120,0.15);
    color: #7effa0;
}

.step p {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.4;
}

.step.active p { opacity: 1; color: var(--primary-color); }
.step.done p { opacity: 1; color: #7effa0; }

.step-line {
    flex: 1;
    height: 2px;
    background: rgba(255,255,255,0.08);
    margin: 0 12px;
    margin-bottom: 22px;
    transition: background 0.3s;
}

.step-line.done { background: rgba(80,200,120,0.4); }

/* ── Step content ── */
.step-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-header { display: flex; flex-direction: column; gap: 8px; }

.form-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--primary-color);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-wrap h3 {
    font-size: 24px;
    font-weight: 900;
    text-transform: uppercase;
}

.highlight { color: var(--primary-color); }

.form-sub { font-size: 13px; opacity: 0.5; }

/* ── Review card ── */
.review-card {
    background: rgba(188,103,33,0.05);
    border: 1px solid rgba(188,103,33,0.15);
    border-radius: 12px;
    overflow: hidden;
}

.review-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 13px;
}

.review-row:last-child { border-bottom: none; }
.review-row span:first-child { opacity: 0.5; }
.review-row span:last-child { font-weight: 700; }
.review-row .free { color: #7effa0; }
.review-row .fee { color: var(--hover-color); }
.review-row .deadline { color: var(--hover-color); }

/* ── Solo info ── */
.solo-info {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.solo-player {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(188,103,33,0.06);
    border: 1px solid rgba(188,103,33,0.2);
    border-radius: 10px;
    padding: 14px 16px;
}

.player-avatar {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 900;
    color: #fff;
    flex-shrink: 0;
}

.player-name { font-size: 14px; font-weight: 700; }
.player-tag { font-size: 11px; opacity: 0.45; margin-top: 2px; }

.solo-note {
    font-size: 12px;
    opacity: 0.5;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.6;
}

.solo-note i { color: var(--primary-color); margin-top: 2px; flex-shrink: 0; }

/* ── Team form ── */
.team-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 8px; }

label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.65;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.optional { font-size: 9px; opacity: 0.4; font-weight: 400; }

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 13px;
    font-size: 12px;
    color: var(--primary-color);
    opacity: 0.7;
    pointer-events: none;
}

.input-wrap input {
    width: 100%;
    padding: 11px 14px 11px 38px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
}

.input-wrap input:focus {
    border-color: var(--primary-color);
    background: rgba(188,103,33,0.06);
}

.input-wrap input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.input-wrap input::placeholder { opacity: 0.3; }

.members-list { display: flex; flex-direction: column; gap: 8px; }

.member-row { display: flex; align-items: center; gap: 8px; }
.member-row .input-wrap { flex: 1; }

.remove-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid rgba(255,107,107,0.2);
    background: rgba(255,107,107,0.06);
    color: #ff6b6b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;
}

.remove-btn:hover {
    background: rgba(255,107,107,0.15);
    border-color: rgba(255,107,107,0.4);
}

.add-member-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    border-radius: 9px;
    border: 1px dashed rgba(188,103,33,0.3);
    background: transparent;
    color: var(--primary-color);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    width: 100%;
    justify-content: center;
}

.add-member-btn:hover:not(:disabled) {
    background: rgba(188,103,33,0.08);
    border-color: var(--primary-color);
}

.add-member-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Payment notice ── */
.payment-notice {
    font-size: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(255,200,50,0.06);
    border: 1px solid rgba(255,200,50,0.2);
    color: #ffd966;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    line-height: 1.6;
}

.payment-notice i { flex-shrink: 0; margin-top: 2px; }

/* ── Error ── */
.error-box {
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(255,107,107,0.08);
    border: 1px solid rgba(255,107,107,0.25);
    color: #ff6b6b;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* ── Buttons ── */
.form-actions {
    display: flex;
    gap: 12px;
}

.btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 10px;
    background: var(--primary-color);
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
    flex: 1;
}

.btn-primary.full { width: 100%; }
.btn-primary:hover:not(:disabled) { background: var(--hover-color); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: var(--text-color);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s;
}

.btn-ghost:hover {
    border-color: var(--primary-color);
    background: rgba(188,103,33,0.08);
}

/* ── Success ── */
.success-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
}

.success-card {
    max-width: 480px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.success-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(80,200,120,0.15);
    border: 2px solid rgba(80,200,120,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    color: #7effa0;
}

.success-card h1 {
    font-size: 40px;
    font-weight: 900;
    text-transform: uppercase;
}

.success-card h1 span { color: var(--primary-color); }

.success-card p {
    font-size: 14px;
    opacity: 0.6;
    line-height: 1.7;
}

.success-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
}

/* ── Responsive ── */
@media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
    .left { position: relative; height: auto; }
    .event-info { border-right: none; padding: 0 24px 32px; }
    .right { padding: 32px 24px; }
    .info-grid { grid-template-columns: 1fr; }
}
</style>