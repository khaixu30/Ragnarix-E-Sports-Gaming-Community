<script setup>
import { onMounted, ref } from 'vue';
import Card from './GamesCard.vue';

const games = ref([]);
const error = ref(null);
const loading = ref(false);
const trackRef = ref(null);

const scroll = (direction) => {
    const amount = 320;
    trackRef.value.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth'
    });
};

const loadGames = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/game/`);
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
        }
        const gameJSON = await response.json();
        games.value = gameJSON.data || [];
    } catch (err) {
        console.error(err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadGames();
})
</script>

<template>
    <div class="section">

        <!-- Background -->
        <div class="section-bg">
            <img src="../../assets/backgrounds/bg3.jpg" alt="">
            <div class="bg-overlay"></div>
        </div>

        <!-- Header -->
        <div class="section-header">
            <div class="header-left">
                <p class="section-label"><i class="fa-solid fa-gamepad"></i> Library</p>
                <h2 class="section-title">Featured <span>Games</span></h2>
            </div>
            <div class="header-right">
                <a href="/games" class="view-all">
                    View All <i class="fa-solid fa-arrow-right"></i>
                </a>
                <div class="scroll-btns">
                    <button class="scroll-btn" @click="scroll('left')" aria-label="Scroll left">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button class="scroll-btn" @click="scroll('right')" aria-label="Scroll right">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- States -->
        <div v-if="loading" class="state-message">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading games...
        </div>
        <div v-if="error" class="state-error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
        </div>
        <div v-if="!loading && !error && games.length === 0" class="state-message">
            No games found.
        </div>

        <!-- Cards track -->
        <div v-if="!loading && !error && games.length > 0" class="cards-track-wrap" ref="trackRef">
            <div class="cards-track">
                <Card
                    v-for="(game, index) in games"
                    :key="index"
                    :name="game.name"
                    :game_id="game.id"
                    :logo_url="game.logo_url"
                    :rating="parseFloat(game.rating)"
                    :description="game.description"
                />
            </div>
        </div>

    </div>
</template>

<style scoped>
.section {
    width: 100%;
    padding: 24px;
    position: relative;
    overflow: hidden;
}

/* ── Background ── */
.section-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    clip-path: polygon(100% 0, 99% 64%, 0 100%, 0 36%);
}

.section-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.bg-overlay {
    position: absolute;
    inset: 0;
    background: var(--bg-color);
    opacity: 0.82;
}

/* ── Header ── */
.section-header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 64px;
    margin-bottom: 36px;
}

.section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary-color);
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-title {
    font-size: 40px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1;
    color: var(--text-color);
}

.section-title span {
    color: var(--primary-color);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.view-all {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--primary-color);
    text-decoration: none;
    border: 1px solid rgba(188, 103, 33, 0.3);
    padding: 8px 18px;
    border-radius: 8px;
    transition: background 0.2s, border-color 0.2s;
    white-space: nowrap;
}

.view-all i {
    font-size: 10px;
    transition: transform 0.2s;
}

.view-all:hover {
    background: rgba(188, 103, 33, 0.1);
    border-color: var(--primary-color);
}

.view-all:hover i {
    transform: translateX(4px);
}

/* ── Scroll buttons ── */
.scroll-btns {
    display: flex;
    gap: 8px;
}

.scroll-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid rgba(188, 103, 33, 0.3);
    background: rgba(188, 103, 33, 0.08);
    color: var(--primary-color);
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
}

.scroll-btn:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
    transform: scale(1.05);
}

.scroll-btn:active {
    transform: scale(0.97);
}

/* ── Cards track ── */
.cards-track-wrap {
    position: relative;
    z-index: 1;
    padding: 0 64px;
    overflow-x: auto;
    scrollbar-width: none;
}

.cards-track-wrap::-webkit-scrollbar {
    display: none;
}

.cards-track {
    display: flex;
    gap: 20px;
    width: max-content;
}

/* ── States ── */
.state-message {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 32px;
    font-size: 15px;
    opacity: 0.5;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.state-error {
    position: relative;
    z-index: 1;
    margin: 0 64px;
    padding: 14px 20px;
    border-radius: 10px;
    background: rgba(255, 107, 107, 0.08);
    border: 1px solid rgba(255, 107, 107, 0.25);
    color: #ff6b6b;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
    .section-header { padding: 0 24px; flex-direction: column; align-items: flex-start; gap: 16px; }
    .cards-track-wrap { padding: 0 24px; }
    .section-title { font-size: 30px; }
    .state-error { margin: 0 24px; }
}
</style>