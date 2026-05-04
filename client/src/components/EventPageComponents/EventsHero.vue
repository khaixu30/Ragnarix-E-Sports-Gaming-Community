<script setup>
defineProps({
    title: { type: String, default: 'Events' },
    subtitle: { type: String, default: 'Browse our events' },
    bg: { type: String, default: '../../assets/backgrounds/events-bg.png' },
    breadcrumb: { type: String, default: 'Events' }
});
</script>

<template>
    <div class="page-hero">

        <div class="hero-bg">
            <img src="../../assets/backgrounds/events-bg.png" alt="">
            <div class="fade-bottom"></div>
            <div class="fade-left"></div>
        </div>

        <div class="hero-content">
            <div class="breadcrumb">
                <a href="/"><i class="fa-solid fa-house"></i></a>
                <span class="crumb-sep"><i class="fa-solid fa-chevron-right"></i></span>
                <span>{{ breadcrumb }}</span>
            </div>
            <h1>{{ title }}</h1>
            <p class="subtitle">{{ subtitle }}</p>
            <div class="accent-line"></div>
        </div>

        <div class="hero-stats">
            <div class="stat">
                <p class="stat-num">34+</p>
                <p class="stat-label">Active Events</p>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
                <p class="stat-num">$12K</p>
                <p class="stat-label">Prize Pool</p>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
                <p class="stat-num">8</p>
                <p class="stat-label">Games</p>
            </div>
        </div>

    </div>
</template>

<style scoped>
.page-hero {
    width: 100%;
    height: 420px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 0 64px 48px;
    border-bottom: 2px solid var(--primary-color);
}

/* ── Background ── */
.hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
}

.hero-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
}

.fade-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 70%;
    background: linear-gradient(to top, var(--bg-color) 40%, transparent);
}

.fade-left {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, var(--bg-color) 20%, transparent 70%);
}

/* ── Content ── */
.hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    opacity: 0.5;
    margin-bottom: 4px;
}

.breadcrumb a {
    color: var(--text-color);
    text-decoration: none;
    transition: opacity 0.2s;
}

.breadcrumb a:hover {
    opacity: 1;
}

.crumb-sep {
    font-size: 8px;
    opacity: 0.5;
}

.breadcrumb span:last-child {
    color: var(--primary-color);
    opacity: 1;
}

h1 {
    font-size: 72px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 0.9;
    color: var(--text-color);
    letter-spacing: -0.01em;
}

.subtitle {
    font-size: 15px;
    opacity: 0.55;
    line-height: 1.6;
    max-width: 400px;
}

.accent-line {
    width: 48px;
    height: 3px;
    background: var(--primary-color);
    border-radius: 999px;
    margin-top: 4px;
}

/* ── Stats ── */
.hero-stats {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 24px;
    background: rgba(43, 38, 34, 0.7);
    border: 1px solid rgba(188, 103, 33, 0.25);
    border-radius: 14px;
    padding: 20px 28px;
    backdrop-filter: blur(4px);
    align-self: flex-end;
}

.stat {
    text-align: center;
}

.stat-num {
    font-size: 26px;
    font-weight: 900;
    color: var(--primary-color);
    line-height: 1;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.5;
}

.stat-divider {
    width: 1px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
}

/* ── Responsive ── */
@media (max-width: 900px) {
    .page-hero {
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        padding: 0 32px 40px;
        height: 380px;
    }

    h1 { font-size: 52px; }

    .hero-stats {
        align-self: flex-start;
        padding: 14px 20px;
        gap: 16px;
    }

    .stat-num { font-size: 20px; }
}

@media (max-width: 560px) {
    .page-hero { padding: 0 24px 32px; height: 340px; }
    h1 { font-size: 40px; }
    .hero-stats { display: none; }
}
</style>