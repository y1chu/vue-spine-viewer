<template>
  <div class="control-panel">
    <ControlSection :title="t('sections.animation')">
      <FileUploader />
    </ControlSection>

    <ControlSection :title="t('sections.customization')">
      <MultiSkinSelector />
      <MultiTrackSelector />
      <BackgroundControls />
    </ControlSection>

    <ControlSection :title="t('sections.playback')">
      <ScaleControl />
      <PlaybackControls />
      <AudioControls />
    </ControlSection>

    <ControlSection :title="t('sections.settings')">
      <LanguageSelector />
    </ControlSection>

    <GitHubLink />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ControlSection from './controls/ControlSection.vue'
import FileUploader from './controls/FileUploader.vue'
import BackgroundControls from './controls/BackgroundControls.vue'
import PlaybackControls from './controls/PlaybackControls.vue'
import AudioControls from './controls/AudioControls.vue'
import MultiSkinSelector from './controls/MultiSkinSelector.vue'
import MultiTrackSelector from './controls/MultiTrackSelector.vue'
import ScaleControl from './controls/ScaleControl.vue'
import LanguageSelector from './controls/LanguageSelector.vue'
import GitHubLink from './controls/GitHubLink.vue'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.control-panel {
  width: 360px;
  flex-shrink: 0;
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  box-shadow: 0 8px 30px var(--color-shadow);
  overflow-y: auto;

  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 1024px) {
  .control-panel {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
}
</style>
