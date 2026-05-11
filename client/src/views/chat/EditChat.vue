<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageUpload from '../../components/ImgeUpload.vue';
import Sidebar from '../../components/DashboardComponents/Sidebar.vue';

const route = useRoute();
const router = useRouter();
const room_id = route.params.id;

const pageLoading = ref(true);
const loading = ref(false);
const error = ref('');
const success = ref('');
const showDeleteConfirm = ref(false);
const deleteLoading = ref(false);
const currentUser = ref({});

const form = ref({
    room_name: '',
    description: '',
    room_logo_url: '',
    visibility: 'Public',
    password: '',
    rules: ''
});

const token = localStorage.getItem('token');
const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// in fetch_room, after loading the room data:
const fetch_room = async () => {
    pageLoading.value = true;
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/room/id/${room_id}`, {
            headers: authHeaders
        });
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        const room = json.data;

        // ── Access control: only admin can edit ──────────────
        const userRes = await fetch(`${import.meta.env.VITE_HOST}/api/auth/me`, {
            headers: authHeaders
        });
        const userJson = await userRes.json();
        if (!userJson.success) {
            router.push('/login');
            return;
        }

        currentUser.value = userJson.data;

        if (room.admin_id !== currentUser.value.id) {
            router.push('/dashboard/chats'); // not the admin, kick them out
            return;
        }
        // ─────────────────────────────────────────────────────

        form.value.room_name     = room.room_name     || '';
        form.value.description   = room.description   || '';
        form.value.room_logo_url = room.room_logo_url || '';
        form.value.visibility    = room.visibility    || 'Public';
        form.value.rules         = room.rules         || '';

    } catch (err) {
        error.value = err.message || 'Failed to load room.';
    } finally {
        pageLoading.value = false;
    }
};

const handleUpdate = async () => {
    error.value = '';
    success.value = '';

    if (!form.value.room_name.trim()) {
        error.value = 'Room name is required.';
        return;
    }

    if (form.value.visibility === 'Private' && !form.value.password.trim()) {
        error.value = 'A password is required for private rooms.';
        return;
    }

    loading.value = true;
    try {
        const body = {
            room_name:    form.value.room_name.trim(),
            description:  form.value.description.trim(),
            room_logo_url: form.value.room_logo_url.trim(),
            visibility:   form.value.visibility,
            rules:        form.value.rules.trim()
        };

        // only send password if private and filled
        if (form.value.visibility === 'Private' && form.value.password.trim()) {
            body.password = form.value.password.trim();
        }

        const response = await fetch(`${import.meta.env.VITE_HOST}/api/room/update/${room_id}`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify(body)
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message);

        success.value = 'Room updated successfully!';
        setTimeout(() => router.push('/dashboard/chats'), 1400);

    } catch (err) {
        error.value = err.message || 'Failed to update room.';
    } finally {
        loading.value = false;
    }
};

const handleDelete = async () => {
    deleteLoading.value = true;
    try {
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/room/delete/${room_id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        router.push('/dashboard/chats');
    } catch (err) {
        error.value = err.message || 'Failed to delete room.';
        showDeleteConfirm.value = false;
    } finally {
        deleteLoading.value = false;
    }
};

onMounted(() => fetch_room());
</script>

<template>
    <div class="layout">
        <Sidebar />

        <main class="main">

            <div v-if="pageLoading" class="state-loading">
                <i class="fa-solid fa-spinner fa-spin"></i> Loading room...
            </div>

            <template v-else>

                <!-- Header -->
                <div class="page-header">
                    <div>
                        <p class="page-label">
                            <i class="fa-solid fa-pen-to-square"></i> Edit Room
                        </p>
                        <h1 class="page-title">
                            Update <span>{{ form.room_name || 'Room' }}</span>
                        </h1>
                        <p class="page-sub">Modify your room's details, logo, and settings.</p>
                    </div>
                    <div class="header-actions">
                        <a href="/dashboard/chats" class="btn-ghost">
                            <i class="fa-solid fa-arrow-left"></i> Back
                        </a>
                        <button class="btn-danger" @click="showDeleteConfirm = true">
                            <i class="fa-solid fa-trash"></i> Delete Room
                        </button>
                    </div>
                </div>

                <!-- Alerts -->
                <div v-if="error" class="alert error-box">
                    <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
                </div>
                <div v-if="success" class="alert success-box">
                    <i class="fa-solid fa-circle-check"></i> {{ success }}
                </div>

                <!-- Form -->
                <form class="form" @submit.prevent="handleUpdate">
                    <div class="form-grid">

                        <!-- Left col -->
                        <div class="form-col">

                            <!-- Logo upload -->
                            <div class="card">
                                <p class="card-heading">
                                    <i class="fa-solid fa-image"></i> Room Logo
                                </p>
                                <ImageUpload
                                    v-model="form.room_logo_url"
                                    label="Logo Image"
                                    placeholder="https://example.com/logo.png"
                                    previewHeight="200px"
                                />
                            </div>

                            <!-- Visibility -->
                            <div class="card">
                                <p class="card-heading">
                                    <i class="fa-solid fa-eye"></i> Visibility
                                </p>
                                <div class="toggle-row">
                                    <button
                                        type="button"
                                        class="toggle-btn"
                                        :class="{ active: form.visibility === 'Public' }"
                                        @click="form.visibility = 'Public'"
                                    >
                                        <i class="fa-solid fa-globe"></i> Public
                                    </button>
                                    <button
                                        type="button"
                                        class="toggle-btn"
                                        :class="{ active: form.visibility === 'Private' }"
                                        @click="form.visibility = 'Private'"
                                    >
                                        <i class="fa-solid fa-lock"></i> Private
                                    </button>
                                </div>
                                <p class="visibility-note">
                                    <span v-if="form.visibility === 'Public'">
                                        <i class="fa-solid fa-circle-info"></i>
                                        Anyone can find and join this room.
                                    </span>
                                    <span v-else>
                                        <i class="fa-solid fa-circle-info"></i>
                                        Only users with the password can join.
                                    </span>
                                </p>

                                <!-- Password (private only) -->
                                <div v-if="form.visibility === 'Private'" class="field" style="margin-top: 14px;">
                                    <label>
                                        <i class="fa-solid fa-key"></i> New Password
                                        <span class="optional">leave blank to keep current</span>
                                    </label>
                                    <div class="input-wrap">
                                        <i class="fa-solid fa-key input-icon"></i>
                                        <input
                                            type="password"
                                            v-model="form.password"
                                            placeholder="Set a new password"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Right col -->
                        <div class="form-col">

                            <div class="card">
                                <p class="card-heading">
                                    <i class="fa-solid fa-circle-info"></i> Room Details
                                </p>

                                <!-- Room name -->
                                <div class="field">
                                    <label><i class="fa-solid fa-hashtag"></i> Room Name</label>
                                    <div class="input-wrap">
                                        <i class="fa-solid fa-hashtag input-icon"></i>
                                        <input
                                            type="text"
                                            v-model="form.room_name"
                                            placeholder="e.g. CS2 Talk"
                                            maxlength="255"
                                            required
                                        />
                                    </div>
                                </div>

                                <!-- Description -->
                                <div class="field">
                                    <label>
                                        <i class="fa-solid fa-align-left"></i> Description
                                        <span class="optional">optional</span>
                                    </label>
                                    <textarea
                                        v-model="form.description"
                                        class="dash-textarea"
                                        placeholder="What's this room about?"
                                        rows="3"
                                    ></textarea>
                                </div>

                                <!-- Rules -->
                                <div class="field">
                                    <label>
                                        <i class="fa-solid fa-scroll"></i> Room Rules
                                        <span class="optional">optional</span>
                                    </label>
                                    <textarea
                                        v-model="form.rules"
                                        class="dash-textarea"
                                        placeholder="e.g. Be respectful. No spam. English only."
                                        rows="4"
                                    ></textarea>
                                </div>
                            </div>

                            <!-- Submit -->
                            <div class="form-actions">
                                <button type="submit" class="btn-primary" :disabled="loading">
                                    <span v-if="!loading">
                                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                                    </span>
                                    <span v-else>
                                        <i class="fa-solid fa-spinner fa-spin"></i> Saving...
                                    </span>
                                </button>
                                <a href="/dashboard/chats" class="btn-ghost">Cancel</a>
                            </div>

                        </div>
                    </div>
                </form>

            </template>

            <!-- ── Delete Confirm Modal ── -->
            <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
                <div class="modal">
                    <div class="modal-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h3>Delete Room?</h3>
                    <p>
                        This will permanently delete <strong>{{ form.room_name }}</strong> and
                        all its messages. This action cannot be undone.
                    </p>
                    <div class="modal-actions">
                        <button class="btn-danger" @click="handleDelete" :disabled="deleteLoading">
                            <span v-if="!deleteLoading">
                                <i class="fa-solid fa-trash"></i> Yes, Delete
                            </span>
                            <span v-else>
                                <i class="fa-solid fa-spinner fa-spin"></i> Deleting...
                            </span>
                        </button>
                        <button class="btn-ghost" @click="showDeleteConfirm = false">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

        </main>
    </div>
</template>

<style scoped>
/* ── Layout ── */
.layout {
    display: flex;
    min-height: 100vh;
    background: #1a1410;
    color: var(--text-color);
}

.main {
    flex: 1;
    padding: 40px 48px;
    overflow-y: auto;
    position: relative;
}

/* ── Loading ── */
.state-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 15px;
    opacity: 0.45;
    padding: 80px;
}

/* ── Page header ── */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
}

.page-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary-color);
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-title {
    font-size: 32px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1.05;
    margin-bottom: 6px;
}

.page-title span { color: var(--primary-color); }

.page-sub { font-size: 13px; opacity: 0.5; }

.header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}

/* ── Alerts ── */
.alert {
    margin-bottom: 24px;
    padding: 13px 16px;
    border-radius: 10px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.error-box {
    background: rgba(255, 107, 107, 0.08);
    border: 1px solid rgba(255, 107, 107, 0.25);
    color: #ff6b6b;
}

.success-box {
    background: rgba(80, 200, 120, 0.08);
    border: 1px solid rgba(80, 200, 120, 0.25);
    color: #7effa0;
}

/* ── Form grid ── */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 24px;
    align-items: start;
}

.form-col {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ── Card ── */
.card {
    background: var(--bg-color);
    border: 1px solid rgba(188, 103, 33, 0.18);
    border-radius: 14px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.card-heading {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

/* ── Fields ── */
.field {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
    font-weight: 400;
    text-transform: uppercase;
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
    font-family: inherit;
    transition: border-color 0.2s, background 0.2s;
}

.input-wrap input:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

.input-wrap input::placeholder { opacity: 0.3; }

.dash-textarea {
    width: 100%;
    padding: 11px 14px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    resize: vertical;
    font-family: inherit;
    min-height: 80px;
    transition: border-color 0.2s, background 0.2s;
}

.dash-textarea:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

.dash-textarea::placeholder { opacity: 0.3; }

/* ── Visibility toggle ── */
.toggle-row {
    display: flex;
    gap: 8px;
}

.toggle-btn {
    flex: 1;
    padding: 10px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: var(--text-color);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    opacity: 0.45;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
}

.toggle-btn.active {
    opacity: 1;
    background: rgba(188, 103, 33, 0.12);
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.visibility-note {
    font-size: 11px;
    opacity: 0.45;
    display: flex;
    align-items: center;
    gap: 7px;
}

.visibility-note i { color: var(--primary-color); opacity: 1; }

/* ── Form actions ── */
.form-actions {
    display: flex;
    gap: 12px;
}

/* ── Buttons ── */
.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 24px;
    border-radius: 9px;
    background: var(--primary-color);
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
}

.btn-primary:hover:not(:disabled) {
    background: var(--hover-color);
    transform: translateY(-1px);
}

.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: transparent;
    color: var(--text-color);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s;
}

.btn-ghost:hover {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.08);
}

.btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: 9px;
    border: 1px solid rgba(255, 107, 107, 0.25);
    background: rgba(255, 107, 107, 0.08);
    color: #ff6b6b;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s;
}

.btn-danger:hover:not(:disabled) {
    background: rgba(255, 107, 107, 0.15);
    border-color: rgba(255, 107, 107, 0.5);
}

.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Delete modal ── */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
}

.modal {
    background: var(--bg-color);
    border: 1px solid rgba(255, 107, 107, 0.25);
    border-radius: 16px;
    padding: 36px 40px;
    width: 400px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.modal-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #ff6b6b;
}

.modal h3 {
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
    color: #ff6b6b;
}

.modal p {
    font-size: 13px;
    opacity: 0.6;
    line-height: 1.7;
}

.modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    justify-content: center;
}

/* ── Responsive ── */
@media (max-width: 900px) {
    .main { padding: 24px 20px; }
    .form-grid { grid-template-columns: 1fr; }
    .page-header { flex-direction: column; }
}
</style>