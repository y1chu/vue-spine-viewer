<template>
    <div class="upload-section">
        <label>Upload Animation Files</label>

        <label for="json-upload" class="control-button file-label">
            <span class="file-button-text">1. Select .JSON File</span>
            <span class="file-name-display">{{ jsonFileName }}</span>
        </label>
        <input id="json-upload" type="file" accept=".json" @change="handleFileChange($event, 'json')"
            style="display: none" />

        <label for="atlas-upload" class="control-button file-label">
            <span class="file-button-text">2. Select .ATLAS File</span>
            <span class="file-name-display">{{ atlasFileName }}</span>
        </label>
        <input id="atlas-upload" type="file" accept=".atlas,.txt" @change="handleFileChange($event, 'atlas')"
            style="display: none" />

        <label for="png-upload" class="control-button file-label">
            <span class="file-button-text">3. Select .PNG Image(s)</span>
            <span class="file-name-display">{{ pngFileName }}</span>
        </label>
        <input id="png-upload" type="file" accept=".png,.pma,.pma.png" multiple
            @change="handleFileChange($event, 'png')" style="display: none" />

        <button @click="loadAnimation" class="control-button load-button">
            Load Animation
        </button>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';

const files = ref({
    jsonFile: null,
    atlasFile: null,
    pngFiles: null,
});

const jsonFileName = computed(() => files.value.jsonFile?.name || '');
const atlasFileName = computed(() => files.value.atlasFile?.name || '');
const pngFileName = computed(() => {
    if (!files.value.pngFiles || files.value.pngFiles.length === 0) return '';
    if (files.value.pngFiles.length === 1) return files.value.pngFiles[0].name;
    return `${files.value.pngFiles.length} images selected`;
});

const handleFileChange = (event, type) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    if (type === 'json') files.value.jsonFile = fileList[0];
    if (type === 'atlas') files.value.atlasFile = fileList[0];
    if (type === 'png') files.value.pngFiles = fileList;
};

const loadAnimation = () => {
    if (!files.value.jsonFile || !files.value.atlasFile || !files.value.pngFiles?.length) {
        alert('Please select all required files (.json, .atlas, and at least one .png).');
        return;
    }
    const gameScene = phaserStore.gameInstance?.scene.getScene('GameScene');
    if (gameScene) {
        gameScene.loadAndDisplaySpine(files.value);
    }
};
</script>

<style lang="postcss" scoped>
.upload-section {
    display: flex;
    flex-direction: column;
    gap: 15px;

    &>label {
        font-weight: 600;
        font-size: 1.1em;
        color: var(--color-white);
    }
}

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
</style>