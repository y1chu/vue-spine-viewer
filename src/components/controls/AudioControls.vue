<template>
  <div class="audio-controls" v-if="phaserStore.hasAudio">
    <label class="row" for="volumeSlider">
      <span class="label">{{ t('playback.volume') }}</span>
      <span class="chip">{{ (volumePct).toFixed(0) }}%</span>
    </label>
    <input type="range" id="volumeSlider" min="0" max="100" step="1" :value="Math.round(volumePct)"
      @input="onSlide($event)" class="control-slider" />
  </div>
  <div class="audio-controls disabled" v-else>
    <label class="row" for="volumeSliderDisabled">
      <span class="label">{{ t('playback.volume') }}</span>
      <span class="chip">N/A</span>
    </label>
    <input type="range" id="volumeSliderDisabled" min="0" max="100" step="1" :value="Math.round(volumePct)" disabled
      class="control-slider" />
    <div class="hint">Upload audio files to enable</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'

const { t } = useI18n()
const volumePct = computed(() => (phaserStore.audioVolume ?? 0.5) * 100)

const onSlide = (evt) => {
  const pct = Number(evt?.target?.value ?? 100)
  const v = Math.max(0, Math.min(100, pct)) / 100
  phaserStore.setAudioVolume(v)
  const scene = phaserStore.gameInstance?.scene?.getScene?.('GameScene')
  scene?.setAudioVolume?.(v)
}
</script>

<style lang="postcss" scoped>
.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: var(--color-text);
  font-weight: 600;
}

.chip {
  font-weight: 700;
  color: var(--color-primary-light);
  background-color: var(--color-surface);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}

.slider {
  width: 100%;
}

.disabled {
  opacity: 0.6;
}

.hint {
  font-size: 0.8em;
  color: var(--color-text-muted);
}
</style>
