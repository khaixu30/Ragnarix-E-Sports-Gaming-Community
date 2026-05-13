<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ImageUpload from '../../components/ImgeUpload.vue';   // ← import

const router = useRouter();
const HOST = import.meta.env.VITE_HOST;

const user = ref(null);
const loading = ref(true);
const editing = ref(false);
const saving = ref(false);
const msg = ref({ text: '', type: '' });

const form = ref({
    full_name: '',
    username: '',
    phone_number: '',
    about_info: '',
    profile_pic: ''
});

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
};

// ── Fetch current user ───────────────────────────────────
const fetchUser = async () => {
    loading.value = true;
    try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const res = await fetch(`${HOST}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) { router.push('/login'); return; }

        user.value = json.data;
        syncForm(json.data);
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// ── Sync form fields from a user object ─────────────────
const syncForm = (u) => {
    form.value = {
        full_name: u.full_name || '',
        username: u.username || '',
        phone_number: u.phone_number || '',
        about_info: u.about_info || '',
        profile_pic: u.profile_pic || ''
    };
};

// ── Called by ImageUpload when a URL is ready ────────────
const onImageUploaded = (url) => {
    form.value.profile_pic = url;
};

// ── Save via PATCH /api/auth/me ──────────────────────────
const saveProfile = async () => {
    saving.value = true;
    msg.value = { text: '', type: '' };
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${HOST}/api/auth/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(form.value)
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        user.value = json.data;
        editing.value = false;
        msg.value = { text: 'Profile updated successfully.', type: 'success' };
    } catch (err) {
        msg.value = { text: err.message || 'Failed to save.', type: 'error' };
    } finally {
        saving.value = false;
    }
};

// ── Cancel — restore form from current user data ─────────
const cancelEdit = () => {
    editing.value = false;
    msg.value = { text: '', type: '' };
    syncForm(user.value);
};

onMounted(fetchUser);
</script>

<template>
    <div class="profile-page">

        <div v-if="loading" class="full-state">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading profile...
        </div>

        <template v-else-if="user">

            <!-- ── Hero banner ── -->
            <div class="profile-hero">
                <div class="hero-grid"></div>
                <div class="hero-content">
                    <!-- Avatar -->
                    <div class="avatar-wrap">
                        <div class="avatar">
                            <img v-if="user.profile_pic" :src="user.profile_pic" :alt="user.full_name"
                                class="avatar-img" />
                            <span v-else>{{ getInitials(user.full_name) }}</span>
                        </div>
                        <span v-if="user.is_verified" class="verified-badge">
                            <i class="fa-solid fa-circle-check"></i> Verified
                        </span>
                    </div>

                    <div class="hero-info">
                        <p class="hero-label"><i class="fa-solid fa-user"></i> Player Profile</p>
                        <h1>{{ user.full_name }}</h1>
                        <p class="hero-username">@{{ user.username }}</p>
                        <p class="hero-about" v-if="user.about_info">{{ user.about_info }}</p>
                        <div class="hero-meta">
                            <span class="meta-pill">
                                <i class="fa-solid fa-shield-halved"></i> {{ user.account_type }}
                            </span>
                            <span class="meta-pill" v-if="user.phone_number">
                                <i class="fa-solid fa-phone"></i> {{ user.phone_number }}
                            </span>
                            <span class="meta-pill">
                                <i class="fa-solid fa-envelope"></i> {{ user.email }}
                            </span>
                        </div>
                    </div>

                    <button class="edit-trigger" @click="editing = !editing" v-if="!editing">
                        <i class="fa-solid fa-pen-to-square"></i> Edit Profile
                    </button>
                </div>
            </div>

            <!-- ── Flash message ── -->
            <div v-if="msg.text" :class="`flash flash-${msg.type}`">
                <i
                    :class="msg.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'"></i>
                {{ msg.text }}
            </div>

            <!-- ── Edit Form ── -->
            <transition name="slide-down">
                <div v-if="editing" class="edit-panel">
                    <div class="edit-panel-header">
                        <p class="section-label"><i class="fa-solid fa-pen-to-square"></i> Editing Profile</p>
                        <h2>Update Your <span>Details</span></h2>
                    </div>

                    <div class="form-grid">
                        <!-- Full name -->
                        <div class="field">
                            <label>Full Name</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-id-card input-icon"></i>
                                <input v-model="form.full_name" type="text" placeholder="Your full name" />
                            </div>
                        </div>

                        <!-- Username -->
                        <div class="field">
                            <label>Username</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-at input-icon"></i>
                                <input v-model="form.username" type="text" placeholder="username" />
                            </div>
                        </div>

                        <!-- Phone -->
                        <div class="field">
                            <label>Phone Number</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-phone input-icon"></i>
                                <input v-model="form.phone_number" type="tel" placeholder="+1 234 567 890" />
                            </div>
                        </div>

                        <!-- Profile pic -->

                        <!-- REPLACE BOTH with: -->
                        <div class="field field-full">
                            <ImageUpload :current-url="form.profile_pic" label="Profile Picture"
                                @uploaded="onImageUploaded" />
                        </div>
                        <!-- About -->
                        <div class="field field-full">
                            <label>About <span class="hint">— tell others who you are</span></label>
                            <textarea v-model="form.about_info" rows="4" placeholder="I'm a competitive gamer who..."
                                maxlength="400"></textarea>
                            <span class="char-count">{{ form.about_info.length }}/400</span>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-ghost" @click="cancelEdit">
                            <i class="fa-solid fa-xmark"></i> Cancel
                        </button>
                        <button class="btn-primary" @click="saveProfile" :disabled="saving">
                            <span v-if="!saving"><i class="fa-solid fa-floppy-disk"></i> Save Changes</span>
                            <span v-else><i class="fa-solid fa-spinner fa-spin"></i> Saving...</span>
                        </button>
                    </div>
                </div>
            </transition>

            <!-- ── Read-only info grid ── -->
            <div class="info-section" v-if="!editing">
                <div class="section-head">
                    <p class="section-label"><i class="fa-solid fa-circle-info"></i> Account Details</p>
                </div>
                <div class="info-cards">
                    <div class="info-card">
                        <div class="ic-icon"><i class="fa-solid fa-id-card"></i></div>
                        <div class="ic-body">
                            <p class="ic-label">Full Name</p>
                            <p class="ic-val">{{ user.full_name }}</p>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="ic-icon"><i class="fa-solid fa-at"></i></div>
                        <div class="ic-body">
                            <p class="ic-label">Username</p>
                            <p class="ic-val">@{{ user.username }}</p>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="ic-icon"><i class="fa-solid fa-envelope"></i></div>
                        <div class="ic-body">
                            <p class="ic-label">Email</p>
                            <p class="ic-val">{{ user.email }}</p>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="ic-icon"><i class="fa-solid fa-phone"></i></div>
                        <div class="ic-body">
                            <p class="ic-label">Phone</p>
                            <p class="ic-val">{{ user.phone_number || '—' }}</p>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="ic-icon"><i class="fa-solid fa-shield-halved"></i></div>
                        <div class="ic-body">
                            <p class="ic-label">Account Type</p>
                            <p class="ic-val">{{ user.account_type }}</p>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="ic-icon"><i class="fa-solid fa-circle-check"></i></div>
                        <div class="ic-body">
                            <p class="ic-label">Verified</p>
                            <p class="ic-val" :class="user.is_verified ? 'verified' : 'unverified'">
                                {{ user.is_verified ? 'Yes' : 'No' }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </template>
    </div>
</template>

<style scoped>
.profile-page {
    min-height: 100vh;
    background: var(--bg-color, #1a1714);
    color: var(--text-color, #f0ece6);
}

/* ── Loading ── */
.full-state {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    opacity: 0.4;
    font-size: 14px;
}

/* ── Hero ── */
.profile-hero {
    position: relative;
    padding: 48px 40px 40px;
    border-bottom: 1px solid rgba(188, 103, 33, 0.15);
    overflow: hidden;
}

.hero-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(188, 103, 33, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(188, 103, 33, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
}

.hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    gap: 28px;
    flex-wrap: wrap;
}

/* Avatar */
.avatar-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.avatar {
    width: 100px;
    height: 100px;
    border-radius: 22px;
    background: var(--primary-color, #bc6721);
    border: 3px solid rgba(188, 103, 33, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34px;
    font-weight: 900;
    color: #fff;
    overflow: hidden;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.verified-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    color: #6fcf97;
    background: rgba(111, 207, 151, 0.1);
    border: 1px solid rgba(111, 207, 151, 0.2);
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
}

/* Hero info */
.hero-info {
    flex: 1;
    min-width: 0;
}

.hero-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary-color, #bc6721);
    font-weight: 700;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 7px;
}

.hero-info h1 {
    font-size: clamp(24px, 4vw, 40px);
    font-weight: 900;
    margin: 0 0 4px;
    line-height: 1.1;
}

.hero-username {
    font-size: 13px;
    opacity: 0.45;
    margin-bottom: 10px;
}

.hero-about {
    font-size: 13px;
    opacity: 0.55;
    line-height: 1.6;
    margin-bottom: 14px;
    max-width: 600px;
}

.hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.meta-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(240, 236, 230, 0.6);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    padding: 5px 12px;
    border-radius: 20px;
}

.meta-pill i {
    color: var(--primary-color, #bc6721);
    font-size: 10px;
}

.edit-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(188, 103, 33, 0.12);
    border: 1px solid rgba(188, 103, 33, 0.3);
    color: var(--primary-color, #bc6721);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    flex-shrink: 0;
    align-self: flex-start;
    margin-left: auto;
}

.edit-trigger:hover {
    background: rgba(188, 103, 33, 0.2);
    border-color: var(--primary-color, #bc6721);
}

/* ── Flash ── */
.flash {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 40px;
    font-size: 13px;
    font-weight: 600;
}

.flash-success {
    background: rgba(111, 207, 151, 0.08);
    color: #6fcf97;
    border-bottom: 1px solid rgba(111, 207, 151, 0.15);
}

.flash-error {
    background: rgba(255, 107, 107, 0.08);
    color: #ff6b6b;
    border-bottom: 1px solid rgba(255, 107, 107, 0.15);
}

/* ── Edit panel ── */
.edit-panel {
    padding: 36px 40px;
    border-bottom: 1px solid rgba(188, 103, 33, 0.1);
}

.edit-panel-header {
    margin-bottom: 28px;
}

.section-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary-color, #bc6721);
    font-weight: 700;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 7px;
}

.edit-panel-header h2 {
    font-size: 24px;
    font-weight: 900;
    text-transform: uppercase;
    margin: 0;
}

.edit-panel-header h2 span {
    color: var(--primary-color, #bc6721);
}

/* Form grid */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-bottom: 28px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.field-full {
    grid-column: 1 / -1;
}

label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.55;
}

.hint {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    opacity: 0.4;
}

.input-wrap {
    position: relative;
}

.input-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: var(--primary-color, #bc6721);
    opacity: 0.7;
    pointer-events: none;
}

.input-wrap input,
textarea {
    width: 100%;
    padding: 11px 14px 11px 38px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color, #f0ece6);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box;
    font-family: inherit;
}

.input-wrap input:focus,
textarea:focus {
    border-color: var(--primary-color, #bc6721);
    background: rgba(188, 103, 33, 0.05);
}

.input-wrap input::placeholder,
textarea::placeholder {
    opacity: 0.3;
}

textarea {
    padding: 12px 14px;
    resize: vertical;
    line-height: 1.6;
}

.char-count {
    font-size: 10px;
    opacity: 0.3;
    text-align: right;
    margin-top: 2px;
}

.pic-preview {
    width: 80px;
    height: 80px;
    border-radius: 14px;
    overflow: hidden;
    border: 2px solid rgba(188, 103, 33, 0.3);
}

.pic-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Actions */
.form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 24px;
    background: var(--primary-color, #bc6721);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
    background: var(--hover-color, #d97f34);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: var(--text-color, #f0ece6);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition: border-color 0.2s;
}

.btn-ghost:hover {
    border-color: var(--primary-color, #bc6721);
}

/* ── Info section ── */
.info-section {
    padding: 36px 40px;
}

.section-head {
    margin-bottom: 20px;
}

.info-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
}

.info-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(188, 103, 33, 0.12);
    border-radius: 12px;
    transition: border-color 0.2s;
}

.info-card:hover {
    border-color: rgba(188, 103, 33, 0.3);
}

.ic-icon {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: rgba(188, 103, 33, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--primary-color, #bc6721);
    flex-shrink: 0;
}

.ic-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.4;
    margin-bottom: 3px;
    font-weight: 600;
}

.ic-val {
    font-size: 13px;
    font-weight: 700;
    word-break: break-all;
}

.ic-val.verified {
    color: #6fcf97;
}

.ic-val.unverified {
    color: rgba(240, 236, 230, 0.4);
}

/* ── Transitions ── */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-12px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
    .profile-hero {
        padding: 32px 20px;
    }

    .hero-content {
        flex-direction: column;
        gap: 16px;
    }

    .edit-trigger {
        margin-left: 0;
    }

    .edit-panel {
        padding: 24px 20px;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .info-section {
        padding: 24px 20px;
    }
}
</style>