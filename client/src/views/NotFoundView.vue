<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const countdown = ref(10);
let timer = null;

onMounted(() => {
    timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(timer);
            router.push('/');
        }
    }, 1000);
});

onUnmounted(() => {
    clearInterval(timer);
});
</script>

<template>
    <div class="page">

        <div class="bg-text">404</div>

        <div class="content">
            <p class="error-label">
                <i class="fa-solid fa-triangle-exclamation"></i> Error 404
            </p>

            <h1>You're <span>Lost,</span><br>Soldier.</h1>

            <p class="desc">
                The page you're looking for doesn't exist, was moved,
                or never made it out of the lobby.
            </p>

            <div class="actions">
                <a href="/" class="btn-primary">
                    <i class="fa-solid fa-house"></i> Back to Home
                </a>
                <a href="/events" class="btn-ghost">
                    <i class="fa-solid fa-calendar-days"></i> Browse Events
                </a>
            </div>

            <p class="countdown">
                Redirecting to home in
                <span>{{ countdown }}s</span>
            </p>
        </div>

        <div class="floating-icons">
            <i class="fa-solid fa-gamepad icon-float i1"></i>
            <i class="fa-solid fa-skull icon-float i2"></i>
            <i class="fa-solid fa-crosshairs icon-float i3"></i>
            <i class="fa-solid fa-trophy icon-float i4"></i>
            <i class="fa-solid fa-ghost icon-float i5"></i>
        </div>

    </div>
</template>

<style scoped>
.page {
    width: 100%;
    min-height: 100vh;
    background: var(--bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

/* ── Giant bg text ── */
.bg-text {
    position: absolute;
    font-size: clamp(180px, 30vw, 360px);
    font-weight: 900;
    color: rgba(188, 103, 33, 0.04);
    user-select: none;
    pointer-events: none;
    letter-spacing: -0.05em;
    line-height: 1;
    z-index: 0;
}

/* ── Content ── */
.content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
    padding: 48px 32px;
    max-width: 560px;
}

.error-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--primary-color);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

h1 {
    font-size: clamp(42px, 7vw, 72px);
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1.05;
    color: var(--text-color);
}

h1 span {
    color: var(--primary-color);
}

.desc {
    font-size: 15px;
    opacity: 0.55;
    line-height: 1.75;
    max-width: 420px;
}

/* ── Actions ── */
.actions {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
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
    padding: 12px 28px;
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

.btn-ghost:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.08);
    transform: translateY(-2px);
}

/* ── Countdown ── */
.countdown {
    font-size: 12px;
    opacity: 0.4;
    letter-spacing: 0.04em;
}

.countdown span {
    color: var(--primary-color);
    font-weight: 700;
    opacity: 1;
}

/* ── Floating icons ── */
.floating-icons {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
}

.icon-float {
    position: absolute;
    color: var(--primary-color);
    opacity: 0.06;
    animation: float 6s ease-in-out infinite;
}

.i1 { font-size: 80px;  top: 10%;  left: 8%;   animation-delay: 0s;    animation-duration: 7s; }
.i2 { font-size: 56px;  top: 20%;  right: 10%; animation-delay: 1.2s;  animation-duration: 5s; }
.i3 { font-size: 64px;  bottom: 25%; left: 12%; animation-delay: 0.6s; animation-duration: 8s; }
.i4 { font-size: 72px;  bottom: 15%; right: 8%; animation-delay: 2s;   animation-duration: 6s; }
.i5 { font-size: 48px;  top: 55%;  left: 45%;  animation-delay: 1.5s;  animation-duration: 9s; }

@keyframes float {
    0%,
    100% { transform: translateY(0px) rotate(0deg); }
    33%  { transform: translateY(-18px) rotate(3deg); }
    66%  { transform: translateY(10px) rotate(-2deg); }
}

/* ── Responsive ── */
@media (max-width: 560px) {
    .actions { flex-direction: column; align-items: center; }
    .icon-float { display: none; }
}
</style>