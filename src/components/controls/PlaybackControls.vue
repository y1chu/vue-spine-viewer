<template>
  <div class="controls" v-if="phaserStore.isAnimationLoaded">
    <label>{{ t('playback.title') }}</label>
    <button @click="pause" class="control-button">{{ t('playback.pause') }}</button>
    <button @click="play" class="control-button">{{ t('playback.play') }}</button>
    <div class="timescale-control">
      <label for="timescaleSlider">
        {{ t('playback.timescale') }} <span id="timescaleValue">{{ timescale.toFixed(1) }}x</span>
      </label>
      <input
        type="range"
        id="timescaleSlider"
        class="control-slider"
        min="0"
        max="2"
        step="0.1"
        v-model.number="timescale"
      />
      <button @click="resetTimescale" class="control-button">{{ t('playback.reset') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'

const { t } = useI18n()

const timescale = ref(1.0)
let lastKnownTimeScale = 1.0

watch(timescale, (newScale) => {
  if (phaserStore.spineObject) {
    phaserStore.spineObject.animationState.timeScale = newScale
  }
  if (newScale > 0) {
    lastKnownTimeScale = newScale
  }
})

const pause = () => {
  if (phaserStore.spineObject) {
    const currentScale = phaserStore.spineObject.animationState.timeScale
    if (currentScale > 0) {
      lastKnownTimeScale = currentScale
    }
    phaserStore.spineObject.animationState.timeScale = 0
    timescale.value = 0
  }
}

const play = () => {
  if (phaserStore.spineObject) {
    phaserStore.spineObject.animationState.timeScale = lastKnownTimeScale
    timescale.value = lastKnownTimeScale
  }
}

const resetTimescale = () => {
  timescale.value = 1.0
}
</script>

<style lang="postcss" scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 15px;

  & > label {
    font-weight: 600;
    font-size: 1.1em;
    color: var(--color-white);
  }
}

.timescale-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;

  & > label {
    font-size: 1em;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

#timescaleValue {
  font-weight: 600;
  color: var(--color-red-light);
  background-color: var(--color-section);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.9em;
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
</style>
