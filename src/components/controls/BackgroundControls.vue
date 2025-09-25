<template>
  <div class="background-controls">
    <div class="control-row">
      <label for="bgColorPicker">{{ t('background.color') }}</label>
      <input
        type="color"
        id="bgColorPicker"
        v-model="backgroundColor"
        @input="updateBackgroundColor"
      />
    </div>

    <label for="bg-image-upload" class="control-button file-button">
      <span>{{ backgroundImageName || t('background.upload_image') }}</span>
    </label>
    <input
      id="bg-image-upload"
      type="file"
      accept="image/png, image/jpeg"
      @change="handleBackgroundImageChange"
      style="display: none"
    />

    <button
      v-if="backgroundImageName"
      @click="clearBackgroundImage"
      class="control-button clear-button"
    >
      {{ t('background.clear_image') }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'

const { t } = useI18n()

const defaultColor = '#111318'
const backgroundColor = ref(defaultColor)
const backgroundImageName = ref('')

const getGameScene = () => phaserStore.gameInstance?.scene.getScene('GameScene')

const updateBackgroundColor = (event) => {
  const scene = getGameScene()
  if (scene) scene.setBackgroundColor(event.target.value)
}

const handleBackgroundImageChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  backgroundImageName.value = file.name
  const scene = getGameScene()
  if (scene) scene.setBackgroundImage(file)
}

const clearBackgroundImage = () => {
  backgroundImageName.value = ''
  const scene = getGameScene()
  if (scene) scene.clearBackgroundImage()
  backgroundColor.value = defaultColor
  updateBackgroundColor({ target: { value: defaultColor } })
}
</script>

<style lang="postcss" scoped>
.background-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  padding: 5px 5px 5px 15px;
  border-radius: var(--radius-md);

  > label {
    font-weight: 500;
  }

  > input[type='color'] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 32px;
    height: 32px;
    border: none;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
    border-radius: var(--radius-sm);
    overflow: hidden;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: var(--radius-sm);
    }

    &::-moz-color-swatch {
      border: none;
      border-radius: var(--radius-sm);
    }
  }
}

.file-button {
  background: var(--control-bg);
  text-align: center;
  font-weight: 500;

  &:hover {
    background: var(--control-bg-hover);
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: inline-block;
  }
}

.clear-button {
  background: var(--control-bg);
  opacity: 0.8;
  font-weight: 500;

  &:hover {
    background: var(--color-error);
    opacity: 1;
  }
}
</style>
