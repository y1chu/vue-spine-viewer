<template>
  <div class="multi-track-popup" ref="popupRef">
    <h3 ref="handleRef">{{ t('multitrack.header') }}</h3>

    <div class="popup-content">
      <div class="track-controls-container">
        <div v-for="i in maxTracks" :key="i" class="track-control-row">
          <label>{{ t('multitrack.track_label', { n: i - 1 }) }}</label>
          <select class="control-dropdown track-animation-select" v-model="trackSelections[i - 1]">
            <option value="">{{ t('multitrack.none') }}</option>
            <option
              v-for="anim in phaserStore.spineObject?.skeleton.data.animations"
              :key="anim.name"
              :value="anim.name"
            >
              {{ anim.name }} ({{ anim.duration.toFixed(2) }} s)
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="popup-button-container">
      <button @click="$emit('close')" class="control-button close-button">
        {{ t('modal.close') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'
import { useDraggable } from '@/composables/useDraggable.js'
defineEmits(['close'])

const { t } = useI18n()

const popupRef = ref(null)
const handleRef = ref(null)
useDraggable(popupRef, handleRef, 'multi-track-modal')

const maxTracks = 5
const trackSelections = ref([])

// Initialize selections with current state
const tracks = phaserStore.spineObject?.animationState.tracks
for (let i = 0; i < maxTracks; i++) {
  trackSelections.value[i] = tracks?.[i]?.animation?.name || ''
}

const applyTracks = () => {
  const { animationState } = phaserStore.spineObject
  for (let i = 0; i < maxTracks; i++) {
    const selectedAnimation = trackSelections.value[i]
    if (selectedAnimation) {
      animationState.setAnimation(i, selectedAnimation, true)
    } else {
      animationState.setEmptyAnimation(i, 0.1)
    }
  }
  phaserStore.spineObject.scene.fitAndCenterSpineObject(phaserStore.spineObject)
}

watch(trackSelections, applyTracks, { deep: true })
</script>

<style lang="postcss" scoped>
/* Base popup styles are in main.css. These are specific to the track modal. */
.track-controls-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.track-control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;

  & label {
    flex-shrink: 0;
    font-size: 1em;
    font-weight: 500;
  }
}

.track-animation-select {
  flex-grow: 1;
  max-width: 220px;
}
</style>
