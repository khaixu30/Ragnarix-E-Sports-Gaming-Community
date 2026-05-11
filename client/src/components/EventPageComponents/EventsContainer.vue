<script setup>
import { onMounted, ref } from 'vue';
import EventsCard from '../HomePageComponents/EventsCard.vue';

const props = defineProps({
    status: { type: String } // 'Upcoming' | 'Live'
})

const loading = ref(false);
const error = ref(null);
const events_data = ref([])

const fetch_events_data = async () => {
    loading.value = true;
    error.value = null;

    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/event/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const eventJSON = await response.json();
        const eventData = eventJSON.events || [];

        const gameDataMap = {};
        for (const event of eventData) {
            if (event.game_id && !gameDataMap[event.game_id]) {
                try {
                    const gameResponse = await fetch(`${import.meta.env.VITE_HOST}/api/game/${event.game_id}`);
                    if (gameResponse.ok) {
                        const gameJSON = await gameResponse.json();
                        gameDataMap[event.game_id] = gameJSON.data;
                    }
                } catch (err) {
                    console.error(`Error fetching game ${event.game_id}:`, err);
                }
            }
        }

        events_data.value = eventData
            .filter(event => event.status === props.status)
            .map(event => ({
                ...event,
                gameData: gameDataMap[event.game_id] || {}
            }));

        console.log(props.status)

    } catch (err) {
        console.error(err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetch_events_data();
})
</script>

<template>
    <div class="container">
        <div class="headings">
            <h1 class="heading">{{ status }} Events</h1>
        </div>

        <div v-if="loading" class="status-message">Loading events...</div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="!loading && !error && events_data.length === 0" class="status-message">
            No {{ status?.toLowerCase() }} events found.
        </div>

        <div class="card-container">
            <EventsCard
                v-for="(event, index) in events_data"
                :key="index"
                :title="event.title"
                :description="event.description"
                :event_type="event.event_type"
                :registration_fees="event.registration_fee"
                :prize_pool="event.prize_pool"
                :registration_deadline="event.registration_deadline"
                :game_icon_link="event.gameData?.logo_url"
                :event_id="event.id"
            />
        </div>
    </div>
</template>

<style scoped>
.container{
    width: 100%;
    padding: 24px;
    margin: 16px 0;
}
.headings{
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
}
.heading{
    font-size: 44px;
    padding-top: 8px;
    border-bottom: 2px solid var(--primary-color);
    width: fit-content;
}
.status-message {
    color: #666;
    padding: 15px;
    text-align: center;
    font-size: 16px;
}

.error-message {
    color: #ff6b6b;
    padding: 15px;
    background-color: rgba(255, 107, 107, 0.1);
    border-radius: 4px;
    margin-bottom: 20px;
}

.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
}
</style>