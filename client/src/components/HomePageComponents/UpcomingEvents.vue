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
        const response = await fetch('http://localhost:3000/api/event');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        events.value = data.events || [];

        const gameDataMap = {};
        for (const event of events.value) {
            if (event.game_id && !gameDataMap[event.game_id]) {
                try {
                    const gameResponse = await fetch(`http://localhost:3000/api/game/${event.game_id}`);
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
        const errorMessage = `Failed to fetch events: ${err.message}. Make sure the server is running on http://localhost:3000`;
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
            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-if="!loading && !error && upcomingEvents.length === 0" class="status-message">No upcoming events found</div>

            <Card v-for="(event, index) in upcomingEvents" :key="index" :title="event.title" :description="event.description"
                :event_type="event.event_type" :registration_fees="event.registration_fee"
                :prize_pool="event.prize_pool" :registration_deadline="event.registration_deadline"
                :game_icon_link="event.gameData?.logo_url" :event_id="event.id" />
        </div>
    </div>
</template>

<style scoped>
.container{
    width: 100%;
    padding: 32px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 32px;
}

.heading{
    font-size: 44px;
    padding-top: 8px;
    border-bottom: 2px solid var(--primary-color);
}

.cards-container{
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.error-message {
    color: #ff6b6b;
    padding: 15px;
    background-color: #ffe0e0;
    border-radius: 4px;
    margin-bottom: 20px;
    font-weight: 500;
}

.status-message {
    color: #666;
    padding: 15px;
    text-align: center;
    font-size: 16px;
}
</style>