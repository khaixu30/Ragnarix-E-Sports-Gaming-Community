<script setup>
const props = defineProps({
  council: Object,
});

const emit = defineEmits(['edit', 'delete']);
</script>

<template>
  <div class="council-header-bar">
    <div class="council-logo-lg">
      <img v-if="council?.logo_url" :src="council.logo_url" :alt="council.name" />
      <span v-else>{{ council?.name?.[0]?.toUpperCase() }}</span>
    </div>
    <div class="header-info">
      <div class="header-top-row">
        <h1 class="council-name-h">{{ council?.name }}</h1>
        <span class="owner-crown"><i class="fa-solid fa-crown"></i> Owner</span>
      </div>
      <p class="council-desc-h">{{ council?.description || 'No description provided.' }}</p>
    </div>
    <div class="header-actions">
      <button class="icon-btn" @click="emit('edit')" title="Edit Council">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="icon-btn danger" @click="emit('delete')" title="Delete Council">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.council-header-bar {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  background: var(--bg-card);
  border: 1px solid var(--primary-line);
  border-radius: var(--radius-lg);
  margin-bottom: 22px;
}

.council-logo-lg {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  flex-shrink: 0;
  background: var(--primary-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 900;
  color: var(--primary);
  overflow: hidden;
}

.council-logo-lg img { width: 100%; height: 100%; object-fit: cover; }

.header-info { flex: 1; min-width: 0; }

.header-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.council-name-h {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
}

.owner-crown {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--primary-mid);
  color: var(--primary);
  flex-shrink: 0;
}

.council-desc-h {
  font-size: 12px;
  color: var(--text-dim);
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>