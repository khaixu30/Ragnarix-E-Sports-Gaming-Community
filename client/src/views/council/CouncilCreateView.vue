<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router  = useRouter();
const loading = ref(false);
const error   = ref('');

const BASE = import.meta.env.VITE_HOST;

const form = ref({
    name:        '',
    description: '',
    logo_url:    '',
});

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

    } catch (err) {
        console.error(err);
        error.value = 'Network error. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="page">
        <div class="back-row">
            <a href="/councils" class="back-link">
                <i class="fa-solid fa-arrow-left"></i> Back to Councils
            </a>
        </div>

        <div class="form-card">
            <div class="form-header">
                <div class="form-icon"><i class="fa-solid fa-landmark"></i></div>
                <div>
                    <h1 class="form-title">Create a Council</h1>
                    <p class="form-sub">Set up your competitive gaming organisation</p>
                </div>
            </div>

            <div class="form-body">
                <div class="field">
                    <label>Council Name <span class="required">*</span></label>
                    <input v-model="form.name" type="text" placeholder="e.g. FragMint Esports" maxlength="80" />
                </div>

                <div class="field">
                    <label>Description</label>
                    <textarea v-model="form.description" rows="3" placeholder="What is this council about?" maxlength="500"></textarea>
                </div>

                <div class="field">
                    <label>Logo URL</label>
                    <div class="logo-preview-row">
                        <div class="logo-preview">
                            <img v-if="form.logo_url" :src="form.logo_url" alt="Logo preview" />
                            <span v-else>{{ form.name?.[0]?.toUpperCase() || '?' }}</span>
                        </div>
                        <input v-model="form.logo_url" type="url" placeholder="https://example.com/logo.png" style="flex:1" />
                    </div>
                </div>

                <p v-if="error" class="form-error">
                    <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
                </p>

                <div class="form-actions">
                    <a href="/councils" class="btn-ghost">Cancel</a>
                    <button class="btn-primary" :disabled="loading" @click="submit">
                        <span v-if="loading" class="spinner-sm"></span>
                        <i v-else class="fa-solid fa-check"></i>
                        {{ loading ? 'Creating…' : 'Create Council' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page { padding: 32px; max-width: 560px; }
.back-link {
    display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
    color: var(--text-color); opacity: 0.5; text-decoration: none; margin-bottom: 24px; transition: opacity 0.2s;
}
.back-link:hover { opacity: 1; }
.form-card { border-radius: 14px; border: 1px solid rgba(188,103,33,0.15); background: rgba(188,103,33,0.03); overflow: hidden; }
.form-header {
    display: flex; align-items: center; gap: 14px; padding: 20px 24px;
    border-bottom: 1px solid rgba(188,103,33,0.1);
}
.form-icon {
    width: 44px; height: 44px; border-radius: 10px; background: rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 18px;
}
.form-title { font-size: 17px; font-weight: 800; color: var(--text-color); margin-bottom: 2px; }
.form-sub { font-size: 12px; color: var(--text-color); opacity: 0.45; }
.form-body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.field { display: flex; flex-direction: column; gap: 7px; }
.field label { font-size: 12px; font-weight: 700; color: var(--text-color); opacity: 0.6; letter-spacing: 0.03em; }
.required { color: var(--primary-color); }
.field input, .field textarea {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(188,103,33,0.2); border-radius: 9px;
    padding: 10px 14px; font-size: 13px; font-weight: 500; color: var(--text-color);
    outline: none; resize: vertical; transition: border-color 0.2s;
}
.field input:focus, .field textarea:focus { border-color: var(--primary-color); }
.logo-preview-row { display: flex; align-items: center; gap: 12px; }
.logo-preview {
    width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0; background: rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900;
    color: var(--primary-color); overflow: hidden;
}
.logo-preview img { width: 100%; height: 100%; object-fit: cover; }
.form-error {
    display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #ff6b6b;
    padding: 10px 14px; border-radius: 8px; background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2);
}
.form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
.btn-ghost {
    display: inline-flex; align-items: center; padding: 9px 18px; border-radius: 9px; font-size: 13px;
    font-weight: 700; text-decoration: none; color: var(--text-color); opacity: 0.5;
    border: 1px solid rgba(188,103,33,0.15); background: none; transition: opacity 0.2s;
}
.btn-ghost:hover { opacity: 1; }
.btn-primary {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 9px;
    font-size: 13px; font-weight: 700; background: var(--primary-color); color: #fff;
    border: none; cursor: pointer; transition: opacity 0.2s;
}
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }
.spinner-sm {
    width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>