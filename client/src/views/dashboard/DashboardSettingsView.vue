<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const HOST = import.meta.env.VITE_HOST;

const user = ref(null);
const activeSection = ref('password');

// ── Password ──────────────────────────────────────────────
const pwForm = ref({ current_password: '', new_password: '', confirm_password: '' });
const pwLoading = ref(false);
const pwMsg = ref({ text: '', type: '' });
const showPw = ref({ current: false, new: false, confirm: false });

// ── Notifications ─────────────────────────────────────────
const notifForm = ref({
    email_events:   true,
    email_results:  true,
    email_council:  false,
    push_messages:  true,
});
const notifLoading = ref(false);
const notifMsg = ref({ text: '', type: '' });

// ── Danger zone ───────────────────────────────────────────
const deleteConfirm = ref('');
const deleteLoading = ref(false);

const sections = [
    { id: 'password',      icon: 'fa-lock',         label: 'Password' },
    { id: 'notifications', icon: 'fa-bell',          label: 'Notifications' },
    { id: 'danger',        icon: 'fa-triangle-exclamation', label: 'Danger Zone' },
];

const fetchUser = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        const res = await fetch(`${HOST}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) { router.push('/login'); return; }
        user.value = json.data;
    } catch (err) { console.error(err); }
};

const changePassword = async () => {
    pwMsg.value = { text: '', type: '' };
    if (!pwForm.value.current_password || !pwForm.value.new_password) {
        pwMsg.value = { text: 'All password fields are required.', type: 'error' }; return;
    }
    if (pwForm.value.new_password !== pwForm.value.confirm_password) {
        pwMsg.value = { text: 'New passwords do not match.', type: 'error' }; return;
    }
    if (pwForm.value.new_password.length < 8) {
        pwMsg.value = { text: 'Password must be at least 8 characters.', type: 'error' }; return;
    }

    pwLoading.value = true;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${HOST}/api/auth/change-password`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: pwForm.value.current_password,
                new_password:     pwForm.value.new_password
            })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        pwMsg.value = { text: 'Password updated successfully.', type: 'success' };
        pwForm.value = { current_password: '', new_password: '', confirm_password: '' };
    } catch (err) {
        pwMsg.value = { text: err.message || 'Failed to update password.', type: 'error' };
    } finally {
        pwLoading.value = false;
    }
};

const saveNotifications = async () => {
    notifLoading.value = true;
    notifMsg.value = { text: '', type: '' };
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${HOST}/api/auth/notifications`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(notifForm.value)
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        notifMsg.value = { text: 'Notification preferences saved.', type: 'success' };
    } catch (err) {
        notifMsg.value = { text: err.message || 'Failed to save.', type: 'error' };
    } finally {
        notifLoading.value = false;
    }
};

const deleteAccount = async () => {
    if (deleteConfirm.value !== user.value?.username) {
        alert(`Type your username "${user.value?.username}" to confirm.`); return;
    }
    deleteLoading.value = true;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${HOST}/api/auth/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        localStorage.removeItem('token');
        router.push('/');
    } catch (err) {
        alert(err.message);
    } finally {
        deleteLoading.value = false;
    }
};

const logout = () => {
    localStorage.removeItem('token');
    router.push('/login');
};

const pwStrength = (pw) => {
    if (!pw) return { label: '', pct: 0, cls: '' };
    let score = 0;
    if (pw.length >= 8)              score++;
    if (pw.length >= 12)             score++;
    if (/[A-Z]/.test(pw))            score++;
    if (/[0-9]/.test(pw))            score++;
    if (/[^A-Za-z0-9]/.test(pw))     score++;
    if (score <= 1) return { label: 'Weak',   pct: 25,  cls: 'weak' };
    if (score <= 2) return { label: 'Fair',   pct: 50,  cls: 'fair' };
    if (score <= 3) return { label: 'Good',   pct: 75,  cls: 'good' };
    return                { label: 'Strong', pct: 100, cls: 'strong' };
};

onMounted(fetchUser);
</script>

<template>
    <div class="settings-page">

        <!-- Header -->
        <div class="page-header">
            <p class="page-label"><i class="fa-solid fa-gear"></i> Dashboard</p>
            <h1>Account <span>Settings</span></h1>
            <p class="page-sub">Manage your security, preferences, and account.</p>
        </div>

        <div class="settings-layout">

            <!-- Sidebar nav -->
            <nav class="settings-nav">
                <button
                    v-for="s in sections"
                    :key="s.id"
                    class="snav-item"
                    :class="{ active: activeSection === s.id, danger: s.id === 'danger' }"
                    @click="activeSection = s.id"
                >
                    <i :class="`fa-solid ${s.icon}`"></i>
                    {{ s.label }}
                </button>

                <div class="snav-divider"></div>

                <button class="snav-item logout" @click="logout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Sign Out
                </button>
            </nav>

            <!-- Content panels -->
            <div class="settings-content">

                <!-- ── PASSWORD ── -->
                <div v-if="activeSection === 'password'" class="settings-panel">
                    <div class="panel-head">
                        <div class="panel-icon"><i class="fa-solid fa-lock"></i></div>
                        <div>
                            <h2>Change Password</h2>
                            <p>Use a strong password you don't use elsewhere.</p>
                        </div>
                    </div>

                    <div v-if="pwMsg.text" :class="`msg-box msg-${pwMsg.type}`">
                        <i :class="pwMsg.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'"></i>
                        {{ pwMsg.text }}
                    </div>

                    <div class="form-stack">
                        <!-- Current password -->
                        <div class="field">
                            <label>Current Password</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input
                                    :type="showPw.current ? 'text' : 'password'"
                                    v-model="pwForm.current_password"
                                    placeholder="Current password"
                                    autocomplete="current-password"
                                />
                                <button type="button" class="eye-btn" @click="showPw.current = !showPw.current">
                                    <i :class="`fa-solid ${showPw.current ? 'fa-eye-slash' : 'fa-eye'}`"></i>
                                </button>
                            </div>
                        </div>

                        <!-- New password -->
                        <div class="field">
                            <label>New Password</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-key input-icon"></i>
                                <input
                                    :type="showPw.new ? 'text' : 'password'"
                                    v-model="pwForm.new_password"
                                    placeholder="New password"
                                    autocomplete="new-password"
                                />
                                <button type="button" class="eye-btn" @click="showPw.new = !showPw.new">
                                    <i :class="`fa-solid ${showPw.new ? 'fa-eye-slash' : 'fa-eye'}`"></i>
                                </button>
                            </div>
                            <!-- Strength bar -->
                            <div class="strength-bar" v-if="pwForm.new_password">
                                <div class="strength-track">
                                    <div
                                        class="strength-fill"
                                        :class="pwStrength(pwForm.new_password).cls"
                                        :style="{ width: pwStrength(pwForm.new_password).pct + '%' }"
                                    ></div>
                                </div>
                                <span class="strength-label" :class="pwStrength(pwForm.new_password).cls">
                                    {{ pwStrength(pwForm.new_password).label }}
                                </span>
                            </div>
                        </div>

                        <!-- Confirm password -->
                        <div class="field">
                            <label>Confirm New Password</label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-key input-icon"></i>
                                <input
                                    :type="showPw.confirm ? 'text' : 'password'"
                                    v-model="pwForm.confirm_password"
                                    placeholder="Confirm new password"
                                    autocomplete="new-password"
                                />
                                <button type="button" class="eye-btn" @click="showPw.confirm = !showPw.confirm">
                                    <i :class="`fa-solid ${showPw.confirm ? 'fa-eye-slash' : 'fa-eye'}`"></i>
                                </button>
                            </div>
                            <p v-if="pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password" class="field-error">
                                <i class="fa-solid fa-xmark"></i> Passwords don't match
                            </p>
                            <p v-else-if="pwForm.confirm_password && pwForm.new_password === pwForm.confirm_password" class="field-ok">
                                <i class="fa-solid fa-check"></i> Passwords match
                            </p>
                        </div>
                    </div>

                    <div class="panel-actions">
                        <button class="btn-primary" @click="changePassword" :disabled="pwLoading">
                            <span v-if="!pwLoading"><i class="fa-solid fa-floppy-disk"></i> Update Password</span>
                            <span v-else><i class="fa-solid fa-spinner fa-spin"></i> Updating...</span>
                        </button>
                    </div>
                </div>

                <!-- ── NOTIFICATIONS ── -->
                <div v-else-if="activeSection === 'notifications'" class="settings-panel">
                    <div class="panel-head">
                        <div class="panel-icon"><i class="fa-solid fa-bell"></i></div>
                        <div>
                            <h2>Notification Preferences</h2>
                            <p>Choose what you'd like to be notified about.</p>
                        </div>
                    </div>

                    <div v-if="notifMsg.text" :class="`msg-box msg-${notifMsg.type}`">
                        <i :class="notifMsg.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'"></i>
                        {{ notifMsg.text }}
                    </div>

                    <div class="toggle-list">
                        <div class="toggle-group-label">Email Notifications</div>

                        <div class="toggle-row">
                            <div class="toggle-info">
                                <p class="toggle-title">Event Reminders</p>
                                <p class="toggle-sub">Get reminded before events you're registered for.</p>
                            </div>
                            <button class="toggle-btn" :class="{ active: notifForm.email_events }" @click="notifForm.email_events = !notifForm.email_events">
                                <span class="toggle-knob"></span>
                            </button>
                        </div>

                        <div class="toggle-row">
                            <div class="toggle-info">
                                <p class="toggle-title">Results & Rankings</p>
                                <p class="toggle-sub">Notify me when event results are published.</p>
                            </div>
                            <button class="toggle-btn" :class="{ active: notifForm.email_results }" @click="notifForm.email_results = !notifForm.email_results">
                                <span class="toggle-knob"></span>
                            </button>
                        </div>

                        <div class="toggle-row">
                            <div class="toggle-info">
                                <p class="toggle-title">Council Updates</p>
                                <p class="toggle-sub">News and announcements from your councils.</p>
                            </div>
                            <button class="toggle-btn" :class="{ active: notifForm.email_council }" @click="notifForm.email_council = !notifForm.email_council">
                                <span class="toggle-knob"></span>
                            </button>
                        </div>

                        <div class="toggle-group-label" style="margin-top: 8px;">Push Notifications</div>

                        <div class="toggle-row">
                            <div class="toggle-info">
                                <p class="toggle-title">Chat Messages</p>
                                <p class="toggle-sub">Get notified of new messages in your rooms.</p>
                            </div>
                            <button class="toggle-btn" :class="{ active: notifForm.push_messages }" @click="notifForm.push_messages = !notifForm.push_messages">
                                <span class="toggle-knob"></span>
                            </button>
                        </div>
                    </div>

                    <div class="panel-actions">
                        <button class="btn-primary" @click="saveNotifications" :disabled="notifLoading">
                            <span v-if="!notifLoading"><i class="fa-solid fa-floppy-disk"></i> Save Preferences</span>
                            <span v-else><i class="fa-solid fa-spinner fa-spin"></i> Saving...</span>
                        </button>
                    </div>
                </div>

                <!-- ── DANGER ZONE ── -->
                <div v-else-if="activeSection === 'danger'" class="settings-panel danger">
                    <div class="panel-head">
                        <div class="panel-icon danger-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <div>
                            <h2 style="color:#ff6b6b;">Danger Zone</h2>
                            <p>Irreversible actions. Please read carefully before proceeding.</p>
                        </div>
                    </div>

                    <div class="danger-card">
                        <div class="danger-info">
                            <p class="danger-title">Delete Account</p>
                            <p class="danger-sub">
                                Permanently deletes your account, all registrations, team memberships, and messages.
                                This <strong>cannot</strong> be undone.
                            </p>
                        </div>

                        <div class="delete-confirm-wrap">
                            <label class="delete-label">
                                Type your username <strong>{{ user?.username }}</strong> to confirm:
                            </label>
                            <div class="input-wrap">
                                <i class="fa-solid fa-user input-icon"></i>
                                <input
                                    v-model="deleteConfirm"
                                    type="text"
                                    :placeholder="user?.username"
                                />
                            </div>
                        </div>

                        <button
                            class="btn-danger"
                            @click="deleteAccount"
                            :disabled="deleteConfirm !== user?.username || deleteLoading"
                        >
                            <span v-if="!deleteLoading">
                                <i class="fa-solid fa-trash"></i> Permanently Delete Account
                            </span>
                            <span v-else>
                                <i class="fa-solid fa-spinner fa-spin"></i> Deleting...
                            </span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
.settings-page {
    min-height: 100vh;
    background: var(--bg-color, #1a1714);
    color: var(--text-color, #f0ece6);
    padding: 36px 40px 60px;
}

/* ── Header ── */
.page-label {
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

.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: clamp(26px, 4vw, 40px); font-weight: 900; margin: 0 0 4px; }
.page-header h1 span { color: var(--primary-color, #bc6721); }
.page-sub { font-size: 12px; opacity: 0.4; margin: 0; }

/* ── Layout ── */
.settings-layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 28px;
    align-items: start;
}

/* ── Sidebar nav ── */
.settings-nav {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(188,103,33,0.12);
    border-radius: 14px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: sticky;
    top: 20px;
}

.snav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(240,236,230,0.5);
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-align: left;
    width: 100%;
}
.snav-item i { font-size: 12px; color: rgba(240,236,230,0.3); width: 14px; flex-shrink: 0; transition: color 0.15s; }
.snav-item:hover { background: rgba(188,103,33,0.08); color: var(--text-color, #f0ece6); }
.snav-item:hover i { color: var(--primary-color, #bc6721); }
.snav-item.active { background: rgba(188,103,33,0.14); color: var(--text-color, #f0ece6); }
.snav-item.active i { color: var(--primary-color, #bc6721); }
.snav-item.danger { color: rgba(255,107,107,0.6); }
.snav-item.danger i { color: rgba(255,107,107,0.4); }
.snav-item.danger:hover, .snav-item.danger.active { background: rgba(255,107,107,0.08); color: #ff6b6b; }
.snav-item.danger:hover i, .snav-item.danger.active i { color: #ff6b6b; }
.snav-item.logout { color: rgba(255,107,107,0.5); }
.snav-item.logout i { color: rgba(255,107,107,0.35); }
.snav-item.logout:hover { background: rgba(255,107,107,0.06); color: #ff6b6b; }

.snav-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0; }

/* ── Panel ── */
.settings-panel {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(188,103,33,0.14);
    border-radius: 16px;
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}
.settings-panel.danger { border-color: rgba(255,107,107,0.15); }

.panel-head {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.panel-icon {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    background: rgba(188,103,33,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: var(--primary-color, #bc6721);
    flex-shrink: 0;
}
.danger-icon { background: rgba(255,107,107,0.1); color: #ff6b6b; }

.panel-head h2 { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
.panel-head p { font-size: 12px; opacity: 0.4; margin: 0; }

/* ── Msg box ── */
.msg-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
}
.msg-success { background: rgba(111,207,151,0.08); color: #6fcf97; border: 1px solid rgba(111,207,151,0.2); }
.msg-error   { background: rgba(255,107,107,0.08); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.2); }

/* ── Form ── */
.form-stack { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 7px; }

label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.55;
}

.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon {
    position: absolute;
    left: 13px;
    font-size: 12px;
    color: var(--primary-color, #bc6721);
    opacity: 0.7;
    pointer-events: none;
}

.input-wrap input {
    width: 100%;
    padding: 11px 42px 11px 38px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text-color, #f0ece6);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
}
.input-wrap input:focus { border-color: var(--primary-color, #bc6721); }
.input-wrap input::placeholder { opacity: 0.3; }

.eye-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: rgba(240,236,230,0.3);
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    transition: color 0.15s;
}
.eye-btn:hover { color: var(--primary-color, #bc6721); }

/* Strength bar */
.strength-bar { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.strength-track {
    flex: 1;
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
}
.strength-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
}
.strength-fill.weak   { background: #ff6b6b; }
.strength-fill.fair   { background: #ffd966; }
.strength-fill.good   { background: #64b5f6; }
.strength-fill.strong { background: #6fcf97; }

.strength-label { font-size: 10px; font-weight: 700; min-width: 44px; text-align: right; }
.strength-label.weak   { color: #ff6b6b; }
.strength-label.fair   { color: #ffd966; }
.strength-label.good   { color: #64b5f6; }
.strength-label.strong { color: #6fcf97; }

.field-error { font-size: 11px; color: #ff6b6b; display: flex; align-items: center; gap: 5px; margin: 0; }
.field-ok    { font-size: 11px; color: #6fcf97;  display: flex; align-items: center; gap: 5px; margin: 0; }

/* ── Toggle list ── */
.toggle-list { display: flex; flex-direction: column; gap: 0; }

.toggle-group-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    opacity: 0.35;
    font-weight: 700;
    padding: 8px 0 6px;
}

.toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    gap: 20px;
}
.toggle-row:last-child { border-bottom: none; }

.toggle-info {}
.toggle-title { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
.toggle-sub   { font-size: 11px; opacity: 0.4; }

.toggle-btn {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    cursor: pointer;
    position: relative;
    transition: background 0.2s, border-color 0.2s;
    flex-shrink: 0;
}
.toggle-btn.active {
    background: rgba(188,103,33,0.35);
    border-color: var(--primary-color, #bc6721);
}

.toggle-knob {
    position: absolute;
    top: 3px; left: 3px;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: rgba(255,255,255,0.35);
    transition: transform 0.2s, background 0.2s;
}
.toggle-btn.active .toggle-knob {
    transform: translateX(20px);
    background: var(--primary-color, #bc6721);
}

/* ── Panel actions ── */
.panel-actions { display: flex; justify-content: flex-end; }

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
.btn-primary:hover:not(:disabled) { background: var(--hover-color, #d97f34); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Danger zone ── */
.danger-card {
    background: rgba(255,107,107,0.04);
    border: 1px solid rgba(255,107,107,0.15);
    border-radius: 12px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.danger-title { font-size: 15px; font-weight: 800; color: #ff6b6b; margin-bottom: 6px; }
.danger-sub   { font-size: 12px; opacity: 0.55; line-height: 1.6; }

.delete-confirm-wrap { display: flex; flex-direction: column; gap: 8px; }

.delete-label { font-size: 12px; opacity: 0.55; }
.delete-label strong { color: var(--primary-color, #bc6721); }

.btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 24px;
    background: rgba(255,107,107,0.1);
    border: 1px solid rgba(255,107,107,0.3);
    color: #ff6b6b;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition: background 0.2s;
    align-self: flex-start;
}
.btn-danger:hover:not(:disabled) { background: rgba(255,107,107,0.2); }
.btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 768px) {
    .settings-page { padding: 24px 16px 40px; }
    .settings-layout { grid-template-columns: 1fr; }
    .settings-nav { position: static; flex-direction: row; flex-wrap: wrap; }
    .settings-panel { padding: 20px; }
}
</style>