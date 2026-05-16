<script setup>
const props = defineProps({
    name: { type: String },
    description: { type: String },
    logo_url: { type: String },
    rating: { type: Number },
    game_id: { type: String }
});

const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return { full, half, empty };
};
</script>

<template>
    <div class="card">

        <div class="card-img-wrap">
            <div class="rating-pill">
                <i class="fa-solid fa-star"></i> {{ rating }}
            </div>
            <img :src="logo_url" :alt="name" />
        </div>

        <div class="card-body">
            <p class="card-title">{{ name }}</p>
            <p class="card-desc">{{ description }}</p>

            <div class="card-divider"></div>

            <div class="card-footer">
                <div class="stars">
                    <i
                        v-for="n in renderStars(rating).full"
                        :key="'f' + n"
                        class="fa-solid fa-star star-full"
                    ></i>
                    <i
                        v-if="renderStars(rating).half"
                        class="fa-solid fa-star-half-stroke star-full"
                    ></i>
                    <i
                        v-for="n in renderStars(rating).empty"
                        :key="'e' + n"
                        class="fa-regular fa-star star-empty"
                    ></i>
                </div>
                <a class="view-btn" :href="`/games/${game_id}`">
                    View More <i class="fa-solid fa-arrow-right"></i>
                </a>
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
    height: 180px;
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

/* ── Rating pill ── */
.rating-pill {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(188, 103, 33, 0.25);
    border: 1px solid rgba(188, 103, 33, 0.5);
    color: var(--hover-color);
    display: flex;
    align-items: center;
    gap: 5px;
}

.rating-pill i {
    font-size: 9px;
    color: #ffd966;
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

/* ── Stars ── */
.stars {
    display: flex;
    gap: 3px;
    align-items: center;
}

.star-full {
    font-size: 12px;
    color: #ffd966;
}

.star-empty {
    font-size: 12px;
    color: rgba(255, 217, 102, 0.25);
}

/* ── View button ── */
.view-btn {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 7px 16px;
    border-radius: 8px;
    background: var(--primary-color);
    color: #fff;
    text-decoration: none;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 7px;
}

.view-btn i {
    font-size: 10px;
    transition: transform 0.2s;
}

.view-btn:hover {
    background: var(--hover-color);
}

.card:hover .view-btn i {
    transform: translateX(3px);
}
</style>