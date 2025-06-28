<template>
  <div class="language-selection">
    <label for="languageSelect">{{ t('language.title') }}</label>
    <select
      id="languageSelect"
      class="control-dropdown"
      v-model="selectedLocale"
      @change="changeLanguage"
    >
      <option value="en-us">{{ t('language.en') }}</option>
      <option value="zh-tw">{{ t('language.zh') }}</option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()
const selectedLocale = ref(locale.value)

const changeLanguage = () => {
  locale.value = selectedLocale.value
  const params = new URLSearchParams(window.location.search)
  params.set('lang', selectedLocale.value)
  const newUrl = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState({}, '', newUrl)
}
</script>

<style lang="postcss" scoped>
.language-selection {
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
