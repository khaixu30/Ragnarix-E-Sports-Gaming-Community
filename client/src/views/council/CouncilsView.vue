<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const council_id = route.params.id;

const members = ref([]);
const loading = ref(true);
const addLoading = ref(false);
const error = ref('');
const success = ref('');

const form = ref({
    user_id: '',
    role: 'Moderator'
});

const roles = ['Tournament Director', 'Moderator', 'Manager'];

const chipClass = (role) => {
    if (role === 'Tournament Director') return 'chip chip-director';
    if (role === 'Moderator') return 'chip chip-moderator';
    return 'chip chip-role';
};

const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const fetch_members = async () => {
    loading.value = true;
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/${council_id}/members`);
        const json = await response.json();
        if (json.success) members.value = json.data;
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const handleAdd = async () => {
    error.value = '';
    success.value = '';

    if (!form.value.user_id.trim()) {
        error.value = 'User ID is required.';
        return;
    }

    addLoading.value = true;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/${council_id}/members`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: form.value.user_id.trim(),
                role: form.value.role
            })
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message);

        success.value = 'Member added successfully.';
        form.value.user_id = '';
        await fetch_members();

    } catch (err) {
        error.value = err.message;
    } finally {
        addLoading.value = false;
    }
};

const handleRemove = async (user_id, username) => {
    if (!confirm(`Remove @${username} from this council?`)) return;
    error.value = '';
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/${council_id}/members/${user_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        success.value = `@${username} removed.`;
        await fetch_members();
    } catch (err) {
        error.value = err.message;
    }
};

onMounted(() => fetch_members());
</script>

<template>
    <div class="dash-page">

        <div class="dash-header">
            <div class="dash-header-left">
                <p class="dash-label"><i class="fa-solid fa-user-group"></i> Members</p>
                <h1 class="dash-title">Manage <span>Members</span></h1>
                <p class="dash-subtitle">Add or remove council organizers and assign their roles.</p>
            </div>
            <a :href="`/dashboard/council/${council_id}`" class="btn-ghost">
                <i class="fa-solid fa-arrow-left"></i> Back to Council
            </a>
        </div>

        <div v-if="error" class="error-box" style="margin-bottom:20px;">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
        </div>
        <div v-if="success" class="success-box" style="margin-bottom:20px;">
            <i class="fa-solid fa-circle-check"></i> {{ success }}
        </div>

        <!-- Add member form -->
        <div class="add-form">
            <p class="section-heading">
                <i class="fa-solid fa-user-plus"></i> Add Member
            </p>
            <form class="add-row" @submit.prevent="handleAdd">
                <div class="input-wrap" style="flex:1;">
                    <i class="fa-solid fa-id-badge input-icon"></i>
                    <input
                        type="text"
                        v-model="form.user_id"
                        placeholder="User ID (UUID)"
                        required
                    />
                </div>
                <select v-model="form.role" class="role-select">
                    <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
                </select>
                <button type="submit" class="btn-primary" :disabled="addLoading">
                    <span v-if="!addLoading"><i class="fa-solid fa-plus"></i> Add</span>
                    <span v-else><i class="fa-solid fa-spinner fa-spin"></i></span>
                </button>
            </form>
        </div>

        <div class="dash-divider"></div>

        <!-- Members table -->
        <p class="section-heading">
            <i class="fa-solid fa-users"></i> Current Members ({{ members.length }})
        </p>

        <div v-if="loading" class="state-loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading members...
        </div>

        <div v-else-if="members.length === 0" class="state-empty">
            <i class="fa-solid fa-user-slash"></i>
            <p>No members yet. Add someone above.</p>
        </div>

        <table v-else class="dash-table">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="member in members" :key="member.id">
                    <td><strong>@{{ member.username }}</strong></td>
                    <td style="opacity:0.55;font-size:12px;">{{ member.email }}</td>
                    <td><span :class="chipClass(member.role)">{{ member.role }}</span></td>
                    <td style="opacity:0.45;font-size:12px;">{{ formatDate(member.joined_at) }}</td>
                    <td>
                        <button
                            class="remove-btn"
                            @click="handleRemove(member.id, member.username)"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

    </div>
</template>

<style scoped>
@import '../../assets/dashboard.css';

.add-form {
    margin-bottom: 8px;
}

.add-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.add-row .input-wrap {
    min-width: 240px;
}

.add-row .input-wrap input {
    width: 100%;
    padding: 11px 14px 11px 38px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
}

.add-row .input-wrap input:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

.add-row .input-wrap input::placeholder { opacity: 0.3; }

.role-select {
    padding: 11px 14px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.2s;
}

.role-select:focus {
    border-color: var(--primary-color);
}

.remove-btn {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    border: 1px solid rgba(255, 107, 107, 0.2);
    background: rgba(255, 107, 107, 0.06);
    color: #ff6b6b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    transition: background 0.2s, border-color 0.2s;
}

.remove-btn:hover {
    background: rgba(255, 107, 107, 0.15);
    border-color: rgba(255, 107, 107, 0.4);
}
</style>