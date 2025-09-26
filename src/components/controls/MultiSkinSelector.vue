<template>
  <div class="control-group">
    <label>{{ t('multiskin.title') }}</label>
    <button
      id="multiSkinButton"
      class="control-button"
      :disabled="!phaserStore.isAnimationLoaded"
      @click="showModal = true"
    >
      {{ t('multiskin.open') }}
    </button>

    <Teleport to="body">
      <MultiSkinModal v-if="showModal" @close="showModal = false" />
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'
import MultiSkinModal from '../modals/MultiSkinModal.vue'

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
