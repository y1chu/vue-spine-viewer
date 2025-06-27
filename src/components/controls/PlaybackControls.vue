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
                v-model="timescale" @input="applyTimeScale" />
            <button @click="resetTimescale" class="control-button">Reset Speed</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { phaserStore } from '@/store/phaserStore.js';

const timescale = ref(1.0);
let lastKnownTimeScale = 1.0;

const applyTimeScale = (event) => {
    const newScale = parseFloat(event.target.value);
    if (phaserStore.spineObject) {
        phaserStore.spineObject.animationState.timeScale = newScale;
    }
    timescale.value = newScale;
    if (newScale > 0) {
        lastKnownTimeScale = newScale;
    }
};

const pause = () => {
    if (phaserStore.spineObject) {
        lastKnownTimeScale = phaserStore.spineObject.animationState.timeScale;
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
    lastKnownTimeScale = 1.0;
    if (phaserStore.spineObject) {
        phaserStore.spineObject.animationState.timeScale = 1.0;
        timescale.value = 1.0;
    }
}
</script>