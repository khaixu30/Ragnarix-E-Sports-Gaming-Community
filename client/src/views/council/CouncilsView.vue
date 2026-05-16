<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router   = useRouter();
const councils = ref([]);
const loading  = ref(true);
const search   = ref('');

const BASE = import.meta.env.VITE_HOST;

const filtered = () =>
    councils.value.filter(c =>
        c.name.toLowerCase().includes(search.value.toLowerCase())
    );

onMounted(async () => {
    try {
        const res  = await fetch(`${BASE}/api/councils/all`);
        const json = await res.json();
        if (json.success) councils.value = json.data;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="page">
        <div class="page-header">
            <div>
                <h1 class="page-title">Councils</h1>
                <p class="page-sub">Competitive gaming organisations</p>
            </div>
            <a href="/councils/create" class="btn-primary">
                <i class="fa-solid fa-plus"></i> Create Council
            </a>
        </div>

        <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="search" type="text" placeholder="Search councils…" />
        </div>

        <div v-if="loading" class="empty-state"><span class="spinner"></span></div>

        <div v-else-if="filtered().length === 0" class="empty-state">
            <i class="fa-solid fa-landmark fa-2x"></i>
            <p>No councils found</p>
        </div>

        <div v-else class="grid">
            <div
                v-for="council in filtered()" :key="council.id"
                class="council-card"
                @click="router.push({ name: 'council-detail', params: { id: council.id } })"
            >
                <div class="card-logo">
                    <img v-if="council.logo_url" :src="council.logo_url" :alt="council.name" />
                    <span v-else>{{ council.name[0].toUpperCase() }}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-name">{{ council.name }}</h3>
                    <p class="card-desc">{{ council.description || 'No description.' }}</p>
                </div>
                <i class="fa-solid fa-chevron-right card-arrow"></i>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page { padding: 32px; max-width: 900px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: var(--text-color); margin-bottom: 4px; }
.page-sub { font-size: 13px; color: var(--text-color); opacity: 0.45; }
.btn-primary {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px;
    border-radius: 9px; font-size: 13px; font-weight: 700; background: var(--primary-color);
    color: #fff; text-decoration: none; border: none; cursor: pointer; transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.85; }
.search-bar {
    display: flex; align-items: center; gap: 10px; background: rgba(188,103,33,0.05);
    border: 1px solid rgba(188,103,33,0.15); border-radius: 10px; padding: 10px 14px; margin-bottom: 24px;
}
.search-bar i { font-size: 13px; color: var(--primary-color); opacity: 0.6; }
.search-bar input { background: none; border: none; outline: none; font-size: 13px; color: var(--text-color); width: 100%; font-weight: 500; }
.grid { display: flex; flex-direction: column; gap: 8px; }
.council-card {
    display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px;
    border: 1px solid rgba(188,103,33,0.12); background: rgba(188,103,33,0.03); cursor: pointer; transition: all 0.2s;
}
.council-card:hover { background: rgba(188,103,33,0.07); border-color: rgba(188,103,33,0.3); transform: translateX(2px); }
.card-logo {
    width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0; background: rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900;
    color: var(--primary-color); overflow: hidden;
}
.card-logo img { width: 100%; height: 100%; object-fit: cover; }
.card-body { flex: 1; min-width: 0; }
.card-name { font-size: 14px; font-weight: 700; color: var(--text-color); margin-bottom: 3px; }
.card-desc { font-size: 12px; color: var(--text-color); opacity: 0.45; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-arrow { font-size: 11px; color: var(--text-color); opacity: 0.2; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 0; color: var(--text-color); opacity: 0.3; font-size: 14px; }
.spinner {
    width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(188,103,33,0.2);
    border-top-color: var(--primary-color); animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>