<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const council_id = route.params.id;

const council = ref(null);
const members = ref([]);
const user = ref(null);
const loading = ref(true);
const error = ref('');

const isOwner = computed(() => user.value && council.value && user.value.id === council.value.owner_id);

const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });
};

const chipClass = (role) => {
    if (role === 'Tournament Director') return 'chip chip-director';
    if (role === 'Moderator') return 'chip chip-moderator';
    return 'chip chip-role';
};

const fetch_council = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/info/${council_id}`);
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        council.value = json.data;
    } catch (err) {
        error.value = err.message;
    }
};

const fetch_members = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/${council_id}/members`);
        const json = await response.json();
        if (json.success) members.value = json.data;
    } catch (err) {
        console.error('Members fetch error:', err);
    }
};

const fetch_user = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        if (json.success) user.value = json.data;
    } catch (err) {
        console.error(err);
    }
};

const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this council? This cannot be undone.')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/${council_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log(json)
        if (!json.success) throw new Error(json.message);
        router.push('/dashboard/council');
    } catch (err) {
        error.value = err.message;
    }
};

onMounted(async () => {
    await Promise.all([fetch_council(), fetch_members(), fetch_user()]);
    loading.value = false;
});
</script>

<template>
    <div class="dash-page">

        <div v-if="loading" class="state-loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading council...
        </div>

        <template v-else-if="council">

            <!-- Header -->
            <div class="dash-header">
                <div class="dash-header-left">
                    <p class="dash-label"><i class="fa-solid fa-landmark"></i> Council</p>
                    <h1 class="dash-title">{{ council.name }}</h1>
                    <p class="dash-subtitle">Created {{ formatDate(council.created_at) }}</p>
                </div>
                <div class="header-actions">
                    <a
                        v-if="isOwner"
                        :href="`/dashboard/council/${council_id}/edit`"
                        class="btn-ghost"
                    >
                        <i class="fa-solid fa-pen"></i> Edit
                    </a>
                    <a
                        v-if="isOwner"
                        :href="`/dashboard/council/${council_id}/members`"
                        class="btn-ghost"
                    >
                        <i class="fa-solid fa-user-plus"></i> Manage Members
                    </a>
                    <button v-if="isOwner" class="btn-danger" @click="handleDelete">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>

            <div v-if="error" class="error-box" style="margin-bottom:20px;">
                <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
            </div>

            <!-- Council info -->
            <div class="council-info">
                <div class="council-logo-wrap">
                    <img v-if="council.logo_url" :src="council.logo_url" :alt="council.name" class="council-logo" />
                    <div v-else class="council-logo-placeholder">
                        <i class="fa-solid fa-landmark"></i>
                    </div>
                </div>
                <div class="council-meta">
                    <p class="council-desc">{{ council.description || 'No description provided.' }}</p>
                    <div class="meta-chips">
                        <span class="chip chip-role">
                            <i class="fa-solid fa-users"></i> {{ members.length }} Members
                        </span>
                    </div>
                </div>
            </div>

            <div class="dash-divider"></div>

            <!-- Members table -->
            <p class="section-heading">
                <i class="fa-solid fa-user-group"></i> Council Members
            </p>

            <div v-if="members.length === 0" class="state-empty">
                <i class="fa-solid fa-user-slash"></i>
                <p>No members yet.</p>
            </div>

            <table v-else class="dash-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="member in members" :key="member.id">
                        <td><strong>@{{ member.username }}</strong></td>
                        <td style="opacity:0.55;">{{ member.email }}</td>
                        <td><span :class="chipClass(member.role)">{{ member.role }}</span></td>
                        <td style="opacity:0.45;font-size:12px;">{{ formatDate(member.joined_at) }}</td>
                    </tr>
                </tbody>
            </table>

        </template>

        <div v-else class="error-box">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ error || 'Council not found.' }}
        </div>

    </div>
</template>

<style scoped>
@import '../../assets/dashboard.css';

.header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
}

.council-info {
    display: flex;
    gap: 28px;
    align-items: flex-start;
}

.council-logo-wrap {
    flex-shrink: 0;
}

.council-logo {
    width: 120px;
    height: 120px;
    border-radius: 14px;
    object-fit: cover;
    border: 1px solid rgba(188, 103, 33, 0.3);
}

.council-logo-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 14px;
    background: rgba(188, 103, 33, 0.08);
    border: 1px solid rgba(188, 103, 33, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: var(--primary-color);
    opacity: 0.4;
}

.council-meta {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 4px;
}

.council-desc {
    font-size: 14px;
    opacity: 0.65;
    line-height: 1.75;
    max-width: 560px;
}

.meta-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
</style>