<template>
    <div class="controls" v-if="phaserStore.isAnimationLoaded">
        <label>Playback Controls</label>
        <button @click="pause" class="control-button">Pause</button>
        <button @click="play" class="control-button">Continue</button>
        <div class="timescale-control">
            <label for="timescaleSlider">
                Timescale <span id="timescaleValue">{{ timescale.toFixed(1) }}x</span>
            </label>
            <input type="range" id="timescaleSlider" class="control-slider" min="0" max="2" step="0.1"
                v-model.number="timescale" />
            <button @click="resetTimescale" class="control-button">Reset Speed</button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';

const timescale = ref(1.0);
let lastKnownTimeScale = 1.0;

// Watch for changes in the timescale ref and apply them to the Phaser object.
// This is a more declarative approach than using an @input handler.
watch(timescale, (newScale) => {
    if (phaserStore.spineObject) {
        phaserStore.spineObject.animationState.timeScale = newScale;
    }
    // Keep track of the last speed that was > 0
    if (newScale > 0) {
        lastKnownTimeScale = newScale;
    }
});

const pause = () => {
    if (phaserStore.spineObject) {
        // Only update lastKnownTimeScale if we are actually pausing a moving animation
        const currentScale = phaserStore.spineObject.animationState.timeScale;
        if (currentScale > 0) {
            lastKnownTimeScale = currentScale;
        }
        phaserStore.spineObject.animationState.timeScale = 0;
        timescale.value = 0;
    }
};

const play = () => {
    if (phaserStore.spineObject) {
        phaserStore.spineObject.animationState.timeScale = lastKnownTimeScale;
        timescale.value = lastKnownTimeScale;
    }
};

const resetTimescale = () => {
    // Simply set the timescale ref. The watcher will handle the rest.
    timescale.value = 1.0;
}
</script>

<style lang="postcss" scoped>
.controls {
    display: flex;
    flex-direction: column;
    gap: 15px;

    &>label {
        font-weight: 600;
        font-size: 1.1em;
        color: #f8f8f2;
    }
}

.timescale-control {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;

    &>label {
        font-size: 1em;
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
}

#timescaleValue {
    font-weight: 600;
    color: #bd93f9;
    background-color: #44475a;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.9em;
}

.control-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    background: #44475a;
    border-radius: 5px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: #bd93f9;
        border-radius: 50%;
    }

    &::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #bd93f9;
        border-radius: 50%;
        border: none;
    }
}
</style>