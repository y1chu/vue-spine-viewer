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
              v-for="anim in animationOptions"
              :key="anim.name"
              :value="anim.name"
            >
              {{ anim.name }} ({{ anim.duration.toFixed(2) }}s)
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="popup-button-container">
      <button @click="clearTracks" class="control-button clear-button">
        {{ t('modal.clear_all') }}
      </button>
      <button @click="$emit('close')" class="control-button">
        {{ t('modal.close') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
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

const getSpineObjects = () =>
  phaserStore.spineObjects?.length
    ? phaserStore.spineObjects
    : phaserStore.spineObject
      ? [phaserStore.spineObject]
      : []

const primaryObject = getSpineObjects()[0]
const tracks = primaryObject?.animationState?.tracks
for (let i = 0; i < maxTracks; i++) {
  trackSelections.value[i] = tracks?.[i]?.animation?.name || ''
}

const animationOptions = computed(() => {
  const animations = primaryObject?.skeleton?.data?.animations || []
  if ((phaserStore.spineObjects?.length || 0) <= 1) return animations
  const allowed = new Set(phaserStore.animations || [])
  return animations.filter((anim) => allowed.has(anim.name))
})

const applyTracks = () => {
  const objects = getSpineObjects()
  objects.forEach((obj) => {
    const { animationState } = obj
    for (let i = 0; i < maxTracks; i++) {
      const selectedAnimation = trackSelections.value[i]
      if (selectedAnimation) {
        if (obj.skeleton.data.findAnimation(selectedAnimation)) {
          animationState.setAnimation(i, selectedAnimation, true)
        }
      } else {
        animationState.setEmptyAnimation(i, 0.1)
      }
    }
  })
}

const clearTracks = () => {
  trackSelections.value = Array(maxTracks).fill('')
}

watch(trackSelections, applyTracks, { deep: true })
</script>

<style lang="postcss" scoped>
.popup-button-container {
  justify-content: center;
}

.track-controls-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.track-control-row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 15px;

  & label {
    flex-shrink: 0;
    font-size: 1em;
    font-weight: 500;
  }
}

.clear-button {
  background: var(--control-bg);

  &:hover {
    background: var(--control-bg-hover);
  }
}
</style>
