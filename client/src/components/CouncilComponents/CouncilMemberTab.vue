<script setup>
import { ref } from 'vue';

const props = defineProps({
  members: Array,
});

const emit = defineEmits(['remove-member', 'add-member']);

const showAdd   = ref(false);
const memberForm = ref({ user_id: '', role: 'Moderator' });

const submitAdd = () => {
  if (!memberForm.value.user_id.trim()) return;
  emit('add-member', { ...memberForm.value });
  memberForm.value = { user_id: '', role: 'Moderator' };
  showAdd.value = false;
};
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="tab-toolbar">
      <span class="count-label">{{ members.length }} member{{ members.length !== 1 ? 's' : '' }}</span>
      <button class="btn-primary" @click="showAdd = true">
        <i class="fa-solid fa-user-plus"></i> Add Member
      </button>
    </div>

    <!-- Table -->
    <div class="panel p0">
      <table class="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Joined</th>
            <th class="right">Remove</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!members.length">
            <td colspan="4" class="empty-cell">No members yet.</td>
          </tr>
          <tr v-for="member in members" :key="member.id">
            <td>
              <div class="user-cell">
                <div class="member-avatar">{{ member.username[0].toUpperCase() }}</div>
                <div>
                  <div class="cell-primary">{{ member.username }}</div>
                  <div class="cell-sub">{{ member.email }}</div>
                </div>
              </div>
            </td>
            <td><span class="tag">{{ member.role }}</span></td>
            <td class="cell-sub">{{ new Date(member.joined_at).toLocaleDateString() }}</td>
            <td class="right">
              <button class="action-btn danger" @click="emit('remove-member', member.id)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Member Modal -->
    <Teleport to="body">
      <div v-if="showAdd" class="modal-backdrop" @click.self="showAdd = false">
        <div class="modal">
          <div class="modal-header">
            <h2>Add Member</h2>
            <button class="modal-close" @click="showAdd = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>User ID <span class="required">*</span></label>
              <input
                v-model="memberForm.user_id"
                type="text"
                placeholder="Paste user UUID"
                @keyup.enter="submitAdd"
              />
            </div>
            <div class="field">
              <label>Role</label>
              <select v-model="memberForm.role">
                <option>Tournament Director</option>
                <option>Moderator</option>
                <option>Manager</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showAdd = false">Cancel</button>
            <button class="btn-primary" @click="submitAdd">
              <i class="fa-solid fa-user-plus"></i> Add Member
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.count-label {
  font-size: 11px;
  color: var(--text-faint);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  flex-shrink: 0;
  background: var(--primary-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  color: var(--primary);
}
</style>