<script setup>
import { onMounted, ref, computed } from 'vue';
import Card from './EventsCard.vue';

const events = ref([]);
const error = ref(null);
const loading = ref(false);

const upcomingEvents = computed(() =>
    events.value
        .filter(event => event.status === 'Upcoming')
        .slice(0, 4)
);

const fetch_data = async () => {
    loading.value = true;
    error.value = null;

    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/event`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        events.value = data.events || [];

        const gameDataMap = {};
        for (const event of events.value) {
            if (event.game_id && !gameDataMap[event.game_id]) {
                try {
                    const gameResponse = await fetch(`${import.meta.env.VITE_HOST}/api/game/${event.game_id}`);
                    if (gameResponse.ok) {
                        const gameData = await gameResponse.json();
                        gameDataMap[event.game_id] = gameData.data;
                    }
                } catch (err) {
                    console.error(`Error fetching game ${event.game_id}:`, err);
                }
            }
        }

        events.value = events.value.map(event => ({
            ...event,
            gameData: gameDataMap[event.game_id] || {}
        }));

    } catch (err) {
        const errorMessage = `Failed to fetch`;
        console.error(errorMessage);
        error.value = errorMessage;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetch_data();
});
</script>

<template>
    <div class="container">

        <div class="headings">
            <h1 class="heading">Up-Coming Events</h1>
        </div>

        <div class="cards-container">
            <div v-if="loading" class="status-message">Loading events...</div>
            <div v-if="error" class="state-error">
                <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
            </div>
            <div v-if="!loading && !error && upcomingEvents.length === 0" class="status-message">No upcoming events
                found</div>

            <Card v-for="(event, index) in upcomingEvents" :key="index" :title="event.title"
                :description="event.description" :event_type="event.event_type"
                :registration_fees="event.registration_fee" :prize_pool="event.prize_pool"
                :registration_deadline="event.registration_deadline" :game_icon_link="event.gameData?.logo_url"
                :event_id="event.id" />
        </div>
    </div>
</template>

<style scoped>
.container {
    width: 100%;
    padding: 32px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 32px;
}

.heading {
    font-size: 44px;
    padding-top: 8px;
    border-bottom: 2px solid var(--primary-color);
}

.cards-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.state-error {
    width: 100%;
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

.status-message {
    color: #666;
    padding: 15px;
    text-align: center;
    font-size: 16px;
}
</style>