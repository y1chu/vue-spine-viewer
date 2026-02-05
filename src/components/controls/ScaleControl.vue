<template>
  <div class="scale-control" v-if="phaserStore.isAnimationLoaded">
    <label for="scaleSlider" @click="resetScale" title="Click to reset">
      {{ t('scale.title') }} <span>{{ scaleFactor.toFixed(1) }}</span>
    </label>
    <input
      type="range"
      id="scaleSlider"
      class="control-slider"
      min="0.1"
      max="2.0"
      step="0.1"
      v-model.number="scaleFactor"
    />
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
  if (scene?.refreshLayout) {
    scene.refreshLayout()
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

  > label {
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary-light);
    }

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
</style>
