<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  council:    Object,
  loading:    Boolean,
});

const emit = defineEmits(['update:modelValue', 'save']);

const form = ref({ name: '', description: '', logo_url: '' });

watch(() => props.council, (c) => {
  if (c) {
    form.value = {
      name:        c.name || '',
      description: c.description || '',
      logo_url:    c.logo_url || '',
    };
  }
}, { immediate: true });

const close = () => emit('update:modelValue', false);
const save  = () => emit('save', { ...form.value });
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <h2><i class="fa-solid fa-pen" style="color:var(--primary);margin-right:8px"></i>Edit Council</h2>
          <button class="modal-close" @click="close"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <!-- Logo preview -->
          <div class="logo-row">
            <div class="logo-preview-box">
              <img v-if="form.logo_url" :src="form.logo_url" alt="Logo" />
              <span v-else>{{ form.name?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <div class="field" style="flex:1">
              <label>Logo URL</label>
              <input v-model="form.logo_url" type="url" placeholder="https://example.com/logo.png" />
            </div>
          </div>

          <div class="field">
            <label>Council Name <span class="required">*</span></label>
            <input v-model="form.name" type="text" maxlength="100" placeholder="Council name" />
          </div>

          <div class="field">
            <label>Description <span class="optional">optional</span></label>
            <textarea v-model="form.description" rows="3" placeholder="What is this council about?"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-ghost" @click="close">Cancel</button>
          <button class="btn-primary" :disabled="loading" @click="save">
            <span v-if="loading" class="spinner-sm"></span>
            <i v-else class="fa-solid fa-floppy-disk"></i>
            {{ loading ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.logo-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.logo-preview-box {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
  background: var(--primary-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 900;
  color: var(--primary);
  overflow: hidden;
  border: 1px solid var(--primary-line);
}

.logo-preview-box img { width: 100%; height: 100%; object-fit: cover; }
</style>