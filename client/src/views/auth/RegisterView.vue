<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

const form = ref({
    username: '',
    full_name: '',
    email: '',
    phone_number: '',
    about_info: '',
    password: '',
    confirmPassword: ''
})

const handleSignup = async () => {
    error.value = ''

    if (form.value.password !== form.value.confirmPassword) {
        error.value = 'Passwords do not match.'
        return
    }

    loading.value = true
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: form.value.username,
                full_name: form.value.full_name,
                email: form.value.email,
                phone_number: form.value.phone_number,
                about_info: form.value.about_info,
                password: form.value.password
            })
        })

        const data = await response.json()

        if (!data.success) {
            error.value = data.message || 'Signup failed. Please try again.'
            return
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
                    <p class="left-label">
                        <i class="fa-solid fa-user-plus"></i> Create Account
                    </p>
                    <h1>Join the<br><span>Arena</span><span class="dot">.</span></h1>
                    <p class="left-desc">
                        Sign up and become part of the most competitive
                        gaming community. Register for tournaments, climb
                        the leaderboards, and claim your glory.
                    </p>
                    <div class="feature-list">
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fa-solid fa-trophy"></i>
                            </div>
                            <div>
                                <p class="feature-title">Compete in Tournaments</p>
                                <p class="feature-desc">Register for upcoming events across multiple games.</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fa-solid fa-ranking-star"></i>
                            </div>
                            <div>
                                <p class="feature-title">Track Your Rank</p>
                                <p class="feature-desc">Live leaderboards updated after every event.</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fa-solid fa-users"></i>
                            </div>
                            <div>
                                <p class="feature-title">Join the Community</p>
                                <p class="feature-desc">Connect with 12,000+ players across all platforms.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right: Form -->
        <div class="right">
            <div class="form-wrap">

                <div class="form-header">
                    <p class="form-label">
                        <i class="fa-solid fa-gamepad"></i> Get Started
                    </p>
                    <h2>Create Your <span>Account</span></h2>
                    <p class="form-sub">Fill in your details to join the platform.</p>
                </div>

                <!-- Error -->
                <div v-if="error" class="error-box">
                    <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
                </div>

                <form @submit.prevent="handleSignup" class="form">

                    <!-- Row: username + full name -->
                    <div class="field-row">
                        <div class="field">
                            <label>Username</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-at input-icon"></i>
                                <input
                                    type="text"
                                    v-model="form.username"
                                    placeholder="xKnight99"
                                    maxlength="25"
                                    required
                                />
                            </div>
                        </div>
                        <div class="field">
                            <label>Full Name</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-user input-icon"></i>
                                <input
                                    type="text"
                                    v-model="form.full_name"
                                    placeholder="Ahmad Raza"
                                    maxlength="50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Email -->
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

                    <!-- Phone -->
                    <div class="field">
                        <label>Phone Number <span class="optional">optional</span></label>
                        <div class="input-wrap">
                            <i class="fa-solid fa-phone input-icon"></i>
                            <input
                                type="tel"
                                v-model="form.phone_number"
                                placeholder="+92 300 0000000"
                            />
                        </div>
                    </div>

                    <!-- About -->
                    <div class="field">
                        <label>About <span class="optional">optional</span></label>
                        <div class="textarea-wrap">
                            <textarea
                                v-model="form.about_info"
                                placeholder="Tell the community a bit about yourself..."
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    <!-- Row: password + confirm -->
                    <div class="field-row">
                        <div class="field">
                            <label>Password</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input
                                    :type="showPassword ? 'text' : 'password'"
                                    v-model="form.password"
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                                    <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                </button>
                            </div>
                        </div>
                        <div class="field">
                            <label>Confirm Password</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input
                                    :type="showConfirm ? 'text' : 'password'"
                                    v-model="form.confirmPassword"
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" class="eye-btn" @click="showConfirm = !showConfirm">
                                    <i :class="showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="submit-btn" :disabled="loading">
                        <span v-if="!loading">
                            <i class="fa-solid fa-bolt"></i> Create Account
                        </span>
                        <span v-else>
                            <i class="fa-solid fa-spinner fa-spin"></i> Creating account...
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

                <p class="signin-link">
                    Already have an account?
                    <a href="/login">Sign in <i class="fa-solid fa-arrow-right"></i></a>
                </p>

            </div>
        </div>

    </div>
</template>

<style scoped>
.page {
    display: flex;
    min-height: 100vh;
    background: var(--bg-color);
    color: var(--text-color);
    overflow: hidden;
}

/* ── Left ── */
.left {
    flex: 1;
    position: relative;
    display: flex;
    align-items: stretch;
    overflow: hidden;
}

.left-bg {
    position: absolute;
    inset: 0;
    background: url('../../assets/backgrounds/login-bg.jpg') center/cover no-repeat;
    opacity: 0.15;
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
    gap: 24px;
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
    font-size: 56px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 0.95;
    color: var(--text-color);
}

h1 span { color: var(--primary-color); }
.dot { color: var(--primary-color); }

.left-desc {
    font-size: 14px;
    opacity: 0.55;
    line-height: 1.75;
    max-width: 360px;
}

/* ── Feature list ── */
.feature-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.feature-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: rgba(188, 103, 33, 0.06);
    border: 1px solid rgba(188, 103, 33, 0.15);
    border-radius: 10px;
    padding: 14px 16px;
}

.feature-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(188, 103, 33, 0.15);
    border: 1px solid rgba(188, 103, 33, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);
    font-size: 14px;
    flex-shrink: 0;
}

.feature-title {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 3px;
}

.feature-desc {
    font-size: 11px;
    opacity: 0.5;
    line-height: 1.5;
}

/* ── Right ── */
.right {
    flex: 1.1;
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
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ── Form header ── */
.form-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
    font-size: 26px;
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

/* ── Form ── */
.form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.65;
    display: flex;
    align-items: center;
    gap: 6px;
}

.optional {
    font-size: 9px;
    opacity: 0.4;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 400;
}

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 13px;
    font-size: 12px;
    color: var(--primary-color);
    opacity: 0.7;
    pointer-events: none;
}

.input-wrap input {
    width: 100%;
    padding: 11px 14px 11px 38px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
}

.input-wrap input:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

.input-wrap input::placeholder { opacity: 0.3; }

.textarea-wrap textarea {
    width: 100%;
    padding: 11px 14px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    resize: none;
    font-family: inherit;
    transition: border-color 0.2s, background 0.2s;
}

.textarea-wrap textarea:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

.textarea-wrap textarea::placeholder { opacity: 0.3; }

.eye-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: var(--text-color);
    opacity: 0.4;
    cursor: pointer;
    font-size: 12px;
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

/* ── Signin link ── */
.signin-link {
    text-align: center;
    font-size: 13px;
    opacity: 0.5;
}

.signin-link a {
    color: var(--primary-color);
    font-weight: 700;
    text-decoration: none;
    opacity: 1;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s;
}

.signin-link a i { font-size: 10px; }
.signin-link a:hover { color: var(--hover-color); }

/* ── Responsive ── */
@media (max-width: 1024px) {
    .left { display: none; }
    .right { flex: 1; border-left: none; }
}

@media (max-width: 560px) {
    .right { padding: 32px 24px; }
    .field-row { grid-template-columns: 1fr; }
}
</style>