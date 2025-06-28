<template>
    <div class="side-panel">
        <VersionSelector />
        <FileUploader />
        <MultiSkinSelector />
        <MultiTrackSelector />
        <PlaybackControls />
    </div>
</template>

<script setup>
import VersionSelector from './controls/VersionSelector.vue';
import FileUploader from './controls/FileUploader.vue';
import PlaybackControls from './controls/PlaybackControls.vue';
import MultiSkinSelector from './controls/MultiSkinSelector.vue';
import MultiTrackSelector from './controls/MultiTrackSelector.vue';
</script>

<style lang="postcss" scoped>
.side-panel {
    width: 340px;
    flex-shrink: 0;
    background-color: var(--color-section);
    border-radius: 16px;
    padding: 25px;
    display: flex;
    flex-direction: column;
    gap: 25px;
    box-shadow: 0 8px 30px var(--color-shadow);
    overflow-y: auto;

    /* Use :deep to style the root element of child components */
    & :deep(> div) {
        border-top: 1px solid var(--color-border);
        padding-top: 25px;
    }

    & :deep(> div:first-child) {
        border-top: none;
        padding-top: 0;
    }
}

@media (max-width: 1024px) {
    .side-panel {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
    }
}
</style>