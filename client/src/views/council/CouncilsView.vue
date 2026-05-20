<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router   = useRouter();
const councils = ref([]);
const loading  = ref(true);
const search   = ref('');

const BASE = import.meta.env.VITE_HOST;

// Debounced search for snappier filtering on large lists
let debounceTimer = null;
const rawSearch = ref('');
const setSearch = (val) => {
    rawSearch.value = val;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { search.value = val; }, 120);
};

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return councils.value;
    return councils.value.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
});

const getInitials = (name) =>
    name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

onMounted(async () => {
    try {
        const res  = await fetch(`${BASE}/api/council/all`);
        const json = await res.json();
        if (json.success) councils.value = json.data;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
});

const go = (id) => router.push(`/councils/${id}/dashboard`);
</script>

<template>
    <div class="page">
        <div class="bg-grid" aria-hidden="true"></div>
        <div class="bg-glow" aria-hidden="true"></div>

        <!-- ── Header ── -->
        <header class="header">
            <div class="header-left">
                <div class="header-icon"><i class="fa-solid fa-landmark"></i></div>
                <div>
                    <h1 class="page-title">Councils</h1>
                    <p class="page-sub">Competitive gaming organisations</p>
                </div>
            </div>

            <div class="header-right">
                <!-- Search -->
                <div class="search-wrap">
                    <i class="fa-solid fa-magnifying-glass si"></i>
                    <input
                        :value="rawSearch"
                        @input="setSearch($event.target.value)"
                        type="text"
                        placeholder="Search…"
                        autocomplete="off"
                        spellcheck="false"
                    />
                    <button v-if="rawSearch" class="sc" @click="setSearch(''); rawSearch = ''">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Count -->
                <div class="count-badge" v-if="!loading">
                    <span class="count-n">{{ filtered.length }}</span>
                    <span class="count-l">{{ filtered.length === 1 ? 'council' : 'councils' }}</span>
                </div>

                <!-- CTA -->
                <a href="/councils/create" class="btn-new">
                    <span class="btn-new-plus"><i class="fa-solid fa-plus"></i></span>
                    New Council
                </a>
            </div>
        </header>

        <!-- ── Loader ── -->
        <div v-if="loading" class="loader-state">
            <div class="spin-ring"></div>
            <span>Loading…</span>
        </div>

        <!-- ── Empty ── -->
        <div v-else-if="filtered.length === 0" class="empty-state">
            <div class="empty-ico"><i class="fa-solid fa-landmark"></i></div>
            <p class="empty-h">{{ search ? 'No results' : 'No councils yet' }}</p>
            <p class="empty-p">{{ search ? `Nothing matched "${search}"` : 'Create the first council to get started.' }}</p>
            <a v-if="!search" href="/councils/create" class="btn-new sm">
                <i class="fa-solid fa-plus"></i> New Council
            </a>
        </div>

        <!-- ── Grid ── -->
        <div v-else class="grid">
            <div
                v-for="(c, i) in filtered"
                :key="c.id"
                class="card"
                :style="{ '--i': Math.min(i, 12) }"
                @click="go(c.id)"
            >
                <div class="card-shine"></div>

                <div class="card-head">
                    <div class="card-av">
                        <img v-if="c.logo_url" :src="c.logo_url" :alt="c.name" />
                        <span v-else>{{ getInitials(c.name) }}</span>
                    </div>
                    <div class="card-arr"><i class="fa-solid fa-arrow-right"></i></div>
                </div>

                <div class="card-body">
                    <h3 class="card-name">{{ c.name }}</h3>
                    <p class="card-desc">{{ c.description || 'No description provided.' }}</p>
                </div>

                <div class="card-foot">
                    <span class="card-date" v-if="c.created_at">
                        <i class="fa-regular fa-calendar"></i>{{ formatDate(c.created_at) }}
                    </span>
                    <span class="card-cta">Open <i class="fa-solid fa-chevron-right"></i></span>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>

/* ── Reset / Base ────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.page {
    position: relative;
    min-height: 100vh;
    width: 100%;
    padding: 36px 48px 80px;
    overflow-x: hidden;
}

/* ── Background ──────────────────────────────────────────── */
.bg-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
        linear-gradient(rgba(188,103,33,0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(188,103,33,0.045) 1px, transparent 1px);
    background-size: 52px 52px;
    mask-image: radial-gradient(ellipse 90% 55% at 50% 0%, black 0%, transparent 100%);
}

.bg-glow {
    position: fixed; top: -180px; left: 50%; transform: translateX(-50%);
    width: 900px; height: 460px;
    background: radial-gradient(ellipse, rgba(188,103,33,0.13) 0%, transparent 68%);
    pointer-events: none; z-index: 0;
}

/* ── Header ──────────────────────────────────────────────── */
.header {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: space-between;
    gap: 20px; margin-bottom: 40px;
    flex-wrap: wrap;
}

.header-left { display: flex; align-items: center; gap: 16px; }

.header-icon {
    width: 50px; height: 50px; border-radius: 14px; flex-shrink: 0;
    background: rgba(188,103,33,0.11); border: 1px solid rgba(188,103,33,0.24);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: var(--primary-color, #bc6721);
}

.page-title {
    font-size: 34px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--text-color); line-height: 1;
    margin-bottom: 3px;
}

.page-sub { font-size: 12.5px; font-weight: 500; color: var(--text-color); opacity: 0.38; }

.header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* ── Search ──────────────────────────────────────────────── */
.search-wrap {
    display: flex; align-items: center; gap: 9px;
    background: rgba(188,103,33,0.05); border: 1.5px solid rgba(188,103,33,0.14);
    border-radius: 11px; padding: 9px 13px;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
    min-width: 220px;
}
.search-wrap:focus-within {
    border-color: rgba(188,103,33,0.42);
    background: rgba(188,103,33,0.08);
    box-shadow: 0 0 0 3px rgba(188,103,33,0.09);
}

.si { font-size: 12px; color: var(--primary-color, #bc6721); opacity: 0.55; flex-shrink: 0; }

.search-wrap input {
    background: none; border: none; outline: none;
    font-size: 13px; font-weight: 500;
    color: var(--text-color); width: 100%;
}
.search-wrap input::placeholder { opacity: 0.28; }

.sc {
    background: none; border: none; cursor: pointer;
    color: var(--text-color); opacity: 0.28; font-size: 11px;
    padding: 1px 3px; transition: opacity 0.12s; flex-shrink: 0;
}
.sc:hover { opacity: 0.65; }

/* ── Count badge ─────────────────────────────────────────── */
.count-badge {
    display: flex; align-items: baseline; gap: 4px;
    padding: 7px 13px; border-radius: 10px;
    background: rgba(188,103,33,0.06); border: 1px solid rgba(188,103,33,0.14);
    white-space: nowrap;
}
.count-n {
    font-size: 22px;
    font-weight: 900; color: var(--primary-color, #bc6721); line-height: 1;
}
.count-l {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: var(--text-color); opacity: 0.32;
}

/* ── New council button ──────────────────────────────────── */
.btn-new {
    display: inline-flex; align-items: center; gap: 9px;
    padding: 9px 18px 9px 9px; border-radius: 11px;
    font-size: 13px; font-weight: 700;
    background: var(--primary-color, #bc6721); color: #fff;
    text-decoration: none; border: none; cursor: pointer; white-space: nowrap;
    transition: opacity 0.18s, transform 0.15s, box-shadow 0.18s;
    box-shadow: 0 4px 16px rgba(188,103,33,0.32);
}
.btn-new:hover { opacity: 0.87; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(188,103,33,0.42); }
.btn-new:active { transform: none; }
.btn-new.sm { padding: 8px 16px; font-size: 12px; gap: 8px; margin-top: 4px; }

.btn-new-plus {
    width: 26px; height: 26px; border-radius: 7px;
    background: rgba(255,255,255,0.18); display: flex;
    align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;
}

/* ── Loader ──────────────────────────────────────────────── */
.loader-state {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 12px; justify-content: center;
    padding: 100px 0; font-size: 13px; font-weight: 500;
    color: var(--text-color); opacity: 0.32;
}

.spin-ring {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2.5px solid rgba(188,103,33,0.14);
    border-top-color: var(--primary-color, #bc6721);
    animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Empty ───────────────────────────────────────────────── */
.empty-state {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center;
    gap: 10px; padding: 100px 0; text-align: center;
}
.empty-ico {
    width: 60px; height: 60px; border-radius: 16px; margin-bottom: 4px;
    background: rgba(188,103,33,0.08); border: 1px solid rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: var(--primary-color, #bc6721); opacity: 0.45;
}
.empty-h {
    font-size: 20px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-color); opacity: 0.4;
}
.empty-p { font-size: 13px; color: var(--text-color); opacity: 0.28; }

/* ── Grid ────────────────────────────────────────────────── */
.grid {
    position: relative; z-index: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
}

/* ── Card ────────────────────────────────────────────────── */
.card {
    position: relative;
    display: flex; flex-direction: column; gap: 14px;
    padding: 20px; border-radius: 15px; overflow: hidden;
    border: 1px solid rgba(188,103,33,0.12);
    background: rgba(188,103,33,0.03);
    cursor: pointer;
    /* cap stagger at 12 items so later cards don't lag */
    animation: card-in 0.32s ease both;
    animation-delay: calc(var(--i) * 40ms);
    transition: border-color 0.2s, transform 0.18s, box-shadow 0.2s;
    will-change: transform;
}

@keyframes card-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}

.card:hover {
    border-color: rgba(188,103,33,0.34);
    transform: translateY(-3px);
    box-shadow: 0 10px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(188,103,33,0.14);
}

/* shine sweep on hover */
.card-shine {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 55% 45% at 50% 0%, rgba(188,103,33,0.09) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.25s;
}
.card:hover .card-shine { opacity: 1; }

/* ── Card head ── */
.card-head { display: flex; align-items: flex-start; justify-content: space-between; }

.card-av {
    width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
    background: rgba(188,103,33,0.13); border: 1px solid rgba(188,103,33,0.22);
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; font-weight: 900;
    color: var(--primary-color, #bc6721); overflow: hidden;
    transition: border-color 0.18s;
}
.card:hover .card-av { border-color: rgba(188,103,33,0.45); }
.card-av img { width: 100%; height: 100%; object-fit: cover; }

.card-arr {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    background: rgba(188,103,33,0.09); border: 1px solid rgba(188,103,33,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--primary-color, #bc6721);
    opacity: 0; transform: translateX(-5px);
    transition: opacity 0.18s, transform 0.18s;
}
.card:hover .card-arr { opacity: 1; transform: translateX(0); }

/* ── Card body ── */
.card-body { flex: 1; }

.card-name {
    font-size: 18px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.03em; color: var(--text-color); line-height: 1.1; margin-bottom: 6px;
}

.card-desc {
    font-size: 12px; font-weight: 400; color: var(--text-color); opacity: 0.4;
    line-height: 1.55;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ── Card foot ── */
.card-foot {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px; border-top: 1px solid rgba(188,103,33,0.08);
}

.card-date {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.03em;
    color: var(--text-color); opacity: 0.28;
}
.card-date i { font-size: 9px; }

.card-cta {
    display: flex; align-items: center; gap: 4px;
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--primary-color, #bc6721);
    opacity: 0; transform: translateX(-4px);
    transition: opacity 0.18s, transform 0.18s;
}
.card-cta i { font-size: 8px; }
.card:hover .card-cta { opacity: 1; transform: translateX(0); }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
    .page { padding: 24px 20px 60px; }
    .page-title { font-size: 28px; }
    .header { flex-direction: column; align-items: flex-start; }
    .header-right { width: 100%; }
    .search-wrap { flex: 1; min-width: unset; }
    .grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
}

@media (max-width: 480px) {
    .grid { grid-template-columns: 1fr; }
    .count-badge { display: none; }
}
</style>