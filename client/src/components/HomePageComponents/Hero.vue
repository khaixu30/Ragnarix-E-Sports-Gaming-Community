<script setup>
</script>

<template>
    <div class="container">

        <div class="hero-image">
            <img src="../../assets/backgrounds/hero-bg.png" alt="">
            <div class="fade-bottom"></div>
            <div class="fade-left"></div>
        </div>

        <div class="hero-text">
            <p class="hero-label"><i class="fa-solid fa-crosshairs"></i> Competitive Gaming Platform</p>
            <h1>
                <span class="line-muted">Play.</span>
                <span class="line-highlight">Compete.</span>
                <span class="line-muted">Win.</span>
            </h1>
            <p class="tag-line">Step into the arena. Prove you belong at the top.</p>
            <div class="hero-btns">
                <a class="btn-primary" href="/register">
                    <i class="fa-solid fa-bolt"></i> Get Started
                </a>
                <a class="btn-ghost" href="/events">
                    Browse Events <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        </div>

        <div class="right-container">
            <div class="icon-container">
                <div class="text"><h2>Play</h2></div>
                <div class="icon"><i class="fa-solid fa-gamepad"></i></div>
            </div>
            <div class="icon-container">
                <div class="text"><h2>Compete</h2></div>
                <div class="icon"><i class="fa-solid fa-trophy"></i></div>
            </div>
            <div class="icon-container">
                <div class="text"><h2>Engage</h2></div>
                <div class="icon"><i class="fa-solid fa-users"></i></div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.container {
    width: 100%;
    height: 90vh;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
}

/* ── Background ── */
.hero-image {
    position: absolute;
    inset: 0;
    z-index: 0;
}

.hero-image img {
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
    height: 40%;
    background: linear-gradient(to top, var(--bg-color), transparent);
}

.fade-left {
    position: absolute;
    top: 0;
    left: 0;
    width: 55%;
    height: 100%;
    background: linear-gradient(to right, var(--bg-color) 30%, transparent);
}

/* ── Left hero text ── */
.hero-text {
    position: relative;
    z-index: 1;
    width: 52%;
    padding: 0 56px;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.hero-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--primary-color);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

h1 {
    display: flex;
    flex-direction: column;
    font-size: 80px;
    font-weight: 900;
    line-height: 0.9;
    text-transform: uppercase;
}

.line-muted {
    color: var(--text-color);
    opacity: 0.9;
}

.line-highlight {
    color: var(--primary-color);
}

.tag-line {
    font-size: 16px;
    opacity: 0.6;
    line-height: 1.6;
    max-width: 360px;
}

/* ── Buttons ── */
.hero-btns {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-top: 8px;
    flex-wrap: wrap;
}

.btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: 8px;
    background: var(--primary-color);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s;
}

.btn-primary:hover {
    background: var(--hover-color);
    transform: translateY(-2px);
}

.btn-ghost {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--text-color);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
}

.btn-ghost i {
    transition: transform 0.2s;
}

.btn-ghost:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.08);
    transform: translateY(-2px);
}

.btn-ghost:hover i {
    transform: translateX(4px);
}

/* ── Right icons ── */
.right-container {
    position: absolute;
    z-index: 1;
    right: 0;
    top: 0;
    width: 50%;
    height: 100%;
    padding: 32px 40px;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    flex-direction: column;
    gap: 24px;
}

.icon-container {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 16px;
    cursor: default;
}

.icon {
    width: 100px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 36px;
    border: 2px solid var(--primary-color);
    border-radius: 50%;
    color: var(--primary-color);
    opacity: 0.35;
    transition: all 0.25s ease-out;
    flex-shrink: 0;
}

.text h2 {
    font-size: 36px;
    font-weight: 900;
    text-transform: uppercase;
    color: var(--text-color);
    line-height: 1;
    letter-spacing: 0.04em;
}

.text {
    opacity: 0;
    transform: translateX(24px);
    transition: all 0.25s ease-out;
}

.icon-container:hover .icon {
    opacity: 1;
    box-shadow: 0 0 24px rgba(188, 103, 33, 0.4);
}

.icon-container:hover .icon i {
    filter: drop-shadow(0 0 8px var(--primary-color));
}

.icon-container:hover .text {
    opacity: 1;
    transform: translateX(0);
}

/* ── Responsive ── */
@media (max-width: 900px) {
    .hero-text { width: 100%; padding: 0 32px; }
    .right-container { display: none; }
    .fade-left { width: 100%; }
    h1 { font-size: 56px; }
}
</style>