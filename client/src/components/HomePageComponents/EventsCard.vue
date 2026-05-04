<script setup>
const props = defineProps({
    title: { type: String },
    event_type: { type: String },
    status: { type: String },
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

const isFree = (fee) => fee === 0 || fee === null || fee === undefined;
</script>

<template>
    <div class="card">

        <div class="card-img-wrap">
            <span class="status-pill" :class="status === 'Live' ? 'pill-live' : 'pill-upcoming'">
                {{ status }}
            </span>
            <img :src="game_icon_link" :alt="title" />
        </div>

        <div class="card-body">
            <p class="card-title">{{ title }}</p>
            <p class="card-desc">{{ description }}</p>

            <div class="card-chips">
                <span v-if="event_type" class="chip chip-type">{{ event_type }}</span>
                <span class="chip" :class="isFree(registration_fees) ? 'chip-free' : 'chip-fee'">
                    {{ formatFee(registration_fees) }}
                </span>
                <span v-if="prize_pool > 0" class="chip chip-prize">
                    <i class="fa-solid fa-trophy"></i> ${{ prize_pool }}
                </span>
            </div>

            <div class="card-divider"></div>

            <div class="card-footer">
                <div class="deadline-wrap">
                    <span class="deadline-label">Deadline</span>
                    <span class="deadline-val">{{ formatDeadline(registration_deadline) }}</span>
                </div>
                <a class="reg-btn" :href="`/register/${event_id}`">Register</a>
            </div>
        </div>

    </div>
</template>

<style scoped>
.card {
    width: 280px;
    border-radius: 14px;
    overflow: hidden;
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.2);
    transition: transform 0.25s ease, border-color 0.25s ease;
    cursor: pointer;
    flex-shrink: 0;
    text-align: left;
}

.card:hover {
    transform: translateY(-6px);
    border-color: var(--primary-color);
}

/* ── Image ── */
.card-img-wrap {
    position: relative;
    width: 100%;
    height: 160px;
}

.card-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.card-img-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, var(--bg-color) 100%);
}

/* ── Status pill ── */
.status-pill {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 10px;
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

/* ── Body ── */
.card-body {
    padding: 16px 18px 18px;
}

.card-title {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-color);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 6px;
}

.card-desc {
    font-size: 12px;
    color: rgba(237, 237, 237, 0.55);
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 14px;
}

/* ── Chips ── */
.card-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}

.chip {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 5px;
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

/* ── Divider ── */
.card-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin-bottom: 14px;
}

/* ── Footer ── */
.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.deadline-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.deadline-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--primary-color);
    font-weight: 700;
}

.deadline-val {
    font-size: 12px;
    color: rgba(237, 237, 237, 0.65);
}

/* ── Register button ── */
.reg-btn {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 7px 18px;
    border-radius: 8px;
    background: var(--primary-color);
    color: #fff;
    text-decoration: none;
    transition: background 0.2s;
    display: inline-block;
}

.reg-btn:hover {
    background: var(--hover-color);
}
</style>