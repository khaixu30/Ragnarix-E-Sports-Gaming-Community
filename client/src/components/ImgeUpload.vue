<script setup>
import { ref } from 'vue';

const props = defineProps({
    modelValue: { type: String, default: '' },       // current URL (v-model)
    label: { type: String, default: 'Image' },
    placeholder: { type: String, default: 'https://...' },
    previewHeight: { type: String, default: '160px' }
});

const emit = defineEmits(['update:modelValue']);

const uploading = ref(false);
const uploadError = ref('');
const fileInput = ref(null);

// ── Cloudinary config ──────────────────────────────────────
// 1. Create a free account at https://cloudinary.com
// 2. Go to Settings → Upload → Upload Presets → Add unsigned preset
// 3. Replace these two values:
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;   // e.g. 'dxyz123abc'
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;    // e.g. 'ragnarix_unsigned'
// ──────────────────────────────────────────────────────────

const uploadToCloudinary = async (file) => {

    console.log(CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url; // e.g. https://res.cloudinary.com/...
};

const handleFile = async (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        uploadError.value = 'Only JPG, PNG, WEBP or GIF files are allowed.';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        uploadError.value = 'File must be under 5MB.';
        return;
    }

    uploading.value = true;
    uploadError.value = '';

    try {
        const url = await uploadToCloudinary(file);
        emit('update:modelValue', url);
    } catch (err) {
        uploadError.value = 'Upload failed. Check your Cloudinary config.';
        console.error(err);
    } finally {
        uploading.value = false;
    }
};

const onFileChange = (e) => handleFile(e.target.files[0]);

const onDrop = (e) => {
    e.preventDefault();
    dragging.value = false;
    handleFile(e.dataTransfer.files[0]);
};

const dragging = ref(false);

const clearImage = () => {
    emit('update:modelValue', '');
    if (fileInput.value) fileInput.value.value = '';
};
</script>

<template>
    <div class="upload-field">
        <label class="upload-label">
            <i class="fa-solid fa-image"></i> {{ label }}
        </label>

        <!-- Preview -->
        <div
            v-if="modelValue"
            class="preview-wrap"
            :style="{ height: previewHeight }"
        >
            <img :src="modelValue" alt="Preview" class="preview-img" />
            <button type="button" class="clear-btn" @click="clearImage">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <!-- Drop zone -->
        <div
            v-else
            class="drop-zone"
            :class="{ dragging, uploading }"
            :style="{ height: previewHeight }"
            @click="fileInput.click()"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop="onDrop"
        >
            <div v-if="uploading" class="drop-inner">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Uploading...</p>
            </div>
            <div v-else class="drop-inner">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <p>Drag & drop or <span>click to browse</span></p>
                <p class="drop-hint">JPG, PNG, WEBP · Max 5MB</p>
            </div>
        </div>

        <!-- Hidden file input -->
        <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display:none"
            @change="onFileChange"
        />

        <!-- Manual URL input -->
        <div class="url-row">
            <div class="input-wrap">
                <i class="fa-solid fa-link input-icon"></i>
                <input
                    type="url"
                    :value="modelValue"
                    @input="emit('update:modelValue', $event.target.value)"
                    :placeholder="placeholder"
                />
            </div>
        </div>

        <!-- Error -->
        <p v-if="uploadError" class="upload-error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ uploadError }}
        </p>
    </div>
</template>

<style scoped>
.upload-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.upload-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.65;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ── Preview ── */
.preview-wrap {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(188, 103, 33, 0.3);
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.clear-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.clear-btn:hover {
    background: rgba(255, 107, 107, 0.6);
}

/* ── Drop zone ── */
.drop-zone {
    border: 2px dashed rgba(188, 103, 33, 0.3);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: rgba(188, 103, 33, 0.03);
}

.drop-zone:hover,
.drop-zone.dragging {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.07);
}

.drop-zone.uploading {
    cursor: not-allowed;
    opacity: 0.7;
}

.drop-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    padding: 16px;
}

.drop-inner i {
    font-size: 28px;
    color: var(--primary-color);
    opacity: 0.5;
}

.drop-inner p {
    font-size: 13px;
    opacity: 0.55;
}

.drop-inner p span {
    color: var(--primary-color);
    font-weight: 600;
}

.drop-hint {
    font-size: 11px !important;
    opacity: 0.35 !important;
}

/* ── URL row ── */
.url-row .input-wrap input {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-color);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    font-family: inherit;
}

.url-row .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 13px;
    font-size: 12px;
    color: var(--primary-color);
    opacity: 0.7;
    pointer-events: none;
}

.url-row .input-wrap input:focus {
    border-color: var(--primary-color);
    background: rgba(188, 103, 33, 0.06);
}

.url-row .input-wrap input::placeholder {
    opacity: 0.3;
}

/* ── Error ── */
.upload-error {
    font-size: 12px;
    color: #ff6b6b;
    display: flex;
    align-items: center;
    gap: 7px;
}
</style>