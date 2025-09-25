<template>
  <div class="scale-control" v-if="phaserStore.isAnimationLoaded">
    <label for="scaleSlider">
      {{ t('scale.title') }} <span id="scaleValue">{{ scaleFactor.toFixed(1) }}</span>
    </label>
    <input type="range" id="scaleSlider" class="control-slider" min="0.1" max="1.5" step="0.1"
      v-model.number="scaleFactor" />
    <button @click="resetScale" class="control-button">{{ t('scale.reset') }}</button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'

const { t } = useI18n()

const scaleFactor = ref(phaserStore.scaleFactor)

watch(scaleFactor, (newVal) => {
  phaserStore.setScaleFactor(newVal)
  const scene = phaserStore.gameInstance?.scene.getScene('GameScene')
  if (scene && phaserStore.spineObject) {
    scene.fitAndCenterSpineObject(phaserStore.spineObject)
  }
})

const resetScale = () => {
  scaleFactor.value = 0.9
}
</script>

<style lang="postcss" scoped>
.scale-control {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &>label {
    font-weight: 600;
    font-size: 1.1em;
    color: var(--color-white);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.control-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  background: var(--color-gray);
  border-radius: 5px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: var(--color-red-light);
    border-radius: 50%;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: var(--color-red-light);
    border-radius: 50%;
    border: none;
  }
}

#scaleValue {
  font-weight: 600;
  color: var(--color-red-light);
  background-color: var(--color-section);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.9em;
}
</style>
