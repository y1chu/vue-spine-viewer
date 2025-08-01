<template>
  <div class="multi-skin-popup" ref="popupRef">
    <h3 ref="handleRef">{{ t('modal.select_skins') }}</h3>

    <div class="popup-content">
      <div class="skin-list">
        <div v-for="skinName in phaserStore.skins" :key="skinName" class="skin-list-item">
          <input
            type="checkbox"
            :id="`skin-checkbox-${skinName}`"
            :value="skinName"
            v-model="selectedSkins"
          />
          <label :for="`skin-checkbox-${skinName}`">{{ skinName }}</label>
        </div>
      </div>
    </div>

    <div class="popup-button-container">
      <button @click="clearSkins" class="control-button clear-button">
        {{ t('modal.clear_all') }}
      </button>
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
const { t } = useI18n()
defineEmits(['close'])

const popupRef = ref(null)
const handleRef = ref(null)
useDraggable(popupRef, handleRef, 'multi-skin-modal')

// Pre-select currently active skins
const currentSkin = phaserStore.spineObject?.skeleton.skin
const initialSkins =
  currentSkin?.componentSkinNames ||
  (currentSkin && currentSkin.name !== 'default' ? [currentSkin.name] : [])
const selectedSkins = ref(initialSkins)

const applySkins = () => {
  const { skeleton } = phaserStore.spineObject
  if (selectedSkins.value.length === 0) {
    skeleton.setSkin(null)
  } else if (selectedSkins.value.length === 1) {
    skeleton.setSkinByName(selectedSkins.value[0])
  } else {
    const newSkin = new spine.Skin('composite-skin')
    newSkin.componentSkinNames = selectedSkins.value // Store for state restoration
    selectedSkins.value.forEach((skinName) => {
      const skinToAdd = skeleton.data.findSkin(skinName)
      if (skinToAdd) newSkin.addSkin(skinToAdd)
    })
    skeleton.setSkin(newSkin)
  }
  skeleton.setSlotsToSetupPose()
  phaserStore.spineObject.scene.fitAndCenterSpineObject(phaserStore.spineObject)
}

const clearSkins = () => {
  selectedSkins.value = []
}

watch(selectedSkins, applySkins, { deep: true })
</script>

<style lang="postcss" scoped>
/* Base popup styles are in main.css. These are specific to the skin modal. */
.skin-list {
  list-style: none;
  padding: 10px;
  margin: 0;
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-bg);
}

.skin-list-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-section);
  }

  & label {
    margin-left: 10px;
    font-weight: 400;
    cursor: pointer;
    width: 100%;
    font-size: 1em;
  }

  & input[type='checkbox'] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
}
</style>
