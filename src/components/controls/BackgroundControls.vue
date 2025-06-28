<template>
    <div class="background-controls">
        <label>Background Customization</label>

        <div class="control-row">
            <label for="bgColorPicker">Background Color</label>
            <input type="color" id="bgColorPicker" v-model="backgroundColor" @input="updateBackgroundColor" />
        </div>

        <label for="bg-image-upload" class="control-button file-label">
            <span class="file-button-text">Upload Background Image</span>
            <span class="file-name-display">{{ backgroundImageName }}</span>
        </label>
        <input id="bg-image-upload" type="file" accept="image/png, image/jpeg" @change="handleBackgroundImageChange"
            style="display: none" />

        <button v-if="backgroundImageName" @click="clearBackgroundImage" class="control-button clear-button">
            Clear Image
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';

const defaultColor = '#111318';
const backgroundColor = ref(defaultColor);
const backgroundImageFile = ref(null);
const backgroundImageName = ref('');

const getGameScene = () => {
    return phaserStore.gameInstance?.scene.getScene('GameScene');
};

const updateBackgroundColor = (event) => {
    const scene = getGameScene();
    if (scene) {
        scene.setBackgroundColor(event.target.value);
    }
};

const handleBackgroundImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    backgroundImageFile.value = file;
    backgroundImageName.value = file.name;
    const scene = getGameScene();
    if (scene) {
        scene.setBackgroundImage(file);
    }
};

const clearBackgroundImage = () => {
    backgroundImageFile.value = null;
    backgroundImageName.value = '';
    const scene = getGameScene();
    if (scene) {
        scene.clearBackgroundImage();
    }
    // Reset color to default when image is cleared
    backgroundColor.value = defaultColor;
    updateBackgroundColor({ target: { value: defaultColor } });
};
</script>

<style lang="postcss" scoped>
.background-controls {
    display: flex;
    flex-direction: column;
    gap: 15px;

    &>label {
        font-weight: 600;
        font-size: 1.1em;
        color: var(--color-white);
    }
}

.control-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &>label {
        font-weight: 500;
    }

    &>input[type="color"] {
        width: 40px;
        height: 40px;
        border: none;
        padding: 0;
        background: none;
        cursor: pointer;
        border-radius: 8px;
    }
}

/* Reusing styles from FileUploader.vue for consistency */
.file-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    background: var(--color-section);
    border: 2px dashed var(--color-gray-dark);

    &:hover {
        background: var(--color-gray-dark);
        border-color: var(--color-red);
    }
}

.file-button-text {
    font-weight: 600;
    pointer-events: none;
}

.file-name-display {
    font-size: 0.8em;
    color: var(--color-red-light);
    margin-top: 5px;
    font-weight: 400;
    pointer-events: none;
    height: 1.2em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.clear-button {
    background-color: var(--color-gray-dark);

    &:hover {
        background-color: var(--color-red);
    }
}
</style>