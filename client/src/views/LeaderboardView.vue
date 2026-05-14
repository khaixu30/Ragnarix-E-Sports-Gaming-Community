<script setup>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import { ref, computed, onMounted } from 'vue';

// ── Base URL (set VITE_API_BASE in .env) ───────────────────────
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

// ── State ─────────────────────────────────────────────────────
const rows        = ref([]);
const events      = ref([]);
const loading     = ref(false);
const error       = ref('');
const total       = ref(0);
const page        = ref(1);
const limit       = ref(20);
const filterEvent = ref('');
const filterGame  = ref('');
const gameInput   = ref('');

// User detail modal
const modalOpen  = ref(false);
const modalUser  = ref(null);
const modalLoad  = ref(false);
const modalError = ref('');

// ── Computed ───────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));
const topScore   = computed(() => rows.value[0]?.total_score    ?? 0);
const topUniv    = computed(() => rows.value[0]?.total_universal ?? 0);
const topPlayer  = computed(() => rows.value[0]?.username       ?? '—');
const hasFilter  = computed(() => filterEvent.value || filterGame.value);

function fmt(n) { return Number(n ?? 0).toLocaleString(); }

function rankIcon(r) {
  if (r === 1) return 'fa-solid fa-trophy';
  if (r === 2) return 'fa-solid fa-medal';
  if (r === 3) return 'fa-solid fa-award';
  return 'fa-solid fa-hashtag';
}
function rankClass(r) {
  if (r === 1) return 'gold';
  if (r === 2) return 'silver';
  if (r === 3) return 'bronze';
  return '';
}

// ── Fetch helpers ──────────────────────────────────────────────
async function load() {
  loading.value = true;
  error.value   = '';
  try {
    const params = new URLSearchParams({ page: page.value, limit: limit.value });
    if (filterEvent.value) params.set('event_id', filterEvent.value);
    if (filterGame.value)  params.set('game_id',  filterGame.value);

    const res  = await fetch(`${BASE}/match?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Failed to load leaderboard');

    rows.value  = data.leaderboard ?? [];
    total.value = data.total ?? 0;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function loadEvents() {
  try {
    const res  = await fetch(`${BASE}/event?limit=100`);
    const data = await res.json();
    events.value = data.events ?? [];
  } catch {
    events.value = [];
  }
}

async function openUser(userId, username) {
  modalOpen.value  = true;
  modalLoad.value  = true;
  modalError.value = '';
  modalUser.value  = { username };
  try {
    const res  = await fetch(`${BASE}/matche/auth/${userId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Failed to load user stats');
    modalUser.value = data.stats;
  } catch (e) {
    modalError.value = e.message;
  } finally {
    modalLoad.value = false;
  }
}

function applyFilter() { page.value = 1; load(); }
function clearFilter()  { filterEvent.value = ''; filterGame.value = ''; gameInput.value = ''; page.value = 1; load(); }
function prevPage()     { if (page.value > 1) { page.value--; load(); } }
function nextPage()     { if (page.value < totalPages.value) { page.value++; load(); } }

let debounce = null;
function onGameInput() {
  clearTimeout(debounce);
  debounce = setTimeout(() => { filterGame.value = gameInput.value; applyFilter(); }, 450);
}

onMounted(() => { load(); loadEvents(); });
</script>

<template>
  <Navbar />
  <div class="page">

    <!-- ── Hero ─────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-content">
        <p class="hero-label"><i class="fa-solid fa-ranking-star"></i> Live Rankings — Season 2025</p>
        <h1>Global <span>Leaderboard</span></h1>
        <p class="hero-desc">
          Real-time player rankings aggregated across all events and games.
          Scores are calculated from raw game points and normalized universal
          points for cross-game comparisons.
        </p>
      </div>
      <div class="hero-badge">
        <i class="fa-solid fa-ranking-star"></i>
      </div>
    </section>

    <!-- ── Stat Strip ─────────────────────────────────────────── -->
    <section class="stat-strip">
      <div class="stat-item">
        <p class="stat-value">{{ fmt(total) }}</p>
        <p class="stat-label"><i class="fa-solid fa-users"></i> Players Ranked</p>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <p class="stat-value amber">{{ fmt(topScore) }}</p>
        <p class="stat-label"><i class="fa-solid fa-star"></i> Top Game Score</p>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <p class="stat-value amber">{{ fmt(topUniv) }}</p>
        <p class="stat-label"><i class="fa-solid fa-bolt"></i> Top Universal Pts</p>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <p class="stat-value">{{ topPlayer }}</p>
        <p class="stat-label"><i class="fa-solid fa-crown"></i> Current Leader</p>
      </div>
    </section>

    <!-- ── Filters ────────────────────────────────────────────── -->
    <section class="section filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label"><i class="fa-solid fa-trophy"></i> Event</label>
          <select class="filter-select" v-model="filterEvent" @change="applyFilter">
            <option value="">All Events</option>
            <option v-for="ev in events" :key="ev.id" :value="ev.id">{{ ev.title }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label"><i class="fa-solid fa-gamepad"></i> Game ID</label>
          <input
            class="filter-input"
            v-model="gameInput"
            placeholder="Paste Game UUID…"
            @input="onGameInput"
          />
        </div>
        <button v-if="hasFilter" class="btn-clear" @click="clearFilter">
          <i class="fa-solid fa-xmark"></i> Clear Filters
        </button>
        <button class="btn-refresh" @click="load" :disabled="loading">
          <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrows-rotate'"></i>
          Refresh
        </button>
      </div>
    </section>

    <!-- ── Rankings Table ─────────────────────────────────────── -->
    <section class="section table-section">
      <div class="section-header">
        <div>
          <p class="section-label"><i class="fa-solid fa-list-ol"></i> Rankings</p>
          <h2>Player <span>Standings</span></h2>
        </div>
        <p class="results-count" v-if="!loading">
          Showing {{ rows.length }} of {{ fmt(total) }} players
        </p>
      </div>

      <div class="alert-error" v-if="error">
        <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
      </div>

      <div class="table-wrap">
        <table class="lb-table">
          <thead>
            <tr>
              <th class="col-rank">Rank</th>
              <th class="col-player">Player</th>
              <th class="col-score">Game Score</th>
              <th class="col-univ">Universal Pts</th>
              <th class="col-matches">Matches</th>
              <th class="col-games">Games</th>
              <th class="col-action"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="empty-row">
              <td colspan="7">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading rankings…
              </td>
            </tr>
            <tr v-else-if="!rows.length" class="empty-row">
              <td colspan="7">
                <i class="fa-solid fa-ranking-star"></i>
                No players found
              </td>
            </tr>
            <tr
              v-else
              v-for="row in rows"
              :key="row.user_id"
              :class="['lb-row', rankClass(Number(row.rank))]"
              @click="openUser(row.user_id, row.username)"
            >
              <td class="col-rank">
                <div class="rank-badge" :class="rankClass(Number(row.rank))">
                  <i :class="rankIcon(Number(row.rank))"></i>
                  <span>{{ row.rank }}</span>
                </div>
              </td>
              <td class="col-player">
                <div class="player-cell">
                  <div class="avatar">{{ (row.username ?? '??').slice(0,2).toUpperCase() }}</div>
                  <div>
                    <p class="player-name">{{ row.username }}</p>
                    <p class="player-id">{{ row.user_id?.slice(0,8).toUpperCase() }}…</p>
                  </div>
                </div>
              </td>
              <td class="col-score">
                <span class="score-main">{{ fmt(row.total_score) }}</span>
              </td>
              <td class="col-univ">
                <span class="score-univ">{{ fmt(row.total_universal) }}</span>
              </td>
              <td class="col-matches">
                <span class="matches-count">{{ row.matches_played }}</span>
              </td>
              <td class="col-games">
                <div class="tag-list">
                  <span class="game-tag" v-for="g in (row.games_played ?? []).slice(0,3)" :key="g">{{ g }}</span>
                  <span class="game-tag more" v-if="(row.games_played ?? []).length > 3">
                    +{{ row.games_played.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="col-action">
                <button class="btn-view" @click.stop="openUser(row.user_id, row.username)">
                  <i class="fa-solid fa-chart-bar"></i> Stats
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="total > limit">
        <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
        <div class="page-controls">
          <button class="page-btn" :disabled="page <= 1" @click="prevPage">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="page-current">{{ page }}</span>
          <button class="page-btn" :disabled="page >= totalPages" @click="nextPage">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- ── Top 3 Podium ───────────────────────────────────────── -->
    <section class="section alt podium-section" v-if="rows.length >= 3 && !loading">
      <p class="section-label"><i class="fa-solid fa-crown"></i> Podium</p>
      <h2>Top <span>Three Players</span></h2>
      <div class="podium-grid">

        <!-- 2nd -->
        <div class="podium-card silver">
          <div class="podium-rank"><i class="fa-solid fa-medal"></i> #2</div>
          <div class="podium-avatar">{{ (rows[1]?.username ?? '').slice(0,2).toUpperCase() }}</div>
          <p class="podium-name">{{ rows[1]?.username }}</p>
          <p class="podium-score">{{ fmt(rows[1]?.total_score) }} <span>pts</span></p>
          <p class="podium-matches">{{ rows[1]?.matches_played }} matches</p>
          <div class="podium-tags">
            <span v-for="g in (rows[1]?.games_played ?? []).slice(0,2)" :key="g">{{ g }}</span>
          </div>
        </div>

        <!-- 1st — center & raised -->
        <div class="podium-card gold featured">
          <div class="podium-crown"><i class="fa-solid fa-crown"></i></div>
          <div class="podium-rank"><i class="fa-solid fa-trophy"></i> #1</div>
          <div class="podium-avatar large">{{ (rows[0]?.username ?? '').slice(0,2).toUpperCase() }}</div>
          <p class="podium-name">{{ rows[0]?.username }}</p>
          <p class="podium-score">{{ fmt(rows[0]?.total_score) }} <span>pts</span></p>
          <p class="podium-matches">{{ rows[0]?.matches_played }} matches</p>
          <div class="podium-tags">
            <span v-for="g in (rows[0]?.games_played ?? []).slice(0,2)" :key="g">{{ g }}</span>
          </div>
        </div>

        <!-- 3rd -->
        <div class="podium-card bronze">
          <div class="podium-rank"><i class="fa-solid fa-award"></i> #3</div>
          <div class="podium-avatar">{{ (rows[2]?.username ?? '').slice(0,2).toUpperCase() }}</div>
          <p class="podium-name">{{ rows[2]?.username }}</p>
          <p class="podium-score">{{ fmt(rows[2]?.total_score) }} <span>pts</span></p>
          <p class="podium-matches">{{ rows[2]?.matches_played }} matches</p>
          <div class="podium-tags">
            <span v-for="g in (rows[2]?.games_played ?? []).slice(0,2)" :key="g">{{ g }}</span>
          </div>
        </div>

      </div>
    </section>

    <!-- ── CTA Strip ──────────────────────────────────────────── -->
    <section class="cta-section">
      <i class="fa-solid fa-bolt cta-icon"></i>
      <h2>Rankings Update <span>After Every Match</span></h2>
      <p>Scores are aggregated live from all recorded match results across every active event.</p>
      <div class="cta-chips">
        <span><i class="fa-solid fa-check"></i> Game Points</span>
        <span><i class="fa-solid fa-check"></i> Universal Points</span>
        <span><i class="fa-solid fa-check"></i> Cross-Game Ranking</span>
        <span><i class="fa-solid fa-check"></i> Per-Event Scope</span>
      </div>
    </section>

  </div>

  <!-- ── Player Stats Modal ─────────────────────────────────── -->
  <transition name="fade">
    <div class="modal-backdrop" v-if="modalOpen" @click.self="modalOpen = false">
      <div class="modal">
        <div class="modal-header">
          <p class="modal-label"><i class="fa-solid fa-chart-bar"></i> Player Profile</p>
          <h3 class="modal-title">{{ modalUser?.username ?? '…' }}</h3>
          <button class="modal-close" @click="modalOpen = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="modalLoad" class="modal-loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading stats…
          </div>
          <div v-else-if="modalError" class="alert-error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ modalError }}
          </div>
          <div v-else-if="modalUser">
            <div class="modal-stats">
              <div class="modal-stat">
                <p class="modal-stat-val amber">#{{ modalUser.rank }}</p>
                <p class="modal-stat-label">Global Rank</p>
              </div>
              <div class="modal-stat">
                <p class="modal-stat-val">{{ fmt(modalUser.total_score) }}</p>
                <p class="modal-stat-label">Game Score</p>
              </div>
              <div class="modal-stat">
                <p class="modal-stat-val">{{ fmt(modalUser.total_universal) }}</p>
                <p class="modal-stat-label">Universal Pts</p>
              </div>
              <div class="modal-stat">
                <p class="modal-stat-val">{{ modalUser.matches_played }}</p>
                <p class="modal-stat-label">Matches</p>
              </div>
            </div>
            <div class="modal-games" v-if="(modalUser.games_played ?? []).length">
              <p class="modal-section-label"><i class="fa-solid fa-gamepad"></i> Games Played</p>
              <div class="tag-list">
                <span class="game-tag" v-for="g in modalUser.games_played" :key="g">{{ g }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-close-modal" @click="modalOpen = false">Close</button>
        </div>
      </div>
    </div>
  </transition>

  <Footer />
</template>

<style scoped>
/* ── Page ──────────────────────────────────────────────────── */
.page { background: #1a1410; color: var(--text-color); font-family: inherit; }

/* ── Hero ──────────────────────────────────────────────────── */
.hero {
  background: var(--bg-color);
  border-bottom: 2px solid var(--primary-color);
  padding: 72px 64px 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
}
.hero-label {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hero h1 { font-size: 52px; font-weight: 900; text-transform: uppercase; line-height: 1.05; margin-bottom: 18px; }
.hero h1 span { color: var(--primary-color); }
.hero-desc { font-size: 15px; opacity: 0.65; max-width: 520px; line-height: 1.75; }
.hero-badge {
  width: 120px; height: 120px;
  border-radius: 50%;
  border: 2px solid rgba(188,103,33,0.3);
  background: rgba(188,103,33,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 48px; color: var(--primary-color); flex-shrink: 0;
}

/* ── Stat Strip ────────────────────────────────────────────── */
.stat-strip {
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-color);
  border-bottom: 1px solid rgba(188,103,33,0.15);
  flex-wrap: wrap;
}
.stat-item { padding: 28px 48px; text-align: center; }
.stat-value { font-size: 28px; font-weight: 900; text-transform: uppercase; margin-bottom: 6px; font-family: monospace; }
.stat-value.amber { color: var(--primary-color); }
.stat-label {
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.5;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.stat-divider { width: 1px; height: 48px; background: rgba(188,103,33,0.2); flex-shrink: 0; }

/* ── Filters ───────────────────────────────────────────────── */
.filters-section { padding-top: 32px; padding-bottom: 8px; }
.filters-row { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--primary-color); display: flex; align-items: center; gap: 6px;
}
.filter-select, .filter-input {
  background: var(--bg-color);
  border: 1px solid rgba(188,103,33,0.25);
  border-radius: 8px;
  color: var(--text-color);
  font-size: 13px;
  padding: 9px 14px;
  outline: none;
  min-width: 200px;
  transition: border-color 0.15s;
  appearance: none;
}
.filter-select:focus, .filter-input:focus { border-color: var(--primary-color); }
.filter-input::placeholder { opacity: 0.4; }
.btn-clear {
  background: transparent; border: 1px solid rgba(188,103,33,0.25); border-radius: 8px;
  color: var(--primary-color); font-size: 12px; padding: 9px 16px; cursor: pointer;
  display: flex; align-items: center; gap: 6px; transition: background 0.15s;
}
.btn-clear:hover { background: rgba(188,103,33,0.08); }
.btn-refresh {
  background: rgba(188,103,33,0.12); border: 1px solid rgba(188,103,33,0.35); border-radius: 8px;
  color: var(--primary-color); font-size: 12px; font-weight: 700; padding: 9px 20px; cursor: pointer;
  display: flex; align-items: center; gap: 8px; letter-spacing: 0.06em; text-transform: uppercase;
  transition: background 0.15s;
}
.btn-refresh:hover { background: rgba(188,103,33,0.22); }
.btn-refresh:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Section ───────────────────────────────────────────────── */
.section { padding: 48px 64px; }
.section.alt {
  background: var(--bg-color);
  border-top: 1px solid rgba(188,103,33,0.15);
  border-bottom: 1px solid rgba(188,103,33,0.15);
}
.section-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em;
  color: var(--primary-color); margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.section h2 { font-size: 32px; font-weight: 900; text-transform: uppercase; margin-bottom: 28px; }
.section h2 span { color: var(--primary-color); }
.section-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.section-header h2 { margin-bottom: 0; }
.results-count { font-size: 12px; opacity: 0.45; letter-spacing: 0.06em; font-family: monospace; }

/* ── Alert ─────────────────────────────────────────────────── */
.alert-error {
  background: rgba(220,50,50,0.1); border: 1px solid rgba(220,50,50,0.3);
  border-radius: 8px; color: #ff8080; font-size: 13px;
  padding: 12px 16px; margin-bottom: 20px;
  display: flex; align-items: center; gap: 8px;
}

/* ── Table ─────────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(188,103,33,0.2);
  border-radius: 12px;
}
.lb-table { width: 100%; border-collapse: collapse; }
.lb-table th {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--primary-color); padding: 13px 20px; text-align: left;
  background: var(--bg-color); border-bottom: 1px solid rgba(188,103,33,0.2);
  white-space: nowrap; opacity: 0.85;
}
.lb-table td { padding: 14px 20px; border-bottom: 1px solid rgba(188,103,33,0.08); vertical-align: middle; }
.lb-table tbody tr:last-child td { border-bottom: none; }
.lb-row { cursor: pointer; transition: background 0.12s; }
.lb-row:hover td          { background: rgba(188,103,33,0.05); }
.lb-row.gold   td         { background: rgba(245,166,35,0.04); }
.lb-row.silver td         { background: rgba(160,160,180,0.03); }
.lb-row.bronze td         { background: rgba(180,100,40,0.04); }

/* ── Rank Badge ────────────────────────────────────────────── */
.rank-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; font-weight: 700; padding: 4px 10px;
  border-radius: 6px; border: 1px solid rgba(188,103,33,0.2);
  color: var(--text-color); font-family: monospace; opacity: 0.55;
}
.rank-badge.gold   { color: #f5a623; border-color: rgba(245,166,35,0.45); opacity: 1; background: rgba(245,166,35,0.08); }
.rank-badge.silver { color: #b0b0c8; border-color: rgba(176,176,200,0.35); opacity: 1; background: rgba(176,176,200,0.06); }
.rank-badge.bronze { color: #cd7f45; border-color: rgba(205,127,69,0.35); opacity: 1; background: rgba(205,127,69,0.06); }

/* ── Player Cell ───────────────────────────────────────────── */
.player-cell { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(188,103,33,0.12); border: 1px solid rgba(188,103,33,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; color: var(--primary-color); flex-shrink: 0;
}
.player-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
.player-id { font-family: monospace; font-size: 10px; opacity: 0.35; letter-spacing: 0.04em; }

/* ── Scores ────────────────────────────────────────────────── */
.score-main { font-family: monospace; font-size: 15px; font-weight: 700; color: var(--primary-color); }
.score-univ { font-family: monospace; font-size: 13px; opacity: 0.6; }
.matches-count { font-family: monospace; font-size: 13px; opacity: 0.55; }

/* ── Tags ──────────────────────────────────────────────────── */
.tag-list { display: flex; gap: 6px; flex-wrap: wrap; }
.game-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
  background: rgba(188,103,33,0.1); border: 1px solid rgba(188,103,33,0.22);
  color: var(--hover-color); white-space: nowrap;
}
.game-tag.more { opacity: 0.5; }

/* ── View Button ───────────────────────────────────────────── */
.btn-view {
  background: transparent; border: 1px solid rgba(188,103,33,0.25); border-radius: 6px;
  color: var(--primary-color); font-size: 11px; font-weight: 600; padding: 5px 12px;
  cursor: pointer; display: flex; align-items: center; gap: 5px;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap; letter-spacing: 0.04em; text-transform: uppercase;
}
.btn-view:hover { background: rgba(188,103,33,0.12); border-color: var(--primary-color); }

/* ── Pagination ────────────────────────────────────────────── */
.pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-top: 1px solid rgba(188,103,33,0.12);
  flex-wrap: wrap; gap: 8px;
}
.page-info { font-size: 12px; opacity: 0.45; font-family: monospace; letter-spacing: 0.06em; }
.page-controls { display: flex; align-items: center; gap: 8px; }
.page-btn {
  width: 32px; height: 32px; border-radius: 6px;
  border: 1px solid rgba(188,103,33,0.25); background: transparent;
  color: var(--primary-color); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: background 0.15s;
}
.page-btn:hover:not(:disabled) { background: rgba(188,103,33,0.1); }
.page-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.page-current { font-family: monospace; font-size: 13px; font-weight: 700; color: var(--primary-color); min-width: 24px; text-align: center; }

/* ── Empty Row ─────────────────────────────────────────────── */
.empty-row td {
  text-align: center; padding: 56px; font-size: 13px; opacity: 0.4;
  letter-spacing: 0.06em;
}
.empty-row td i { font-size: 28px; color: var(--primary-color); opacity: 0.4; display: block; margin: 0 auto 10px; }

/* ── Podium ────────────────────────────────────────────────── */
.podium-section { padding-bottom: 64px; }
.podium-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 20px; align-items: end; margin-top: 8px;
}
.podium-card {
  background: #1a1410; border: 1px solid rgba(188,103,33,0.18);
  border-radius: 14px; padding: 32px 24px; text-align: center;
  position: relative; transition: transform 0.2s, border-color 0.2s;
}
.podium-card:hover { transform: translateY(-4px); }
.podium-card.gold   { border-color: rgba(245,166,35,0.5); }
.podium-card.silver { border-color: rgba(176,176,200,0.35); }
.podium-card.bronze { border-color: rgba(205,127,69,0.35); }
.podium-card.featured {
  background: var(--bg-color); padding-top: 48px;
  box-shadow: 0 0 40px rgba(245,166,35,0.08);
}
.podium-crown {
  position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
  font-size: 24px; color: #f5a623;
  filter: drop-shadow(0 0 8px rgba(245,166,35,0.6));
}
.podium-rank {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;
  margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.podium-card.gold   .podium-rank { color: #f5a623; }
.podium-card.silver .podium-rank { color: #b0b0c8; }
.podium-card.bronze .podium-rank { color: #cd7f45; }
.podium-avatar {
  width: 56px; height: 56px; border-radius: 12px;
  background: rgba(188,103,33,0.12); border: 2px solid rgba(188,103,33,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; color: var(--primary-color);
  margin: 0 auto 16px;
}
.podium-avatar.large { width: 72px; height: 72px; font-size: 24px; border-color: rgba(245,166,35,0.5); }
.podium-name { font-size: 15px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; }
.podium-score { font-family: monospace; font-size: 22px; font-weight: 900; color: var(--primary-color); margin-bottom: 4px; }
.podium-score span { font-size: 12px; opacity: 0.5; font-weight: 400; }
.podium-matches { font-size: 11px; opacity: 0.4; margin-bottom: 14px; letter-spacing: 0.06em; }
.podium-tags { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.podium-tags span {
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
  background: rgba(188,103,33,0.1); border: 1px solid rgba(188,103,33,0.22);
  color: var(--hover-color);
}

/* ── CTA ───────────────────────────────────────────────────── */
.cta-section {
  background: var(--bg-color); border-top: 2px solid var(--primary-color);
  padding: 64px; text-align: center;
}
.cta-icon { font-size: 40px; color: var(--primary-color); margin-bottom: 20px; display: block; }
.cta-section h2 { font-size: 28px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; }
.cta-section h2 span { color: var(--primary-color); }
.cta-section p { font-size: 13px; opacity: 0.5; margin-bottom: 28px; letter-spacing: 0.04em; }
.cta-chips { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
.cta-chips span {
  font-size: 12px; font-weight: 600; padding: 8px 20px; border-radius: 999px;
  border: 1px solid rgba(188,103,33,0.35); background: rgba(188,103,33,0.1);
  color: var(--hover-color); display: flex; align-items: center; gap: 8px;
}
.cta-chips span i { color: var(--primary-color); }

/* ── Modal ─────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(10,8,6,0.82);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 24px;
}
.modal {
  background: #1e1a15; border: 1px solid rgba(188,103,33,0.45);
  border-radius: 14px; width: 100%; max-width: 500px;
  overflow: hidden; animation: modal-in 0.18s ease;
}
@keyframes modal-in {
  from { opacity: 0; transform: translateY(-14px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}
.modal-header { padding: 24px 28px 20px; border-bottom: 1px solid rgba(188,103,33,0.15); position: relative; }
.modal-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--primary-color); margin-bottom: 6px;
  display: flex; align-items: center; gap: 6px;
}
.modal-title { font-size: 22px; font-weight: 900; text-transform: uppercase; }
.modal-close {
  position: absolute; top: 20px; right: 20px;
  background: transparent; border: 1px solid rgba(188,103,33,0.2); border-radius: 6px;
  color: var(--text-color); width: 30px; height: 30px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: background 0.15s;
}
.modal-close:hover { background: rgba(188,103,33,0.1); }
.modal-body { padding: 24px 28px; }
.modal-loading {
  text-align: center; padding: 32px; opacity: 0.5; font-size: 13px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.modal-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.modal-stat {
  background: rgba(188,103,33,0.06); border: 1px solid rgba(188,103,33,0.18);
  border-radius: 10px; padding: 16px; text-align: center;
}
.modal-stat-val { font-family: monospace; font-size: 24px; font-weight: 900; margin-bottom: 4px; }
.modal-stat-val.amber { color: var(--primary-color); }
.modal-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.45; }
.modal-section-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--primary-color); margin-bottom: 10px;
  display: flex; align-items: center; gap: 6px;
}
.modal-games { margin-top: 4px; }
.modal-footer { padding: 16px 28px; border-top: 1px solid rgba(188,103,33,0.12); display: flex; justify-content: flex-end; }
.btn-close-modal {
  background: rgba(188,103,33,0.1); border: 1px solid rgba(188,103,33,0.3); border-radius: 8px;
  color: var(--primary-color); font-size: 12px; font-weight: 700; padding: 8px 22px;
  cursor: pointer; letter-spacing: 0.08em; text-transform: uppercase; transition: background 0.15s;
}
.btn-close-modal:hover { background: rgba(188,103,33,0.2); }

/* ── Transitions ───────────────────────────────────────────── */
.fade-enter-active { transition: opacity 0.18s, transform 0.18s; }
.fade-leave-active { transition: opacity 0.12s; }
.fade-enter-from  { opacity: 0; transform: scale(0.98); }
.fade-leave-to    { opacity: 0; }

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 960px) {
  .hero { flex-direction: column; padding: 48px 32px; }
  .hero-badge { display: none; }
  .section { padding: 40px 32px; }
  .podium-grid { grid-template-columns: 1fr; }
  .stat-strip { flex-direction: column; }
  .stat-divider { width: 80%; height: 1px; }
  .cta-section { padding: 48px 32px; }
}
@media (max-width: 640px) {
  .hero h1 { font-size: 36px; }
  .filters-row { flex-direction: column; align-items: stretch; }
  .filter-select, .filter-input { min-width: unset; width: 100%; }
  .modal-stats { grid-template-columns: 1fr 1fr; }
}
</style>