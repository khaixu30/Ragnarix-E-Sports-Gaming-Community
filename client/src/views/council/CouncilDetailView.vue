<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const props  = defineProps({ id: String });
const router = useRouter();

const council = ref(null);
const members = ref([]);
const events  = ref([]);
const loading = ref(true);

const BASE = import.meta.env.VITE_HOST;

const authHeaders = () => ({
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const isOwner = computed(() => {
    const token = localStorage.getItem('token');
    if (!token || !council.value) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id === council.value.owner_id || payload._id === council.value.owner_id;
    } catch { return false; }
});

const statusClass = (status) => ({
    'Upcoming':  'badge-upcoming',
    'Live':      'badge-live',
    'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled',
}[status] || '');

onMounted(async () => {
    try {
        const [councilRes, membersRes, eventsRes] = await Promise.all([
            fetch(`${BASE}/api/councils/info/${props.id}`).then(r => r.json()),
            fetch(`${BASE}/api/councils/${props.id}/members`).then(r => r.json()),
            fetch(`${BASE}/api/events?council_id=${props.id}`).then(r => r.json()),
        ]);
        if (councilRes.success) council.value = councilRes.data;
        if (membersRes.success) members.value = membersRes.data;
        if (eventsRes.success)  events.value  = eventsRes.events;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="page">
        <div v-if="loading" class="loading-state"><span class="spinner"></span></div>

        <template v-else-if="council">
            <div class="council-header">
                <div class="council-logo">
                    <img v-if="council.logo_url" :src="council.logo_url" :alt="council.name" />
                    <span v-else>{{ council.name[0].toUpperCase() }}</span>
                </div>
                <div class="header-info">
                    <h1 class="council-name">{{ council.name }}</h1>
                    <p class="council-desc">{{ council.description || 'No description provided.' }}</p>
                    <p class="council-meta">
                        <i class="fa-solid fa-users"></i> {{ members.length }} members
                        <span class="dot">·</span>
                        <i class="fa-solid fa-calendar-days"></i> {{ events.length }} events
                    </p>
                </div>
                <a v-if="isOwner" :href="`/councils/${id}/dashboard`" class="btn-primary">
                    <i class="fa-solid fa-gauge"></i> Manage
                </a>
            </div>

            <div class="content-grid">
                <div class="section">
                    <h2 class="section-title">Events</h2>
                    <div v-if="!events.length" class="empty-text">No events yet.</div>
                    <div
                        v-for="event in events" :key="event.id" class="event-row"
                        @click="router.push({ name: 'event-detail', params: { id: event.id } })"
                    >
                        <div class="event-info">
                            <span class="event-title">{{ event.title }}</span>
                            <span class="event-meta">
                                {{ new Date(event.start_time).toLocaleDateString() }}
                                <span class="dot">·</span> {{ event.event_type }}
                            </span>
                        </div>
                        <span class="badge" :class="statusClass(event.status)">{{ event.status }}</span>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">Team</h2>
                    <div v-if="!members.length" class="empty-text">No members yet.</div>
                    <div v-for="member in members" :key="member.id" class="member-row">
                        <div class="member-avatar">{{ member.username[0].toUpperCase() }}</div>
                        <div class="member-info">
                            <span class="member-name">{{ member.username }}</span>
                            <span class="member-role">{{ member.role }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.page { padding: 32px; max-width: 900px; }
.council-header {
    display: flex; align-items: flex-start; gap: 18px; padding: 24px; border-radius: 14px;
    margin-bottom: 28px; border: 1px solid rgba(188,103,33,0.15); background: rgba(188,103,33,0.03);
}
.council-logo {
    width: 64px; height: 64px; border-radius: 14px; flex-shrink: 0; background: rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900;
    color: var(--primary-color); overflow: hidden;
}
.council-logo img { width: 100%; height: 100%; object-fit: cover; }
.header-info { flex: 1; }
.council-name { font-size: 22px; font-weight: 800; color: var(--text-color); margin-bottom: 5px; }
.council-desc { font-size: 13px; color: var(--text-color); opacity: 0.5; margin-bottom: 8px; }
.council-meta { font-size: 12px; color: var(--text-color); opacity: 0.4; display: flex; align-items: center; gap: 6px; }
.council-meta i { font-size: 11px; }
.dot { opacity: 0.5; }
.btn-primary {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 9px;
    font-size: 13px; font-weight: 700; white-space: nowrap; background: var(--primary-color);
    color: #fff; text-decoration: none; border: none; transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.85; }
.content-grid { display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
.section {
    border-radius: 12px; border: 1px solid rgba(188,103,33,0.12);
    background: rgba(188,103,33,0.02); padding: 18px 20px;
}
.section-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--primary-color); opacity: 0.7; margin-bottom: 14px;
}
.empty-text { font-size: 13px; color: var(--text-color); opacity: 0.3; text-align: center; padding: 20px 0; }
.event-row {
    display: flex; align-items: center; justify-content: space-between; padding: 10px 0;
    border-bottom: 1px solid rgba(188,103,33,0.08); cursor: pointer; transition: opacity 0.15s;
}
.event-row:last-child { border-bottom: none; }
.event-row:hover { opacity: 0.7; }
.event-info { display: flex; flex-direction: column; gap: 2px; }
.event-title { font-size: 13px; font-weight: 600; color: var(--text-color); }
.event-meta { font-size: 11px; color: var(--text-color); opacity: 0.4; display: flex; align-items: center; gap: 4px; }
.badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
.badge-upcoming { background: rgba(59,109,17,0.15); color: #7effa0; }
.badge-live { background: rgba(188,103,33,0.15); color: var(--primary-color); }
.badge-completed { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.45); }
.badge-cancelled { background: rgba(255,107,107,0.1); color: #ff6b6b; }
.member-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(188,103,33,0.08); }
.member-row:last-child { border-bottom: none; }
.member-avatar {
    width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0; background: rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: var(--primary-color);
}
.member-info { display: flex; flex-direction: column; gap: 1px; }
.member-name { font-size: 12px; font-weight: 700; color: var(--text-color); }
.member-role { font-size: 11px; color: var(--text-color); opacity: 0.4; }
.loading-state { display: flex; justify-content: center; padding: 80px 0; }
.spinner {
    width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(188,103,33,0.2);
    border-top-color: var(--primary-color); animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>