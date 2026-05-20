<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route  = useRoute();

const user            = ref(null);
const myCouncils      = ref([]);
const councilOpen     = ref(false);
const loadingCouncils = ref(false);

const BASE = import.meta.env.VITE_HOST;

const getInitials = (full_name) => {
    if (!full_name) return '?';
    return full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const isActive = (path) => route.path.startsWith(path);

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
        const res  = await fetch(`${BASE}/api/auth/me`, { headers: authHeaders() });
        const json = await res.json();
        if (!json.success) {
            if (res.status === 401) { localStorage.removeItem('token'); router.push('/login'); }
            return;
        }
        user.value = json.data;
        await fetchMyCouncils();
    } catch (err) {
        console.error('Failed to fetch user:', err);
    }
};

const fetchMyCouncils = async () => {
    loadingCouncils.value = true;
    try {
        const res  = await fetch(`${BASE}/api/council/mine`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success) {
            myCouncils.value = json.data;
            if (route.path.startsWith('/councils')) councilOpen.value = true;
        }
    } catch (err) {
        console.error('Failed to fetch councils:', err);
    } finally {
        loadingCouncils.value = false;
    }
};

const goToDashboard = (council) => {
    // if (council.user_role === 'owner') {
    //     // console.log(`/councils/${council.id}/dashboard`)
    //     router.push(`/councils/${council.id}/dashboard`);
    // } else {
    //     router.push(`/`);
    // }
    router.push(`/councils/${council.id}/dashboard`)
};

const logout = () => {
    localStorage.removeItem('token');
    router.push('/login');
};

onMounted(fetchUser);
</script>

<template>
    <div class="sidebar">
        <div class="sidebar-top">
            <a class="logo" href="/">
                <div class="logo-icon">R</div>
                <span class="logo-text">Ragnarix</span>
            </a>
        </div>

        <div class="sidebar-center">
            <p class="nav-section-label">Menu</p>
            <nav class="nav-links">
                <a class="nav-link" :class="{ active: route.path === '/dashboard' }" href="/dashboard">
                    <i class="fa-solid fa-gauge"></i><span>Dashboard</span>
                </a>
                <a class="nav-link" :class="{ active: isActive('/events') }" href="/events">
                    <i class="fa-solid fa-calendar-days"></i><span>Events</span>
                </a>
                <a class="nav-link" :class="{ active: isActive('/dashboard/registrations') }" href="/dashboard/registrations">
                    <i class="fa-solid fa-clipboard"></i><span>Registrations</span>
                </a>
                <a class="nav-link" :class="{ active: isActive('/dashboard/friends') }" href="/dashboard/friends">
                    <i class="fa-solid fa-user-group"></i><span>Friends</span>
                </a>
                <a class="nav-link" :class="{ active: isActive('/dashboard/chats') }" href="/dashboard/chats">
                    <i class="fa-solid fa-comment"></i><span>Chats</span>
                </a>
            </nav>

            <!-- Council Section -->
            <div class="council-section">
                <button class="council-header" :class="{ open: councilOpen }" @click="councilOpen = !councilOpen">
                    <span class="council-header-left">
                        <i class="fa-solid fa-landmark"></i>
                        <span>Council</span>
                    </span>
                    <span class="council-meta">
                        <span v-if="myCouncils.length" class="council-count">{{ myCouncils.length }}</span>
                        <i class="fa-solid fa-chevron-down council-chevron" :class="{ rotated: councilOpen }"></i>
                    </span>
                </button>

                <div class="council-dropdown" :class="{ open: councilOpen }">
                    <div v-if="loadingCouncils" class="council-loading">
                        <span class="dot-pulse"></span>
                    </div>
                    <template v-else>
                        <button
                            v-for="council in myCouncils" :key="council.id"
                            class="council-item" :class="{ active: route.path.includes(council.id) }"
                            @click="goToDashboard(council)"
                        >
                            <div class="council-avatar">
                                <img v-if="council.logo_url" :src="council.logo_url" :alt="council.name" />
                                <span v-else>{{ council.name[0].toUpperCase() }}</span>
                            </div>
                            <span class="council-name">{{ council.name }}</span>
                            <span class="council-role-badge" :class="council.user_role">
                                {{ council.user_role === 'owner' ? '★' : '·' }}
                            </span>
                        </button>
                        <p v-if="!myCouncils.length" class="council-empty">No councils yet</p>
                    </template>
                    <div class="council-actions">
                        <a href="/councils" class="council-action-link">
                            <i class="fa-solid fa-globe"></i> Browse all
                        </a>
                        <a href="/councils/create" class="council-action-link create">
                            <i class="fa-solid fa-plus"></i> Create
                        </a>
                    </div>
                </div>
            </div>

            <p class="nav-section-label" style="margin-top: 24px;">Account</p>
            <nav class="nav-links">
                <a class="nav-link" :class="{ active: isActive('/dashboard/profile') }" href="/dashboard/profile">
                    <i class="fa-solid fa-user"></i><span>Profile</span>
                </a>
                <a class="nav-link" :class="{ active: isActive('/dashboard/settings') }" href="/dashboard/settings">
                    <i class="fa-solid fa-gear"></i><span>Settings</span>
                </a>
            </nav>
        </div>

        <div class="sidebar-bottom">
            <div class="sidebar-divider"></div>
            <a href="/dashboard/profile" class="user-card">
                <div class="user-avatar">
                    <img v-if="user?.profile_pic" :src="user.profile_pic" :alt="user.full_name" />
                    <span v-else>{{ getInitials(user?.full_name) }}</span>
                </div>
                <div class="user-info">
                    <p class="user-name">{{ user?.full_name || user?.username || 'Loading...' }}</p>
                </div>
                <i class="fa-solid fa-chevron-right user-arrow"></i>
            </a>
            <button class="logout-btn" @click="logout">
                <i class="fa-solid fa-right-from-bracket"></i><span>Logout</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.sidebar {
    width: 240px; height: 100vh; background: var(--bg-color);
    border-right: 1px solid rgba(188,103,33,0.15); padding: 24px 16px;
    display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0;
}
.sidebar-top { padding: 0 8px; margin-bottom: 28px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.logo-icon {
    width: 36px; height: 36px; background: var(--primary-color); border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 900; color: #fff; flex-shrink: 0;
}
.logo-text { font-size: 18px; font-weight: 800; color: var(--text-color); letter-spacing: 0.03em; }
.sidebar-center { flex: 1; overflow-y: auto; scrollbar-width: none; }
.sidebar-center::-webkit-scrollbar { display: none; }
.nav-section-label {
    font-size: 9px; text-transform: uppercase; letter-spacing: 0.16em;
    color: var(--primary-color); font-weight: 700; opacity: 0.6; padding: 0 12px; margin-bottom: 6px;
}
.nav-links { display: flex; flex-direction: column; gap: 2px; }
.nav-link {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px;
    border-radius: 9px; border: 1px solid transparent; font-size: 13px;
    font-weight: 600; color: var(--text-color); text-decoration: none; opacity: 0.6; transition: all 0.2s ease;
}
.nav-link i { width: 16px; font-size: 13px; color: var(--primary-color); flex-shrink: 0; }
.nav-link:hover { opacity: 1; background: rgba(188,103,33,0.08); border-color: rgba(188,103,33,0.2); }
.nav-link.active { opacity: 1; background: rgba(188,103,33,0.12); border-color: rgba(188,103,33,0.3); }
.council-section { margin: 4px 0; }
.council-header {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 9px; border: 1px solid transparent; background: none;
    font-size: 13px; font-weight: 600; color: var(--text-color); opacity: 0.6; cursor: pointer; transition: all 0.2s;
}
.council-header:hover, .council-header.open { opacity: 1; background: rgba(188,103,33,0.08); border-color: rgba(188,103,33,0.2); }
.council-header-left { display: flex; align-items: center; gap: 12px; }
.council-header-left i { width: 16px; font-size: 13px; color: var(--primary-color); }
.council-meta { display: flex; align-items: center; gap: 6px; }
.council-count {
    font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 20px;
    background: rgba(188,103,33,0.18); color: var(--primary-color);
}
.council-chevron { font-size: 9px; transition: transform 0.2s; }
.council-chevron.rotated { transform: rotate(180deg); }
.council-dropdown { max-height: 0; overflow: hidden; opacity: 0; padding: 0 4px; transition: max-height 0.3s, opacity 0.2s; }
.council-dropdown.open { max-height: 300px; opacity: 1; padding: 4px; }
.council-item {
    width: 100%; display: flex; align-items: center; gap: 9px; padding: 7px 10px;
    border-radius: 8px; border: none; background: none; cursor: pointer; font-size: 12px;
    font-weight: 600; color: var(--text-color); opacity: 0.7; transition: all 0.15s; text-align: left;
}
.council-item:hover, .council-item.active { opacity: 1; background: rgba(188,103,33,0.08); }
.council-avatar {
    width: 22px; height: 22px; border-radius: 5px; background: rgba(188,103,33,0.2);
    display: flex; align-items: center; justify-content: center; font-size: 10px;
    font-weight: 800; color: var(--primary-color); flex-shrink: 0; overflow: hidden;
}
.council-avatar img { width: 100%; height: 100%; object-fit: cover; }
.council-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.council-role-badge { font-size: 11px; flex-shrink: 0; }
.council-role-badge.owner { color: var(--primary-color); }
.council-empty { font-size: 11px; color: var(--text-color); opacity: 0.35; padding: 6px 10px; text-align: center; }
.council-loading { display: flex; justify-content: center; padding: 10px; }
.dot-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); opacity: 0.5; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:.3}50%{opacity:.9} }
.council-actions { display: flex; gap: 4px; padding: 6px 2px 2px; border-top: 1px solid rgba(188,103,33,0.1); margin-top: 4px; }
.council-action-link {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
    padding: 6px 8px; border-radius: 7px; font-size: 11px; font-weight: 600;
    text-decoration: none; color: var(--text-color); opacity: 0.5; border: 1px solid rgba(188,103,33,0.1); transition: all 0.15s;
}
.council-action-link:hover { opacity: 1; border-color: rgba(188,103,33,0.3); }
.council-action-link.create { background: rgba(188,103,33,0.1); color: var(--primary-color); opacity: 0.8; }
.council-action-link.create:hover { opacity: 1; background: rgba(188,103,33,0.2); }
.sidebar-bottom { display: flex; flex-direction: column; gap: 6px; }
.sidebar-divider { height: 1px; background: rgba(255,255,255,0.07); margin-bottom: 10px; }
.user-card {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
    border: 1px solid rgba(188,103,33,0.15); background: rgba(188,103,33,0.05);
    text-decoration: none; color: var(--text-color); transition: border-color 0.2s, background 0.2s;
}
.user-card:hover { border-color: var(--primary-color); background: rgba(188,103,33,0.1); }
.user-avatar {
    width: 36px; height: 36px; border-radius: 9px; background: var(--primary-color);
    display: flex; align-items: center; justify-content: center; font-size: 13px;
    font-weight: 900; color: #fff; flex-shrink: 0; overflow: hidden;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-arrow { font-size: 10px; opacity: 0.3; flex-shrink: 0; }
.logout-btn {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 9px;
    border: 1px solid transparent; background: none; font-size: 13px; font-weight: 600;
    color: #ff6b6b; cursor: pointer; opacity: 0.65; transition: all 0.2s; width: 100%;
}
.logout-btn i { width: 16px; font-size: 13px; flex-shrink: 0; }
.logout-btn:hover { opacity: 1; background: rgba(255,107,107,0.08); border-color: rgba(255,107,107,0.2); }
</style>