<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from '../../components/DashboardComponents/Sidebar.vue';

const user = ref(null);
const upcomingEvents = ref([]);
const liveEvents = ref([]);
const councils = ref([]);
const loading = ref(true);

const fetch_user = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        if (json.success) user.value = json.data;
    } catch (err) {
        console.error(err);
    }
};

const fetch_events = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/event/`);
        const json = await response.json();
        const events = json.events || [];

        // Fetch game logos
        const gameDataMap = {};
        for (const event of events) {
            if (event.game_id && !gameDataMap[event.game_id]) {
                try {
                    const gameRes = await fetch(`${import.meta.env.VITE_HOST}/api/game/${event.game_id}`);
                    const gameJson = await gameRes.json();
                    gameDataMap[event.game_id] = gameJson.data;
                } catch (e) { console.error(e); }
            }
        }

        const enriched = events.map(e => ({ ...e, gameData: gameDataMap[e.game_id] || {} }));
        upcomingEvents.value = enriched.filter(e => e.status === 'Upcoming').slice(0, 3);
        liveEvents.value = enriched.filter(e => e.status === 'Live').slice(0, 3);
    } catch (err) {
        console.error(err);
    }
};

const fetch_councils = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/all`);
        const json = await response.json();
        console.log(json);
        if (json.success) councils.value = json.data;
        console.log(councils.value)
    } catch (err) {
        console.error(err);
    }
};

const getInitials = (full_name) => {
    if (!full_name) return '?';
    return full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const formatDeadline = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const isFree = (fee) => !fee || parseFloat(fee) === 0;

onMounted(async () => {
    await Promise.all([fetch_user(), fetch_events(), fetch_councils()]);
    loading.value = false;
});
</script>

<template>
    <div class="dashboard-layout">
        <main class="dashboard-main">

            <div v-if="loading" class="state-loading">
                <i class="fa-solid fa-spinner fa-spin"></i> Loading dashboard...
            </div>

            <template v-else>

                <!-- ── Profile Banner ── -->
                <section class="profile-banner">
                    <div class="banner-bg"></div>
                    <div class="banner-content">

                        <div class="profile-left">
                            <!-- Avatar -->
                            <div class="profile-avatar-wrap">
                                <div class="profile-avatar" v-if="!user?.profile_pic">
                                    {{ getInitials(user?.full_name) }}
                                </div>
                                <img v-else :src="user.profile_pic" :alt="user.full_name" class="profile-avatar-img" />
                                <span class="verified-dot" :class="user?.is_verified ? 'verified' : 'unverified'"
                                    :title="user?.is_verified ? 'Verified' : 'Not Verified'">
                                    <i :class="user?.is_verified ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"></i>
                                </span>
                            </div>

                            <!-- Info -->
                            <div class="profile-info">
                                <p class="profile-name">{{ user?.full_name || user?.username }}</p>
                                <p class="profile-username">@{{ user?.username }}</p>
                                <p class="profile-email">
                                    <i class="fa-solid fa-envelope"></i> {{ user?.email }}
                                </p>
                                <span class="account-type-chip">
                                    <i class="fa-solid fa-id-badge"></i>
                                    {{ user?.account_type || 'Player' }}
                                </span>
                            </div>
                        </div>

                        <!-- Rank (hardcoded) -->
                        <div class="rank-card">
                            <p class="rank-label"><i class="fa-solid fa-ranking-star"></i> Global Rank</p>
                            <p class="rank-number">#<span>—</span></p>
                            <p class="rank-note">Ranking system coming soon</p>
                            <div class="rank-stats">
                                <div class="rank-stat">
                                    <p class="rs-num">0</p>
                                    <p class="rs-label">Events</p>
                                </div>
                                <div class="rs-divider"></div>
                                <div class="rank-stat">
                                    <p class="rs-num">0</p>
                                    <p class="rs-label">Wins</p>
                                </div>
                                <div class="rs-divider"></div>
                                <div class="rank-stat">
                                    <p class="rs-num">0</p>
                                    <p class="rs-label">Points</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Quick actions -->
                    <div class="quick-actions">
                        <a href="/dashboard/profile" class="qa-btn">
                            <i class="fa-solid fa-pen"></i> Edit Profile
                        </a>
                        <a href="/dashboard/registrations" class="qa-btn">
                            <i class="fa-solid fa-clipboard"></i> My Registrations
                        </a>
                        <a href="/events" class="qa-btn highlight">
                            <i class="fa-solid fa-bolt"></i> Browse Events
                        </a>
                    </div>
                </section>

                <!-- ── Live Events ── -->
                <section v-if="liveEvents.length > 0" class="dash-section">
                    <div class="section-head">
                        <p class="section-label live-label">
                            <span class="live-dot"></span> Live Now
                        </p>
                        <a href="/events" class="section-link">
                            View All <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="events-row">
                        <div v-for="event in liveEvents" :key="event.id" class="event-card">
                            <div class="event-card-img">
                                <img v-if="event.gameData?.logo_url" :src="event.gameData.logo_url"
                                    :alt="event.title" />
                                <div v-else class="event-card-img-placeholder">
                                    <i class="fa-solid fa-gamepad"></i>
                                </div>
                                <div class="event-img-fade"></div>
                                <span class="event-status-pill pill-live">Live</span>
                            </div>
                            <div class="event-card-body">
                                <p class="event-card-title">{{ event.title }}</p>
                                <div class="event-chips">
                                    <span class="chip chip-type">{{ event.event_type }}</span>
                                    <span class="chip"
                                        :class="isFree(event.registration_fee) ? 'chip-free' : 'chip-fee'">
                                        {{ isFree(event.registration_fee) ? 'Free' : `$${event.registration_fee}` }}
                                    </span>
                                    <span v-if="parseFloat(event.prize_pool) > 0" class="chip chip-prize">
                                        <i class="fa-solid fa-trophy"></i> ${{ event.prize_pool }}
                                    </span>
                                </div>
                                <a :href="`/register/${event.id}`" class="event-register-btn">
                                    Register <i class="fa-solid fa-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ── Upcoming Events ── -->
                <section class="dash-section">
                    <div class="section-head">
                        <p class="section-label">
                            <i class="fa-solid fa-calendar-days"></i> Upcoming Events
                        </p>
                        <a href="/events" class="section-link">
                            View All <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>

                    <div v-if="upcomingEvents.length === 0" class="section-empty">
                        <i class="fa-solid fa-calendar-xmark"></i>
                        <p>No upcoming events right now.</p>
                    </div>

                    <div v-else class="events-row">
                        <div v-for="event in upcomingEvents" :key="event.id" class="event-card">
                            <div class="event-card-img">
                                <img v-if="event.gameData?.logo_url" :src="event.gameData.logo_url"
                                    :alt="event.title" />
                                <div v-else class="event-card-img-placeholder">
                                    <i class="fa-solid fa-gamepad"></i>
                                </div>
                                <div class="event-img-fade"></div>
                                <span class="event-status-pill pill-upcoming">Upcoming</span>
                            </div>
                            <div class="event-card-body">
                                <p class="event-card-title">{{ event.title }}</p>
                                <div class="event-chips">
                                    <span class="chip chip-type">{{ event.event_type }}</span>
                                    <span class="chip"
                                        :class="isFree(event.registration_fee) ? 'chip-free' : 'chip-fee'">
                                        {{ isFree(event.registration_fee) ? 'Free' : `$${event.registration_fee}` }}
                                    </span>
                                    <span v-if="parseFloat(event.prize_pool) > 0" class="chip chip-prize">
                                        <i class="fa-solid fa-trophy"></i> ${{ event.prize_pool }}
                                    </span>
                                </div>
                                <div class="event-card-footer">
                                    <div class="event-deadline">
                                        <span class="deadline-label">Deadline</span>
                                        <span class="deadline-val">{{ formatDeadline(event.registration_deadline)
                                            }}</span>
                                    </div>
                                    <a :href="`/register/${event.id}`" class="event-register-btn">
                                        Register <i class="fa-solid fa-arrow-right"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ── Councils ── -->
                <section class="dash-section">
                    <div class="section-head">
                        <p class="section-label">
                            <i class="fa-solid fa-landmark"></i> Councils
                        </p>
                        <a href="/councils" class="section-link">
                            View All <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>

                    <div v-if="councils.length === 0" class="section-empty">
                        <i class="fa-solid fa-landmark"></i>
                        <p>No councils found.</p>
                    </div>

                    <div v-else class="councils-row" v-for="council in councils" :key="council.id"
                        :href="`/councils/${council.id}`">
                        <div class="council-card">
                            <div class="council-logo-wrap">
                                <img :src="council.logo_url || `../../assets/games_covers/battlefield.webp`"
                                    :alt="council.name" class="council-logo" />
                            </div>
                            <div class="council-info">
                                <p class="council-name">{{ council.name }}</p>
                                <p class="council-desc">{{ council.description || 'No description.' }}</p>
                            </div>
                            <a :href="`council/${council.id}`">
                                <i class="fa-solid fa-chevron-right council-arrow"></i>
                            </a>
                        </div>
                    </div>
                </section>

            </template>
        </main>
    </div>
</template>

<style scoped>
/* ── Layout ── */
.dashboard-layout {
    display: flex;
    min-height: 100vh;
    background: #1a1410;
    color: var(--text-color);
}

.dashboard-main {
    flex: 1;
    overflow-y: auto;
    padding: 36px 40px;
    display: flex;
    flex-direction: column;
    gap: 36px;
}

/* ── Loading ── */
.state-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 15px;
    opacity: 0.45;
    padding: 80px;
}

/* ── Profile Banner ── */
.profile-banner {
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.2);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
}

.banner-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(188, 103, 33, 0.08) 0%, transparent 60%);
    pointer-events: none;
}

.banner-content {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 28px 32px;
    gap: 24px;
    flex-wrap: wrap;
}

/* ── Profile left ── */
.profile-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.profile-avatar-wrap {
    position: relative;
    flex-shrink: 0;
}

.profile-avatar {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 900;
    color: #fff;
    border: 2px solid rgba(188, 103, 33, 0.4);
}

.profile-avatar-img {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    object-fit: cover;
    border: 2px solid rgba(188, 103, 33, 0.4);
    display: block;
}

.verified-dot {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    border: 2px solid var(--bg-color);
}

.verified-dot.verified {
    background: #7effa0;
    color: #1a1410;
}

.verified-dot.unverified {
    background: #ff6b6b;
    color: #fff;
}

.profile-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.profile-name {
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    line-height: 1;
}

.profile-username {
    font-size: 12px;
    opacity: 0.45;
    margin-bottom: 2px;
}

.profile-email {
    font-size: 12px;
    opacity: 0.55;
    display: flex;
    align-items: center;
    gap: 7px;
}

.profile-email i {
    color: var(--primary-color);
    font-size: 11px;
}

.account-type-chip {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(188, 103, 33, 0.12);
    border: 1px solid rgba(188, 103, 33, 0.3);
    color: var(--hover-color);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    width: fit-content;
}

/* ── Rank card ── */
.rank-card {
    background: rgba(188, 103, 33, 0.06);
    border: 1px solid rgba(188, 103, 33, 0.2);
    border-radius: 12px;
    padding: 20px 24px;
    text-align: center;
    min-width: 200px;
}

.rank-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--primary-color);
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
}

.rank-number {
    font-size: 40px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 4px;
    color: var(--text-color);
}

.rank-number span {
    color: var(--primary-color);
}

.rank-note {
    font-size: 10px;
    opacity: 0.35;
    margin-bottom: 16px;
    letter-spacing: 0.04em;
}

.rank-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: center;
}

.rank-stat {
    text-align: center;
}

.rs-num {
    font-size: 18px;
    font-weight: 900;
    color: var(--primary-color);
    line-height: 1;
    margin-bottom: 3px;
}

.rs-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.4;
}

.rs-divider {
    width: 1px;
    height: 28px;
    background: rgba(255, 255, 255, 0.08);
}

/* ── Quick actions ── */
.quick-actions {
    display: flex;
    gap: 10px;
    padding: 16px 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-wrap: wrap;
}

.qa-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-color);
    background: transparent;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.qa-btn:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.08);
    transform: translateY(-1px);
}

.qa-btn.highlight {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
}

.qa-btn.highlight:hover {
    background: var(--hover-color);
    border-color: var(--hover-color);
}

/* ── Sections ── */
.dash-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--primary-color);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

.live-label {
    color: #7effa0;
}

.live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7effa0;
    display: inline-block;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.5;
        transform: scale(1.3);
    }
}

.section-link {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--primary-color);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;
}

.section-link i {
    font-size: 9px;
    transition: transform 0.2s;
}

.section-link:hover i {
    transform: translateX(3px);
}

.section-empty {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px;
    background: var(--bg-color);
    border: 1px dashed rgba(188, 103, 33, 0.2);
    border-radius: 12px;
    font-size: 13px;
    opacity: 0.45;
}

.section-empty i {
    font-size: 18px;
    color: var(--primary-color);
}

/* ── Event cards ── */
.events-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.event-card {
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.18);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
}

.event-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary-color);
}

.event-card-img {
    position: relative;
    height: 120px;
}

.event-card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.event-card-img-placeholder {
    width: 100%;
    height: 100%;
    background: rgba(188, 103, 33, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: var(--primary-color);
    opacity: 0.3;
}

.event-img-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, var(--bg-color) 100%);
}

.event-status-pill {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
}

.pill-upcoming {
    background: rgba(188, 103, 33, 0.25);
    border: 1px solid rgba(188, 103, 33, 0.5);
    color: var(--hover-color);
}

.pill-live {
    background: rgba(80, 200, 120, 0.2);
    border: 1px solid rgba(80, 200, 120, 0.4);
    color: #7effa0;
}

.event-card-body {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.event-card-title {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-chips {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
}

.chip {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.04em;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.chip-type {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(237, 237, 237, 0.7);
}

.chip-free {
    background: rgba(80, 200, 120, 0.12);
    border: 1px solid rgba(80, 200, 120, 0.3);
    color: #7effa0;
}

.chip-fee {
    background: rgba(188, 103, 33, 0.12);
    border: 1px solid rgba(188, 103, 33, 0.3);
    color: var(--hover-color);
}

.chip-prize {
    background: rgba(255, 200, 50, 0.1);
    border: 1px solid rgba(255, 200, 50, 0.25);
    color: #ffd966;
}

.event-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 10px;
}

.event-deadline {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.deadline-label {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--primary-color);
    font-weight: 700;
}

.deadline-val {
    font-size: 11px;
    opacity: 0.55;
}

.event-register-btn {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 5px 12px;
    border-radius: 7px;
    background: var(--primary-color);
    color: #fff;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
}

.event-register-btn i {
    font-size: 8px;
}

.event-register-btn:hover {
    background: var(--hover-color);
}

/* ── Council cards ── */
.councils-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.council-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.15);
    border-radius: 12px;
    text-decoration: none;
    color: var(--text-color);
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.council-card:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.05);
    transform: translateX(4px);
}

.council-logo-wrap {
    flex-shrink: 0;
}

.council-logo {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid rgba(188, 103, 33, 0.25);
}

.council-logo-placeholder {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: rgba(188, 103, 33, 0.08);
    border: 1px solid rgba(188, 103, 33, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: var(--primary-color);
    opacity: 0.5;
}

.council-info {
    flex: 1;
    min-width: 0;
}

.council-name {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
}

.council-desc {
    font-size: 11px;
    opacity: 0.45;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.council-arrow {
    font-size: 11px;
    opacity: 0.25;
    flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
    .events-row {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-main {
        padding: 24px 20px;
    }

    .banner-content {
        flex-direction: column;
    }

    .events-row {
        grid-template-columns: 1fr;
    }

    .rank-card {
        min-width: unset;
        width: 100%;
    }
}
</style>