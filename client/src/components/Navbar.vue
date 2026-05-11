<script setup>
import { onMounted, ref } from 'vue';

const user = ref(null);
const isLoggedIn = ref(false);
const menuOpen = ref(false);

onMounted(async () => {
    const userData = await check_and_fetch_auth();
    if (userData) {
        user.value = userData;
        isLoggedIn.value = true;
    }
});

const getInitials = (fullName) => {
    if (!fullName) return '?';
    return fullName
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const logout = () => {
    isLoggedIn.value = false;
    menuOpen.value = false;
    localStorage.removeItem('token');
    // add your actual logout logic here
};

const check_and_fetch_auth = async () => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            console.warn('No token found, user is not logged in.');
            return null;
        }

        const response = await fetch(`${import.meta.env.VITE_HOST}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data;

    } catch (err) {
        console.error(`Error fetching auth user: ${err}`);
        return null;
    }
};
</script>

<template>
    <nav class="navbar">

        <!-- Left: Logo -->
        <a class="logo" href="/">
            <div class="logo-icon">R</div>
            <span class="logo-text">Ragnarix</span>
        </a>

        <!-- Center: Links -->
        <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/events">Events</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
            <li><a href="/about">About</a></li>
        </ul>

        <!-- Right: Auth -->
        <div class="nav-right">

            <!-- Logged OUT -->
            <div v-if="!isLoggedIn" class="auth-links">
                <a class="btn-ghost" href="/register">Signup</a>
                <a class="btn-primary" href="/login">Login</a>
            </div>

            <!-- Logged IN -->
            <div v-else class="user-menu-wrap">
                <button class="user-trigger" @click="menuOpen = !menuOpen">
                    <!-- Avatar: profile pic or initials -->
                    <div class="user-avatar">
                        <img
                            v-if="user.profile_pic"
                            :src="user.profile_pic"
                            :alt="user.full_name"
                            class="avatar-img"
                        />
                        <span v-else>{{ getInitials(user.full_name) }}</span>
                    </div>
                    <span class="user-name">{{ user.full_name }}</span>
                    <i class="fa-solid fa-chevron-down chevron" :class="{ rotated: menuOpen }"></i>
                </button>

                <div class="dropdown" :class="{ open: menuOpen }">
                    <div class="dropdown-header">
                        <div class="user-avatar lg">
                            <img
                                v-if="user.profile_pic"
                                :src="user.profile_pic"
                                :alt="user.full_name"
                                class="avatar-img"
                            />
                            <span v-else>{{ getInitials(user.full_name) }}</span>
                        </div>
                        <div>
                            <p class="dh-name">{{ user.full_name }}</p>
                            <p class="dh-role">{{ user.account_type }}</p>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="/dashboard">
                        <i class="fa-solid fa-gauge"></i> Dashboard
                    </a>
                    <a class="dropdown-item" href="/dashboard/registrations">
                        <i class="fa-solid fa-file-signature"></i> My Registrations
                    </a>
                    <a class="dropdown-item" href="/dashboard/profile">
                        <i class="fa-solid fa-user"></i> Profile
                    </a>
                    <a class="dropdown-item" href="/leaderboard">
                        <i class="fa-solid fa-ranking-star"></i> My Rank
                    </a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item danger" @click="logout">
                        <i class="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                </div>

                <!-- backdrop -->
                <div v-if="menuOpen" class="backdrop" @click="menuOpen = false"></div>
            </div>

        </div>
    </nav>
</template>

<style scoped>
.navbar {
    width: 100%;
    padding: 0 40px;
    height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
    background: linear-gradient(to bottom, rgba(43, 38, 34, 0.95), transparent);
}

/* ── Logo ── */
.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
}

.logo-icon {
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

.logo-text {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-color);
    letter-spacing: 0.03em;
}

/* ── Nav links ── */
.nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
    list-style: none;
    padding: 0;
    margin: 0;
}

.nav-links a {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-color);
    text-decoration: none;
    padding: 8px 14px;
    border-radius: 8px;
    opacity: 0.7;
    transition: opacity 0.2s, background 0.2s;
}

.nav-links a:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.06);
}

/* ── Right ── */
.nav-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

/* ── Auth buttons ── */
.auth-links {
    display: flex;
    gap: 10px;
    align-items: center;
}

.btn-ghost {
    padding: 8px 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--text-color);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s;
}

.btn-ghost:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.08);
}

.btn-primary {
    padding: 8px 20px;
    border-radius: 8px;
    background: var(--primary-color);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-decoration: none;
    transition: background 0.2s;
}

.btn-primary:hover {
    background: var(--hover-color);
}

/* ── User trigger ── */
.user-menu-wrap {
    position: relative;
}

.user-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(188, 103, 33, 0.25);
    border-radius: 10px;
    padding: 6px 12px 6px 6px;
    cursor: pointer;
    color: var(--text-color);
    transition: border-color 0.2s, background 0.2s;
}

.user-trigger:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.08);
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 900;
    color: #fff;
    flex-shrink: 0;
    overflow: hidden; /* clips the img to the rounded shape */
}

.user-avatar.lg {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    font-size: 15px;
}

/* Profile pic inside avatar */
.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.user-name {
    font-size: 13px;
    font-weight: 700;
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chevron {
    font-size: 10px;
    opacity: 0.6;
    transition: transform 0.2s;
}

.chevron.rotated {
    transform: rotate(180deg);
}

/* ── Dropdown ── */
.dropdown {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 220px;
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.25);
    border-radius: 12px;
    padding: 8px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-8px);
    transition: opacity 0.2s, transform 0.2s;
    z-index: 200;
}

.dropdown.open {
    opacity: 1;
    pointer-events: all;
    transform: translateY(0);
}

.dropdown-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    margin-bottom: 4px;
}

.dh-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-color);
}

.dh-role {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--primary-color);
    margin-top: 2px;
}

.dropdown-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
    margin: 6px 0;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.75;
    transition: background 0.15s, opacity 0.15s;
    text-align: left;
}

.dropdown-item i {
    width: 16px;
    font-size: 13px;
    color: var(--primary-color);
    flex-shrink: 0;
}

.dropdown-item:hover {
    background: rgba(255, 255, 255, 0.05);
    opacity: 1;
}

.dropdown-item.danger {
    color: #ff6b6b;
    opacity: 0.75;
}

.dropdown-item.danger i {
    color: #ff6b6b;
}

.dropdown-item.danger:hover {
    background: rgba(255, 107, 107, 0.08);
    opacity: 1;
}

/* ── Backdrop ── */
.backdrop {
    position: fixed;
    inset: 0;
    z-index: 150;
}

/* ── Responsive ── */
@media (max-width: 768px) {
    .nav-links { display: none; }
    .navbar { padding: 0 20px; }
    .user-name { display: none; }
}
</style>