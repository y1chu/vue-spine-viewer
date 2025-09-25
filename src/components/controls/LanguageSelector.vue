<template>
  <div class="language-selector">
    <button
      @click="selectLang('en-us')"
      class="lang-button"
      :class="{ active: selectedLocale === 'en-us' }"
    >
      ENG
    </button>
    <button
      @click="selectLang('zh-tw')"
      class="lang-button"
      :class="{ active: selectedLocale === 'zh-tw' }"
    >
      ZH
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const selectedLocale = ref(locale.value)

const selectLang = (lang) => {
  selectedLocale.value = lang
  locale.value = lang
  const params = new URLSearchParams(window.location.search)
  params.set('lang', lang)
  const newUrl = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState({}, '', newUrl)
}
</script>

<style lang="postcss" scoped>
.language-selector {
  display: flex;
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 4px;
  border: 1px solid var(--color-border);
}

.lang-button {
  flex: 1;

  padding: 8px 12px;
  border: none;
  background-color: transparent;
  color: var(--color-text-muted);
  font-family: var(--font-main);
  font-weight: 600;
  font-size: 0.9em;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover:not(.active) {
    color: var(--color-text);
  }

  &.active {
    background-color: var(--color-primary);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
</style>
