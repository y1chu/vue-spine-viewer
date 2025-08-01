<template>
  <div class="version-selection">
    <label for="spineVersionSelect">{{ t('version.title') }}</label>
    <select id="spineVersionSelect" class="control-dropdown" v-model="selectedSpineUrl">
      <option
        value="https://unpkg.com/@esotericsoftware/spine-phaser@4.1.*/dist/iife/spine-phaser.js"
      >
        {{ t('version.spine41') }}
      </option>
      <option
        value="https://unpkg.com/@esotericsoftware/spine-phaser@4.2.*/dist/iife/spine-phaser.js"
      >
        {{ t('version.spine42') }}
      </option>
    </select>
    <button @click="reloadWithVersion" class="control-button">
      {{ t('version.reload') }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const params = new URLSearchParams(window.location.search)
const selectedSpineUrl = ref(
  params.get('spineVer') ||
    'https://unpkg.com/@esotericsoftware/spine-phaser@4.1.*/dist/iife/spine-phaser.js',
)

const reloadWithVersion = () => {
  window.location.href = `?spineVer=${encodeURIComponent(selectedSpineUrl.value)}`
}
</script>

<style lang="postcss" scoped>
.version-selection {
  display: flex;
  flex-direction: column;
  gap: 15px;

  & > label {
    font-weight: 600;
    font-size: 1.1em;
    color: var(--color-white);
  }
}
</style>
