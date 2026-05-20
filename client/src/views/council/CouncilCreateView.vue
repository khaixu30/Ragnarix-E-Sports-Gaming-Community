<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import ImgeUpload from '../../components/ImgeUpload.vue';

const router  = useRouter();
const loading = ref(false);
const error   = ref('');
const focused = ref('');

const BASE = import.meta.env.VITE_HOST;

const form = ref({
    name:        '',
    description: '',
    logo_url:    '',
});

const initials = computed(() => {
    return form.value.name
        ? form.value.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';
});

const charCount = computed(() => form.value.description.length);

const submit = async () => {
    if (!form.value.name.trim()) { error.value = 'Council name is required.'; return; }

    loading.value = true;
    error.value   = '';

    try {
        const res  = await fetch(`${BASE}/api/council/create`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                name:        form.value.name.trim(),
                description: form.value.description.trim() || null,
                logo_url:    form.value.logo_url.trim()    || null,
            }),
        });

        const json = await res.json();

        if (!json.success) {
            error.value = json.message || 'Failed to create council.';
            return;
        }

        router.push({ name: 'council-dashboard', params: { id: json.data.id } });

    } catch (e) {
        console.error(e);
        error.value = 'Network error. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="page">

        <!-- Back nav -->
        <nav class="topbar">
            <a href="/councils" class="back-link">
                <span class="back-icon"><i class="fa-solid fa-arrow-left"></i></span>
                <span>Back to Councils</span>
            </a>
            <div class="breadcrumb">
                <span>Councils</span>
                <i class="fa-solid fa-chevron-right sep"></i>
                <span class="crumb-active">New</span>
            </div>
        </nav>

        <div class="layout">

            <!-- Left: preview panel -->
            <aside class="preview-panel">
                <div class="preview-label">PREVIEW</div>
                <div class="council-card">
                    <div class="card-glow"></div>
                    <div class="card-avatar">
                        <img v-if="form.logo_url" :src="form.logo_url" alt="Logo" />
                        <span v-else>{{ initials }}</span>
                    </div>
                    <div class="card-body">
                        <p class="card-name">{{ form.name || 'Council Name' }}</p>
                        <p class="card-desc">{{ form.description || 'Your description will appear here.' }}</p>
                    </div>
                    <div class="card-footer">
                        <span class="card-badge"><i class="fa-solid fa-crown"></i> Owner</span>
                        <span class="card-dot"></span>
                        <span class="card-meta">Just now</span>
                    </div>
                </div>
                <p class="preview-hint">Card updates as you type</p>
            </aside>

            <!-- Right: form -->
            <main class="form-wrap">
                <header class="form-header">
                    <div class="header-icon">
                        <i class="fa-solid fa-landmark"></i>
                    </div>
                    <div>
                        <h1 class="form-title">Create a Council</h1>
                        <p class="form-subtitle">Set up your competitive gaming organisation</p>
                    </div>
                </header>

                <div class="divider"></div>

                <div class="fields">

                    <!-- Name -->
                    <div class="field" :class="{ focused: focused === 'name', filled: form.name }">
                        <label class="field-label">
                            Council Name
                            <span class="required">*</span>
                        </label>
                        <div class="input-wrap">
                            <i class="fa-solid fa-shield-halved input-icon"></i>
                            <input
                                v-model="form.name"
                                type="text"
                                placeholder="e.g. FragMint Esports"
                                maxlength="80"
                                @focus="focused = 'name'"
                                @blur="focused = ''"
                            />
                            <span class="char-limit">{{ form.name.length }}/80</span>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="field" :class="{ focused: focused === 'desc', filled: form.description }">
                        <label class="field-label">Description</label>
                        <div class="input-wrap textarea-wrap">
                            <i class="fa-solid fa-align-left input-icon top-icon"></i>
                            <textarea
                                v-model="form.description"
                                rows="4"
                                placeholder="What is this council about?"
                                maxlength="500"
                                @focus="focused = 'desc'"
                                @blur="focused = ''"
                            ></textarea>
                            <span class="char-limit">{{ charCount }}/500</span>
                        </div>
                    </div>

                    <!-- Logo Upload — uses ImageUpload component -->
                    <div class="field">
                        <ImageUpload
                            v-model="form.logo_url"
                        />
                    </div>

                </div>

                <!-- Error -->
                <transition name="slide-err">
                    <div v-if="error" class="form-error">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>{{ error }}</span>
                        <button class="err-close" @click="error = ''"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </transition>

                <!-- Actions -->
                <div class="actions">
                    <a href="/councils" class="btn-ghost">
                        <i class="fa-solid fa-xmark"></i>
                        Cancel
                    </a>
                    <button class="btn-primary" :disabled="loading" @click="submit">
                        <span v-if="loading" class="spinner"></span>
                        <i v-else class="fa-solid fa-flag-checkered"></i>
                        {{ loading ? 'Creating…' : 'Create Council' }}
                    </button>
                </div>
            </main>

        </div>
    </div>
</template>

<style scoped>
/* ── Base ────────────────────────────────────────────────── */
.page {
    min-height: 100vh;
    padding: 28px 32px 48px;
    box-sizing: border-box;
}

/* ── Top nav ─────────────────────────────────────────────── */
.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 36px;
}

.back-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.5;
    text-decoration: none;
    transition: opacity 0.2s;
}
.back-link:hover { opacity: 1; }

.back-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(188, 103, 33, 0.1);
    border: 1px solid rgba(188, 103, 33, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--primary-color);
    transition: background 0.2s;
}
.back-link:hover .back-icon { background: rgba(188, 103, 33, 0.2); }

.breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.35;
}
.sep { font-size: 9px; }
.crumb-active { opacity: 1; color: var(--primary-color); }

/* ── Two-column layout ───────────────────────────────────── */
.layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 28px;
    align-items: start;
    max-width: 860px;
}

@media (max-width: 680px) {
    .layout { grid-template-columns: 1fr; }
    .preview-panel { order: 2; }
    .form-wrap { order: 1; }
}

/* ── Preview panel ───────────────────────────────────────── */
.preview-panel {
    position: sticky;
    top: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.preview-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--text-color);
    opacity: 0.3;
    align-self: flex-start;
}

.council-card {
    position: relative;
    width: 100%;
    border-radius: 16px;
    border: 1px solid rgba(188, 103, 33, 0.2);
    background: rgba(188, 103, 33, 0.04);
    padding: 20px;
    overflow: hidden;
    transition: border-color 0.3s;
}
.council-card:hover { border-color: rgba(188, 103, 33, 0.35); }

.card-glow {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 80px;
    background: radial-gradient(ellipse, rgba(188, 103, 33, 0.18) 0%, transparent 70%);
    pointer-events: none;
}

.card-avatar {
    width: 52px;
    height: 52px;
    border-radius: 13px;
    background: rgba(188, 103, 33, 0.15);
    border: 1px solid rgba(188, 103, 33, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
    color: var(--primary-color);
    overflow: hidden;
    margin-bottom: 14px;
}
.card-avatar img { width: 100%; height: 100%; object-fit: cover; }

.card-body { margin-bottom: 16px; }

.card-name {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-color);
    margin: 0 0 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-desc {
    font-size: 12px;
    color: var(--text-color);
    opacity: 0.45;
    margin: 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 54px;
}

.card-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid rgba(188, 103, 33, 0.1);
}

.card-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    color: var(--primary-color);
    background: rgba(188, 103, 33, 0.12);
    padding: 3px 8px;
    border-radius: 20px;
}

.card-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--text-color);
    opacity: 0.2;
    margin-left: 2px;
}

.card-meta {
    font-size: 11px;
    color: var(--text-color);
    opacity: 0.3;
    font-weight: 500;
}

.preview-hint {
    font-size: 11px;
    color: var(--text-color);
    opacity: 0.25;
    font-weight: 500;
    margin: 0;
}

/* ── Form panel ──────────────────────────────────────────── */
.form-wrap {
    border-radius: 16px;
    border: 1px solid rgba(188, 103, 33, 0.15);
    background: rgba(188, 103, 33, 0.025);
    overflow: hidden;
}

.form-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 22px 26px;
}

.header-icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: rgba(188, 103, 33, 0.14);
    border: 1px solid rgba(188, 103, 33, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);
    font-size: 18px;
    flex-shrink: 0;
}

.form-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-color);
    margin: 0 0 3px;
    line-height: 1;
}

.form-subtitle {
    font-size: 12px;
    color: var(--text-color);
    opacity: 0.4;
    margin: 0;
    font-weight: 500;
}

.divider {
    height: 1px;
    background: rgba(188, 103, 33, 0.1);
}

/* ── Fields ──────────────────────────────────────────────── */
.fields {
    padding: 26px 26px 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-color);
    opacity: 0.55;
    text-transform: uppercase;
    transition: opacity 0.2s;
}
.field.focused .field-label { opacity: 0.9; color: var(--primary-color); }

.required { color: var(--primary-color); margin-left: 2px; }

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 13px;
    font-size: 13px;
    color: var(--text-color);
    opacity: 0.3;
    pointer-events: none;
    transition: opacity 0.2s, color 0.2s;
    z-index: 1;
}
.field.focused .input-icon { opacity: 0.7; color: var(--primary-color); }

.top-icon { top: 13px; align-self: flex-start; }

.textarea-wrap { align-items: flex-start; }

.input-wrap input,
.input-wrap textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.035);
    border: 1.5px solid rgba(188, 103, 33, 0.18);
    border-radius: 10px;
    padding: 11px 52px 11px 38px;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text-color);
    outline: none;
    resize: vertical;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.input-wrap input::placeholder,
.input-wrap textarea::placeholder {
    opacity: 0.3;
}

.input-wrap input:focus,
.input-wrap textarea:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.05);
    box-shadow: 0 0 0 3px rgba(188, 103, 33, 0.08);
}

.char-limit {
    position: absolute;
    right: 12px;
    bottom: 10px;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.2;
    pointer-events: none;
}
.textarea-wrap .char-limit { bottom: 10px; }

/* ── Error banner ────────────────────────────────────────── */
.form-error {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12.5px;
    font-weight: 600;
    color: #ff6b6b;
    padding: 11px 16px;
    border-radius: 10px;
    background: rgba(255, 107, 107, 0.08);
    border: 1px solid rgba(255, 107, 107, 0.22);
    margin: 20px 26px 0;
}
.form-error span { flex: 1; }
.err-close {
    background: none;
    border: none;
    color: #ff6b6b;
    opacity: 0.6;
    cursor: pointer;
    padding: 2px 4px;
    font-size: 12px;
    line-height: 1;
    transition: opacity 0.15s;
}
.err-close:hover { opacity: 1; }

.slide-err-enter-active, .slide-err-leave-active { transition: all 0.25s ease; }
.slide-err-enter-from, .slide-err-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Actions ─────────────────────────────────────────────── */
.actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 22px 26px;
    margin-top: 22px;
    border-top: 1px solid rgba(188, 103, 33, 0.1);
}

.btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    color: var(--text-color);
    opacity: 0.45;
    border: 1.5px solid rgba(188, 103, 33, 0.15);
    background: none;
    transition: opacity 0.2s, border-color 0.2s;
    cursor: pointer;
}
.btn-ghost:hover { opacity: 0.85; border-color: rgba(188, 103, 33, 0.3); }

.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    background: var(--primary-color);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 4px 14px rgba(188, 103, 33, 0.35);
}
.btn-primary:not(:disabled):hover { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:not(:disabled):active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

.spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>