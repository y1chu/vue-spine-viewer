<template>
  <details class="control-section" open>
    <summary class="section-title">{{ title }}</summary>
    <div class="section-content">
      <slot></slot>
    </div>
  </details>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<style lang="postcss" scoped>
.control-section {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 25px;

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.section-title {
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 20px;
  cursor: pointer;
  list-style: none;

  display: flex;
  align-items: center;
  transition: color 0.2s;

  &::-webkit-details-marker {
    display: none;
  }

  &::before {
    content: '▼';
    font-size: 0.7em;
    margin-right: 10px;
    transition: transform 0.2s ease-in-out;
    color: var(--color-primary);
  }

  details:not([open]) > &::before {
    transform: rotate(-90deg);
  }

  &:hover {
    color: var(--color-primary-light);
  }
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>
