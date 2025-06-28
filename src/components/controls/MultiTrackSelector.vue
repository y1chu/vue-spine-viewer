<template>
    <div class="control-group">
        <label>Multi-Track Animation</label>
        <button id="multiTrackButton" class="control-button" :disabled="!phaserStore.isAnimationLoaded"
            @click="showModal = true">
            Open Track Selector
        </button>
        <MultiTrackModal v-if="showModal" @close="showModal = false" />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';
import MultiTrackModal from '../modals/MultiTrackModal.vue';

const showModal = ref(false);
</script>

<style lang="postcss" scoped>
.control-group {
    display: flex;
    flex-direction: column;
    gap: 15px;

    &>label {
        font-weight: 600;
        font-size: 1.1em;
        color: var(--color-white);
    }
}
</style>