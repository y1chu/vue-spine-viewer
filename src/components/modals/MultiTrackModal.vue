<template>
    <div class="multi-track-popup">
        <h3>Multi-Track Animation</h3>
        <div class="track-controls-container">
            <div v-for="i in maxTracks" :key="i" class="track-control-row">
                <label>Track {{ i - 1 }}:</label>
                <select class="control-dropdown track-animation-select" v-model="trackSelections[i - 1]">
                    <option value="">None</option>
                    <option v-for="anim in phaserStore.animations" :key="anim" :value="anim">{{ anim }}</option>
                </select>
            </div>
        </div>
        <div class="popup-button-container">
            <button @click="applyTracks" class="control-button apply-button">Apply</button>
            <button @click="$emit('close')" class="control-button close-button">Close</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';
const emit = defineEmits(['close']);

const maxTracks = 5;
const trackSelections = ref([]);

// Initialize selections with current state
const tracks = phaserStore.spineObject?.animationState.tracks;
for (let i = 0; i < maxTracks; i++) {
    trackSelections.value[i] = tracks?.[i]?.animation?.name || '';
}

const applyTracks = () => {
    const { animationState } = phaserStore.spineObject;
    for (let i = 0; i < maxTracks; i++) {
        const selectedAnimation = trackSelections.value[i];
        if (selectedAnimation) {
            animationState.setAnimation(i, selectedAnimation, true);
        } else {
            animationState.setEmptyAnimation(i, 0.1);
        }
    }
    emit('close');
}
</script>

<style lang="postcss" scoped>
/* Base popup styles are in main.css. These are specific to the track modal. */
.track-controls-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.track-control-row {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;

    & label {
        flex-shrink: 0;
        font-size: 1em;
        font-weight: 500;
    }
}

.track-animation-select {
    flex-grow: 1;
    min-width: 150px;
}
</style>