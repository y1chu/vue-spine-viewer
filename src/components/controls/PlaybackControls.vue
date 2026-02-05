<template>
  <div class="controls" v-if="phaserStore.isAnimationLoaded">
    <div class="timescale-control">
      <label for="timescaleSlider">
        {{ t('playback.timescale') }}
        <span>{{ timescale.toFixed(1) }}x</span>
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
    </div>
    <div class="button-group">
      <button @click="play" class="control-button">▶</button>
      <button @click="pause" class="control-button">❚❚</button>
      <button @click="resetTimescale" class="control-button reset-button">⟲</button>
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
const getSpineObjects = () =>
  phaserStore.spineObjects?.length
    ? phaserStore.spineObjects
    : phaserStore.spineObject
      ? [phaserStore.spineObject]
      : []

watch(timescale, (newScale) => {
  getSpineObjects().forEach((obj) => {
    obj.animationState.timeScale = newScale
  })
  if (newScale > 0) {
    lastKnownTimeScale = newScale
  }
})

const pause = () => {
  const objects = getSpineObjects()
  if (!objects.length) return
  const currentScale = objects[0].animationState.timeScale
  if (currentScale > 0) {
    lastKnownTimeScale = currentScale
  }
  objects.forEach((obj) => {
    obj.animationState.timeScale = 0
  })
  timescale.value = 0
}

const play = () => {
  const objects = getSpineObjects()
  if (!objects.length) return
  objects.forEach((obj) => {
    obj.animationState.timeScale = lastKnownTimeScale
  })
  timescale.value = lastKnownTimeScale
}

const resetTimescale = () => {
  timescale.value = 1.0
}
</script>

<style lang="postcss" scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timescale-control {
  display: flex;
  flex-direction: column;
  gap: 10px;

  > label {
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
      font-weight: 700;
      color: var(--color-primary-light);
      background-color: var(--color-surface);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.9em;
    }
  }
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group > .control-button {
  flex: 1;
}

.reset-button {
  background: var(--control-bg);

  &:hover {
    background: var(--control-bg-hover);
  }
}
</style>
