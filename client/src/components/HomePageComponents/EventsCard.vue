<script setup>
const props = defineProps({
    title: { type: String },
    event_type: { type: String },
    registration_fees: { type: Number },
    prize_pool: { type: Number },
    registration_deadline: { type: String },
    description: { type: String },
    game_icon_link: { type: String },
    event_id: { type: String }
});

const formatDeadline = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const formatFee = (fee) => {
    if (fee === 0 || fee === null || fee === undefined) return 'Free';
    return `$${fee}`;
};
</script>

<template>
    <div class="card-container">
        <div class="container">
            <div class="bg">
                <img :src="game_icon_link" alt="">
            </div>
            <div class="details">
                <h1>{{ title }}</h1>

                <div class="meta">
                    <span v-if="event_type" class="badge type">{{ event_type }}</span>
                    <span class="badge fee">{{ formatFee(registration_fees) }}</span>
                    <span v-if="prize_pool > 0" class="badge prize"><i class="fa-solid fa-trophy"></i> ${{ prize_pool }}</span>
                </div>

                <p class="deadline">
                    <span class="deadline-label">Deadline</span>
                    {{ formatDeadline(registration_deadline) }}
                </p>
                <p class="desc">{{ description }}</p>

                <p class="register-btn"><a class=" btn-1 btn" :href="`/register/${event_id}`">Register</a></p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card-container {
    display: inline-block;
    text-align: left;
}

.card-container .container {
    width: 300px;
    height: 400px;
    position: relative;
    overflow: hidden;
}

.card-container .bg {
    width: 100%;
    height: 100%;
}

.card-container .bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.card-container .details {
    position: absolute;
    bottom: -50%;
    left: 0;
    background: var(--bg-slight-trans-color);
    width: 100%;
    padding: 24px;
    height: 50%;
    transition: all 0.2s ease-out;
}

.card-container .container:hover .details {
    bottom: 0;
}

/* ── new styles ── */
.card-container h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-container .desc {
    font-size: 16px;
    opacity: 0.8;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-container .meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 8px;
}

.card-container .badge {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.03em;
}

.card-container .badge.type {
    background: var(--bg-slight-trans-color);
}

.card-container .badge.fee {
    background: var(--bg-slight-trans-color);
}

.card-container .badge.prize {
    background: var(--bg-slight-trans-color);
}

.card-container .deadline {
    font-size: 12px;
    opacity: 0.75;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.card-container .deadline-label {
    font-weight: 700;
    opacity: 1;
    text-transform: uppercase;
    font-size: 0.6rem;
    letter-spacing: 0.05em;
}
.register-btn{
    font-size: 16px;
    position: absolute;
    bottom: 24px;
    right: 24px;
}
</style>