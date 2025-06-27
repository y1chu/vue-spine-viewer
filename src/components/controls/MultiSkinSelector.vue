<template>
    <div class="control-group">
        <label>Multi-Skin Selection</label>
        <button id="multiSkinButton" class="control-button" :disabled="!phaserStore.isAnimationLoaded"
            @click="showModal = true">
            Open Skin Selector
        </button>
        <MultiSkinModal v-if="showModal" @close="showModal = false" />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';
import MultiSkinModal from '../modals/MultiSkinModal.vue';

const showModal = ref(false);
</script>