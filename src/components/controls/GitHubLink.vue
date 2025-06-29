<template>
  <div class="github-link">
    <label>{{ t('github.title') }}</label>
    <a :href="githubUrl" target="_blank" rel="noopener" class="control-button">
      {{ t('github.button') }}
    </a>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const githubUrl = 'https://github.com/y1chu/vue-spine-viewer'
</script>

<style lang="postcss" scoped>
.github-link {
  display: flex;
  flex-direction: column;
  gap: 15px;

  & > label {
    font-weight: 600;
    font-size: 1.1em;
    color: var(--color-white);
  }

  & > a {
    text-decoration: none;
  }
}
</style>
