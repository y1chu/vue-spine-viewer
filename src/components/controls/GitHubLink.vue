<template>
  <div class="github-link-container">
    <a :href="githubUrl" target="_blank" rel="noopener" class="github-button">
      <span class="icon"></span>
      <span>{{ t('github.button') }}</span>
    </a>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const githubUrl = 'https://github.com/y1chu/vue-spine-viewer'
</script>

<style lang="postcss" scoped>
.github-link-container {
  margin-top: auto;

  padding-top: 25px;
  border-top: 1px solid var(--color-border);
}

.github-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-muted);
  background-color: transparent;
  border: 1px solid var(--color-border);
  font-weight: 500;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background-color: var(--color-surface);
  }

  .icon {
    font-size: 1.2rem;
  }
}
</style>
