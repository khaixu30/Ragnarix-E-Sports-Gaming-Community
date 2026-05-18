<script setup>
const props = defineProps({
  council: Object,
  activeTab: String,
});

const emit = defineEmits(['tab-change']);

const tabs = [
  { id: 'overview',      icon: 'fa-gauge',          label: 'Overview' },
  { id: 'events',        icon: 'fa-calendar-days',  label: 'Events' },
  { id: 'members',       icon: 'fa-users',           label: 'Members' },
  { id: 'registrations', icon: 'fa-clipboard-list',  label: 'Registrations' },
];
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-mark">Council HQ</div>
      <div class="logo-name">{{ council?.name || '…' }}</div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Manage</div>
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="sidebar-link"
        :class="{ active: activeTab === tab.id }"
        @click="emit('tab-change', tab.id)"
      >
        <i :class="`fa-solid ${tab.icon}`"></i>
        {{ tab.label }}
      </button>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Navigate</div>
      <a :href="`/councils/${council?.id}`" class="sidebar-link">
        <i class="fa-solid fa-eye"></i> Public Page
      </a>
      <a href="/councils" class="sidebar-link">
        <i class="fa-solid fa-landmark"></i> All Councils
      </a>
    </div>

    <div class="sidebar-footer">
      <div class="council-logo-sm">
        <div class="avatar-sm">
          <img v-if="council?.logo_url" :src="council.logo_url" :alt="council.name" />
          <span v-else>{{ council?.name?.[0]?.toUpperCase() }}</span>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text)">{{ council?.name }}</div>
          <div style="font-size:9px;color:var(--text-faint);letter-spacing:0.06em">OWNER</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.council-logo-sm {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-sm {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: var(--primary-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
  color: var(--primary);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
</style>