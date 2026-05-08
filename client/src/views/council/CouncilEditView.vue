<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageUpload from '../../components/ImageUpload.vue';

const route = useRoute();
const router = useRouter();
const council_id = route.params.id;

const loading = ref(false);
const pageLoading = ref(true);
const error = ref('');
const success = ref('');

const form = ref({
    name: '',
    description: '',
    logo_url: ''
});

const fetch_council = async () => {
    try {
        const response = await fetch(`http://localhost:3000/api/council/info/${council_id}`);
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        form.value.name = json.data.name;
        form.value.description = json.data.description || '';
        form.value.logo_url = json.data.logo_url || '';
    } catch (err) {
        error.value = err.message;
    } finally {
        pageLoading.value = false;
    }
};

const handleUpdate = async () => {
    error.value = '';
    success.value = '';

    if (!form.value.name.trim()) {
        error.value = 'Council name is required.';
        return;
    }

    loading.value = true;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/council/patch/${council_id}`, {
            method: 'PATCH',
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

        success.value = 'Council updated successfully!';
        setTimeout(() => router.push(`/dashboard/council/${council_id}`), 1200);

    } catch (err) {
        error.value = err.message || 'Failed to update council.';
    } finally {
        loading.value = false;
    }
};

onMounted(() => fetch_council());
</script>

<template>
    <div class="dash-page">

        <div class="dash-header">
            <div class="dash-header-left">
                <p class="dash-label"><i class="fa-solid fa-pen"></i> Edit Council</p>
                <h1 class="dash-title">Update <span>Council</span></h1>
                <p class="dash-subtitle">Modify your council's name, description or logo.</p>
            </div>
            <a :href="`/dashboard/council/${council_id}`" class="btn-ghost">
                <i class="fa-solid fa-arrow-left"></i> Back
            </a>
        </div>

        <div v-if="pageLoading" class="state-loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading...
        </div>

        <div v-else class="dash-form-wrap">

            <div v-if="error" class="error-box" style="margin-bottom:20px;">
                <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
            </div>
            <div v-if="success" class="success-box" style="margin-bottom:20px;">
                <i class="fa-solid fa-circle-check"></i> {{ success }}
            </div>

            <form class="dash-form" @submit.prevent="handleUpdate">

                <ImageUpload
                    v-model="form.logo_url"
                    label="Council Logo"
                    placeholder="https://example.com/logo.png"
                    previewHeight="180px"
                />

                <div class="field">
                    <label><i class="fa-solid fa-landmark"></i> Council Name</label>
                    <div class="input-wrap">
                        <i class="fa-solid fa-landmark input-icon"></i>
                        <input
                            type="text"
                            v-model="form.name"
                            placeholder="Council name"
                            maxlength="100"
                            required
                        />
                    </div>
                </div>

                <div class="field">
                    <label>
                        <i class="fa-solid fa-align-left"></i> Description
                        <span class="optional">optional</span>
                    </label>
                    <textarea
                        class="dash-textarea no-icon"
                        v-model="form.description"
                        placeholder="What is this council about?"
                        rows="4"
                    ></textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary" :disabled="loading">
                        <span v-if="!loading">
                            <i class="fa-solid fa-floppy-disk"></i> Save Changes
                        </span>
                        <span v-else>
                            <i class="fa-solid fa-spinner fa-spin"></i> Saving...
                        </span>
                    </button>
                    <a :href="`/dashboard/council/${council_id}`" class="btn-ghost">Cancel</a>
                </div>

            </form>
        </div>

    </div>
</template>

<style scoped>
@import '../../assets/dashboard.css';
</style>