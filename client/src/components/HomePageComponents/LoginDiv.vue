<script setup>
</script>

<template>
    <div class="cta-container">
        <div class="bg">
            <img src="../../assets/backgrounds/bg2.jpg" alt="">
            <div class="overlay"></div>
        </div>
        <div class="cta-inner">
            <div class="cta-label">
                <i class="fa-solid fa-bolt"></i> Ready to compete?
            </div>
            <h1>Join the <span>Arena</span></h1>
            <p>Join the competitive gaming community and prove your skills on the battlefield.</p>
            <div class="cta-buttons">
                <a class="btn-primary" href="/register">
                    <i class="fa-solid fa-user-plus"></i> Create Account
                </a>
                <a class="btn-outline" href="/login">
                    <i class="fa-solid fa-right-to-bracket"></i> Login
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cta-container {
    width: 100%;
    min-height: 320px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-top: 2px solid var(--primary-color);
    border-bottom: 2px solid var(--primary-color);
}

/* ── Background ── */
.bg {
    position: absolute;
    inset: 0;
    z-index: 0;
}

.bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.25;
}

.overlay {
    position: absolute;
    inset: 0;
    background: var(--bg-color);
    opacity: 0.55;
}

/* ── Content ── */
.cta-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 56px 32px;
    text-align: center;
}

.cta-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary-color);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

.cta-inner h1 {
    font-size: 42px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1.05;
    color: var(--text-color);
}

.cta-inner h1 span {
    color: var(--primary-color);
}

.cta-inner p {
    font-size: 15px;
    opacity: 0.6;
    max-width: 480px;
    line-height: 1.7;
}

/* ── Buttons ── */
.cta-buttons {
    display: flex;
    gap: 14px;
    margin-top: 8px;
    flex-wrap: wrap;
    justify-content: center;
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

.btn-outline {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: 8px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-color);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
}

.btn-outline:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.08);
    transform: translateY(-2px);
}

/* ── Responsive ── */
@media (max-width: 560px) {
    .cta-inner h1 { font-size: 30px; }
    .cta-inner p { font-size: 13px; }
    .cta-buttons { flex-direction: column; align-items: center; }
}
</style>