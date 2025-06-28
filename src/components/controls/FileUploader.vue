<template>
  <div class="upload-section">
    <label>{{ t('uploader.title') }}</label>

    <label for="json-upload" class="control-button file-label">
      <span class="file-button-text">{{ t('uploader.select_json') }}</span>
      <span class="file-name-display">{{ jsonFileName }}</span>
    </label>
    <input
      id="json-upload"
      type="file"
      accept=".json"
      @change="handleFileChange($event, 'json')"
      style="display: none"
    />

    <label for="atlas-upload" class="control-button file-label">
      <span class="file-button-text">{{ t('uploader.select_atlas') }}</span>
      <span class="file-name-display">{{ atlasFileName }}</span>
    </label>
    <input
      id="atlas-upload"
      type="file"
      accept=".atlas,.txt"
      @change="handleFileChange($event, 'atlas')"
      style="display: none"
    />

    <label for="png-upload" class="control-button file-label">
      <span class="file-button-text">{{ t('uploader.select_png') }}</span>
      <span class="file-name-display">{{ pngFileName }}</span>
    </label>
    <input
      id="png-upload"
      type="file"
      accept=".png,.pma,.pma.png"
      multiple
      @change="handleFileChange($event, 'png')"
      style="display: none"
    />

    <button @click="loadAnimation" class="control-button load-button">
      {{ t('uploader.load') }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'

const { t } = useI18n()

const files = ref({
  jsonFile: null,
  atlasFile: null,
  pngFiles: null,
})

const jsonFileName = computed(() => files.value.jsonFile?.name || '')
const atlasFileName = computed(() => files.value.atlasFile?.name || '')
const pngFileName = computed(() => {
  if (!files.value.pngFiles || files.value.pngFiles.length === 0) return ''
  if (files.value.pngFiles.length === 1) return files.value.pngFiles[0].name
  return `${files.value.pngFiles.length} images selected`
})

const handleFileChange = (event, type) => {
  const fileList = event.target.files
  if (!fileList || fileList.length === 0) return

  if (type === 'json') files.value.jsonFile = fileList[0]
  if (type === 'atlas') files.value.atlasFile = fileList[0]
  if (type === 'png') files.value.pngFiles = fileList
}

const loadAnimation = () => {
  if (!files.value.jsonFile || !files.value.atlasFile || !files.value.pngFiles?.length) {
    alert(t('uploader.missing_files'))
    return
  }
  const gameScene = phaserStore.gameInstance?.scene.getScene('GameScene')
  if (gameScene) {
    gameScene.loadAndDisplaySpine(files.value)
  }
}
</script>

<style lang="postcss" scoped>
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 15px;

  & > label {
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
