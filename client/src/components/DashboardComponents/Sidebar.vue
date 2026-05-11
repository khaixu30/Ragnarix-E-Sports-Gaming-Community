<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);

const getInitials = (full_name) => {
    if (!full_name) return '?';
    return full_name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const fetch_user_data = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const response = await fetch(`${import.meta.env.VITE_HOST}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const json = await response.json();

        if (!json.success) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            }
            return;
        }

        user.value = json.data;

    } catch (err) {
        console.error('Failed to fetch user:', err);
    }
};

const logout = () => {
    localStorage.removeItem('token');
    router.push('/login');
};

onMounted(() => {
    fetch_user_data();
});
</script>

<template>
    <div class="sidebar">

        <!-- Top: Logo -->
        <div class="sidebar-top">
            <a class="logo" href="/">
                <div class="logo-icon">R</div>
                <span class="logo-text">Ragnarix</span>
            </a>
        </div>

        <!-- Center: Nav -->
        <div class="sidebar-center">
            <p class="nav-section-label">Menu</p>
            <nav class="nav-links">
                <a class="nav-link" href="/dashboard">
                    <i class="fa-solid fa-gauge"></i>
                    <span>Dashboard</span>
                </a>
                <a class="nav-link" href="/events">
                    <i class="fa-solid fa-calendar-days"></i>
                    <span>Events</span>
                </a>
                <a class="nav-link" href="/dashboard/registrations">
                    <i class="fa-solid fa-clipboard"></i>
                    <span>Registrations</span>
                </a>
                <a class="nav-link" href="/dashboard/friends">
                    <i class="fa-solid fa-user-group"></i>
                    <span>Friends</span>
                </a>
                <a class="nav-link" href="/dashboard/chats">
                    <i class="fa-solid fa-comment"></i>
                    <span>Chats</span>
                </a>
                <a class="nav-link" href="/council">
                    <i class="fa-solid fa-landmark"></i>
                    <span>Council</span>
                </a>
            </nav>

            <p class="nav-section-label" style="margin-top: 24px;">Account</p>
            <nav class="nav-links">
                <a class="nav-link" href="/dashboard/profile">
                    <i class="fa-solid fa-user"></i>
                    <span>Profile</span>
                </a>
                <a class="nav-link" href="/dashboard/settings">
                    <i class="fa-solid fa-gear"></i>
                    <span>Settings</span>
                </a>
            </nav>
        </div>

        <!-- Bottom: User + Logout -->
        <div class="sidebar-bottom">
            <div class="sidebar-divider"></div>

            <!-- User card -->
            <a href="/dashboard/profile" class="user-card">
                <div class="user-avatar">
                    <img
                        v-if="user?.profile_pic"
                        :src="user.profile_pic"
                        :alt="user.full_name"
                    />
                    <span v-else>{{ getInitials(user?.full_name) }}</span>
                </div>
                <div class="user-info">
                    <p class="user-name">{{ user?.full_name || user?.username || 'Loading...' }}</p>
                </div>
                <i class="fa-solid fa-chevron-right user-arrow"></i>
            </a>

            <!-- Logout -->
            <button class="logout-btn" @click="logout">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Logout</span>
            </button>
        </div>

    </div>
</template>

<style scoped>
.sidebar {
    width: 240px;
    height: 100vh;
    background: var(--bg-color);
    border-right: 1px solid rgba(188, 103, 33, 0.15);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 0;
    flex-shrink: 0;
    position: sticky;
    top: 0;
}

/* ── Logo ── */
.sidebar-top {
    padding: 0 8px;
    margin-bottom: 28px;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
}

.logo-icon {
    width: 36px;
    height: 36px;
    background: var(--primary-color);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 900;
    color: #fff;
    flex-shrink: 0;
}

.logo-text {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-color);
    letter-spacing: 0.03em;
}

/* ── Center ── */
.sidebar-center {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
}

.sidebar-center::-webkit-scrollbar { display: none; }

.nav-section-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--primary-color);
    font-weight: 700;
    opacity: 0.6;
    padding: 0 12px;
    margin-bottom: 6px;
}

.nav-links {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 9px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
    text-decoration: none;
    opacity: 0.6;
    transition: all 0.2s ease;
}

.nav-link i {
    width: 16px;
    font-size: 13px;
    color: var(--primary-color);
    flex-shrink: 0;
}

.nav-link:hover {
    opacity: 1;
    background: rgba(188, 103, 33, 0.08);
    border-color: rgba(188, 103, 33, 0.2);
    color: var(--text-color);
}

.nav-link.active {
    opacity: 1;
    background: rgba(188, 103, 33, 0.12);
    border-color: rgba(188, 103, 33, 0.3);
    color: var(--text-color);
}

/* ── Bottom ── */
.sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.sidebar-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
    margin-bottom: 10px;
}

/* ── User card ── */
.user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(188, 103, 33, 0.15);
    background: rgba(188, 103, 33, 0.05);
    text-decoration: none;
    color: var(--text-color);
    transition: border-color 0.2s, background 0.2s;
}

.user-card:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.1);
}

.user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 900;
    color: #fff;
    flex-shrink: 0;
    overflow: hidden;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-info {
    flex: 1;
    min-width: 0;
}

.user-name {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
}

.user-meta {
    display: flex;
    align-items: center;
}

.verified-badge {
    font-size: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
}

.verified { color: #7effa0; }
.unverified { color: #ff6b6b; }

.user-arrow {
    font-size: 10px;
    opacity: 0.3;
    flex-shrink: 0;
}

/* ── Logout ── */
.logout-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 9px;
    border: 1px solid transparent;
    background: none;
    font-size: 13px;
    font-weight: 600;
    color: #ff6b6b;
    cursor: pointer;
    opacity: 0.65;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
}

.logout-btn i {
    width: 16px;
    font-size: 13px;
    flex-shrink: 0;
}

.logout-btn:hover {
    opacity: 1;
    background: rgba(255, 107, 107, 0.08);
    border-color: rgba(255, 107, 107, 0.2);
}
</style>