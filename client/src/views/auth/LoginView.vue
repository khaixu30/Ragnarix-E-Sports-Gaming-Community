<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const form = ref({
    email: '',
    password: ''
})

const handlelogin = async () => {
    error.value = ''
    loading.value = true
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: form.value.email,
                password: form.value.password
            })
        })

        const data = await response.json()

        if (!data.success) {
            error.value = data.message || 'Login failed. Please try again.';
            return;
        }

        localStorage.setItem('token', data.token)
        router.push('/dashboard')

    } catch (err) {
        error.value = 'Network error. Please try again.'
        console.error(err)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="page">

        <!-- Left: Branding -->
        <div class="left">
            <div class="left-bg"></div>
            <div class="left-content">
                <a href="/" class="brand">
                    <div class="brand-icon">R</div>
                    <span>Ragnarix</span>
                </a>
                <div class="left-body">
                    <p class="left-label"><i class="fa-solid fa-crosshairs"></i> Competitive Gaming Platform</p>
                    <h1>Welcome<br>Back<span class="dot">.</span></h1>
                    <p class="left-desc">
                        Your arena awaits. Log in to register for tournaments,
                        track your rank, and compete at the top level.
                    </p>
                    <div class="left-stats">
                        <div class="stat">
                            <p class="stat-num">12K+</p>
                            <p class="stat-label">Players</p>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat">
                            <p class="stat-num">340+</p>
                            <p class="stat-label">Events</p>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat">
                            <p class="stat-num">$85K</p>
                            <p class="stat-label">Prizes</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right: Form -->
        <div class="right">
            <div class="form-wrap">

                <div class="form-header">
                    <p class="form-label"><i class="fa-solid fa-right-to-bracket"></i> Sign In</p>
                    <h2>Access Your <span>Account</span></h2>
                    <p class="form-sub">Enter your credentials to continue.</p>
                </div>

                <!-- Error -->
                <div v-if="error" class="error-box">
                    <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
                </div>

                <form @submit.prevent="handlelogin" class="form">

                    <div class="field">
                        <label>Email Address</label>
                        <div class="input-wrap">
                            <i class="fa-solid fa-envelope input-icon"></i>
                            <input
                                type="email"
                                v-model="form.email"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div class="field">
                        <div class="field-top">
                            <label>Password</label>
                            <a href="/forgot-password" class="forgot">Forgot password?</a>
                        </div>
                        <div class="input-wrap">
                            <i class="fa-solid fa-lock input-icon"></i>
                            <input
                                :type="showPassword ? 'text' : 'password'"
                                v-model="form.password"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                class="eye-btn"
                                @click="showPassword = !showPassword"
                            >
                                <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="submit-btn" :disabled="loading">
                        <span v-if="!loading">
                            <i class="fa-solid fa-bolt"></i> Sign In
                        </span>
                        <span v-else>
                            <i class="fa-solid fa-spinner fa-spin"></i> Signing in...
                        </span>
                    </button>

                </form>

                <div class="divider">
                    <div class="divider-line"></div>
                    <span>or continue with</span>
                    <div class="divider-line"></div>
                </div>

                <div class="socials">
                    <button class="social-btn">
                        <i class="fa-brands fa-github"></i> GitHub
                    </button>
                    <button class="social-btn">
                        <i class="fa-brands fa-google"></i> Google
                    </button>
                </div>

                <p class="signup-link">
                    Don't have an account?
                    <a href="/register">Create one <i class="fa-solid fa-arrow-right"></i></a>
                </p>

            </div>
        </div>

    </div>
</template>

<style scoped>
.page {
    display: flex;
    height: 100vh;
    background: var(--bg-color);
    color: var(--text-color);
    overflow: hidden;
}

/* ── Left ── */
.left {
    flex: 1.1;
    position: relative;
    display: flex;
    align-items: stretch;
    overflow: hidden;
}

.left-bg {
    position: absolute;
    inset: 0;
    background: url('../../assets/backgrounds/login-bg.jpg') center/cover no-repeat;
    opacity: 0.18;
}

.left-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, transparent, var(--bg-color));
}

.left-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 40px 56px;
    width: 100%;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--text-color);
    margin-bottom: auto;
}

.brand-icon {
    width: 38px;
    height: 38px;
    background: var(--primary-color);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
    color: #fff;
}

.brand span {
    font-size: 20px;
    font-weight: 800;
}

.left-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-bottom: 48px;
}

.left-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary-color);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

h1 {
    font-size: 64px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 0.95;
    color: var(--text-color);
}

.dot {
    color: var(--primary-color);
}

.left-desc {
    font-size: 15px;
    opacity: 0.55;
    line-height: 1.75;
    max-width: 380px;
}

.left-stats {
    display: flex;
    align-items: center;
    gap: 24px;
    background: rgba(188, 103, 33, 0.08);
    border: 1px solid rgba(188, 103, 33, 0.2);
    border-radius: 12px;
    padding: 18px 24px;
    width: fit-content;
}

.stat { text-align: center; }

.stat-num {
    font-size: 22px;
    font-weight: 900;
    color: var(--primary-color);
    line-height: 1;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.5;
}

.stat-divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.08);
}

/* ── Right ── */
.right {
    flex: 0.9;
    background: #1e1a16;
    border-left: 1px solid rgba(188, 103, 33, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    overflow-y: auto;
}

.form-wrap {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ── Form header ── */
.form-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 4px;
}

.form-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--primary-color);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

h2 {
    font-size: 28px;
    font-weight: 900;
    text-transform: uppercase;
    color: var(--text-color);
}

h2 span { color: var(--primary-color); }

.form-sub {
    font-size: 13px;
    opacity: 0.5;
}

/* ── Error ── */
.error-box {
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(255, 107, 107, 0.08);
    border: 1px solid rgba(255, 107, 107, 0.25);
    color: #ff6b6b;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* ── Form fields ── */
.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
}

.forgot {
    font-size: 11px;
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
}

.forgot:hover { color: var(--hover-color); }

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 14px;
    font-size: 13px;
    color: var(--primary-color);
    opacity: 0.7;
    pointer-events: none;
}

.input-wrap input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 14px;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
}

.input-wrap input:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

.input-wrap input::placeholder { opacity: 0.3; }

.eye-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: var(--text-color);
    opacity: 0.4;
    cursor: pointer;
    font-size: 13px;
    padding: 4px;
    transition: opacity 0.2s;
}

.eye-btn:hover { opacity: 1; }

/* ── Submit ── */
.submit-btn {
    width: 100%;
    padding: 13px;
    border-radius: 10px;
    background: var(--primary-color);
    border: none;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.submit-btn:hover:not(:disabled) {
    background: var(--hover-color);
    transform: translateY(-1px);
}

.submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* ── Divider ── */
.divider {
    display: flex;
    align-items: center;
    gap: 12px;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
}

.divider span {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.35;
    white-space: nowrap;
}

/* ── Socials ── */
.socials {
    display: flex;
    gap: 10px;
}

.social-btn {
    flex: 1;
    padding: 11px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-color);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: border-color 0.2s, background 0.2s;
}

.social-btn:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

/* ── Signup link ── */
.signup-link {
    text-align: center;
    font-size: 13px;
    opacity: 0.5;
}

.signup-link a {
    color: var(--primary-color);
    font-weight: 700;
    text-decoration: none;
    opacity: 1;
    transition: color 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.signup-link a i { font-size: 10px; }
.signup-link a:hover { color: var(--hover-color); }

/* ── Responsive ── */
@media (max-width: 900px) {
    .left { display: none; }
    .right { flex: 1; border-left: none; }
}
</style>