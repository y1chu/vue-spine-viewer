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