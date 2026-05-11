<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const councils = ref([]);
const loading = ref(false);
const error = ref('');

const fetch_councils = async () => {
    loading.value = true;
    error.value = '';
    try {
        const response = await fetch(`http://localhost:3000/api/council/all`);
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        councils.value = json.data;
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

onMounted(() => fetch_councils());
</script>

<template>
    <div class="dash-page">

        <div class="dash-header">
            <div class="dash-header-left">
                <p class="dash-label"><i class="fa-solid fa-landmark"></i> Councils</p>
                <h1 class="dash-title">Gaming <span>Councils</span></h1>
                <p class="dash-subtitle">Browse all registered councils or create your own.</p>
            </div>
            <a href="/dashboard/council/create" class="btn-primary">
                <i class="fa-solid fa-plus"></i> Create Council
            </a>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading councils...
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-box">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
        </div>

        <!-- Empty -->
        <div v-else-if="councils.length === 0" class="state-empty">
            <i class="fa-solid fa-landmark"></i>
            <p>No councils found. Be the first to create one!</p>
            <a href="/dashboard/council/create" class="btn-primary">
                <i class="fa-solid fa-plus"></i> Create Council
            </a>
        </div>

        <!-- Grid -->
        <div v-else class="cards-grid">
            <div
                v-for="council in councils"
                :key="council.id"
                class="dash-card"
                @click="router.push(`/dashboard/council/${council.id}`)"
            >
                <img
                    v-if="council.logo_url"
                    :src="council.logo_url"
                    :alt="council.name"
                    class="dash-card-img"
                />
                <div v-else class="dash-card-img-placeholder">
                    <i class="fa-solid fa-landmark"></i>
                </div>

                <div class="dash-card-body">
                    <p class="dash-card-title">{{ council.name }}</p>
                    <p class="dash-card-desc">{{ council.description || 'No description provided.' }}</p>
                    <div class="dash-card-footer">
                        <span class="card-date">
                            <i class="fa-regular fa-calendar"></i>
                            {{ formatDate(council.created_at) }}
                        </span>
                        <span class="view-link">
                            View <i class="fa-solid fa-arrow-right"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
@import '../../assets/dashboard.css';

.card-date {
    font-size: 11px;
    opacity: 0.4;
    display: flex;
    align-items: center;
    gap: 6px;
}

.view-link {
    font-size: 11px;
    font-weight: 700;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}
</style>