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
          <label :for="`skin-checkbox-${skinName}`">
            <span class="custom-checkbox"></span>
            {{ skinName }}
          </label>
        </div>
      </div>
    </div>

    <div class="popup-button-container">
      <button @click="clearSkins" class="control-button clear-button">
        {{ t('modal.clear_all') }}
      </button>
      <button @click="$emit('close')" class="control-button">
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

const getSpineObjects = () =>
  phaserStore.spineObjects?.length
    ? phaserStore.spineObjects
    : phaserStore.spineObject
      ? [phaserStore.spineObject]
      : []

const primaryObject = getSpineObjects()[0]
const currentSkin = primaryObject?.skeleton?.skin
const initialSkins =
  currentSkin?.componentSkinNames ||
  (currentSkin && currentSkin.name !== 'default' ? [currentSkin.name] : [])
const selectedSkins = ref(initialSkins)

const applySkins = () => {
  const objects = getSpineObjects()
  objects.forEach((obj) => {
    const { skeleton } = obj
    if (selectedSkins.value.length === 0) {
      skeleton.setSkin(null)
    } else if (selectedSkins.value.length === 1) {
      skeleton.setSkinByName(selectedSkins.value[0])
    } else {
      const newSkin = new spine.Skin('composite-skin')
      newSkin.componentSkinNames = selectedSkins.value
      selectedSkins.value.forEach((skinName) => {
        const skinToAdd = skeleton.data.findSkin(skinName)
        if (skinToAdd) newSkin.addSkin(skinToAdd)
      })
      skeleton.setSkin(newSkin)
    }
    skeleton.setSlotsToSetupPose()
  })
}

const clearSkins = () => {
  selectedSkins.value = []
}

watch(selectedSkins, applySkins, { deep: true })
</script>

<style lang="postcss" scoped>
.popup-button-container {
  justify-content: center;
}

.skin-list {
  padding: 10px;
  margin: 0;
  max-height: 40vh;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.skin-list-item {
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;

  & label {
    display: flex;
    align-items: center;
    padding: 12px 8px;
    font-weight: 500;
    cursor: pointer;
    width: 100%;
    font-size: 1em;
    border-radius: var(--radius-sm);

    &:hover {
      background-color: var(--color-surface-light);
    }
  }

  & input[type='checkbox'] {
    display: none;
  }

  .custom-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-right: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  & input[type='checkbox']:checked + label .custom-checkbox {
    background-color: var(--color-primary);
    border-color: var(--color-primary);

    &::after {
      content: '✔';
      color: white;
      font-size: 14px;
    }
  }
}

.clear-button {
  background: var(--control-bg);

  &:hover {
    background: var(--control-bg-hover);
  }
}
</style>
