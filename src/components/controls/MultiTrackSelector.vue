<template>
  <div class="control-group">
    <label>{{ t('multitrack.title') }}</label>
    <button
      id="multiTrackButton"
      class="control-button"
      :disabled="!phaserStore.isAnimationLoaded"
      @click="showModal = true"
    >
      {{ t('multitrack.open') }}
    </button>

    <Teleport to="body">
      <MultiTrackModal v-if="showModal" @close="showModal = false" />
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'
import MultiTrackModal from '../modals/MultiTrackModal.vue'

const { t } = useI18n()

const showModal = ref(false)
</script>

<style lang="postcss" scoped>
.control-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>
