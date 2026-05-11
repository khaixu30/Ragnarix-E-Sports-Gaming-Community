<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ImageUpload from '../../components/ImgeUpload.vue';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const success = ref('');

const form = ref({
    name: '',
    description: '',
    logo_url: ''
});

const handleCreate = async () => {
    error.value = '';
    success.value = '';

    if (!form.value.name.trim()) {
        error.value = 'Council name is required.';
        return;
    }

    loading.value = true;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_HOST}/api/council/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: form.value.name.trim(),
                description: form.value.description.trim(),
                logo_url: form.value.logo_url.trim()
            })
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message);

        success.value = 'Council created successfully!';
        setTimeout(() => router.push(`/dashboard/council/${json.data.id}`), 1200);

    } catch (err) {
        error.value = err.message || 'Failed to create council.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="dash-page">

        <div class="dash-header">
            <div class="dash-header-left">
                <p class="dash-label"><i class="fa-solid fa-plus"></i> New Council</p>
                <h1 class="dash-title">Create a <span>Council</span></h1>
                <p class="dash-subtitle">Set up your gaming council to start organizing events.</p>
            </div>
            <a href="/dashboard/council" class="btn-ghost">
                <i class="fa-solid fa-arrow-left"></i> Back
            </a>
        </div>

        <div class="dash-form-wrap">

            <div v-if="error" class="error-box" style="margin-bottom:20px;">
                <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
            </div>
            <div v-if="success" class="success-box" style="margin-bottom:20px;">
                <i class="fa-solid fa-circle-check"></i> {{ success }}
            </div>

            <form class="dash-form" @submit.prevent="handleCreate">

                <!-- Logo upload -->
                <ImageUpload
                    v-model="form.logo_url"
                    label="Council Logo"
                    placeholder="https://example.com/logo.png"
                    previewHeight="180px"
                />

                <!-- Name -->
                <div class="field">
                    <label><i class="fa-solid fa-landmark"></i> Council Name</label>
                    <div class="input-wrap">
                        <i class="fa-solid fa-landmark input-icon"></i>
                        <input
                            type="text"
                            v-model="form.name"
                            placeholder="e.g. Ragnarix Esports Council"
                            maxlength="100"
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
                        class="dash-textarea no-icon"
                        v-model="form.description"
                        placeholder="What is this council about? What games do you organize?"
                        rows="4"
                    ></textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary" :disabled="loading">
                        <span v-if="!loading">
                            <i class="fa-solid fa-bolt"></i> Create Council
                        </span>
                        <span v-else>
                            <i class="fa-solid fa-spinner fa-spin"></i> Creating...
                        </span>
                    </button>
                    <a href="/dashboard/council" class="btn-ghost">Cancel</a>
                </div>

            </form>
        </div>

    </div>
</template>

<style scoped>
@import '../../assets/dashboard.css';
</style>