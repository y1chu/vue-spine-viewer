<template>
    <div class="version-selection">
        <label for="spineVersionSelect">Spine Runtime Version</label>
        <select id="spineVersionSelect" class="control-dropdown" v-model="selectedSpineUrl">
            <option value="https://unpkg.com/@esotericsoftware/spine-phaser@4.1.*/dist/iife/spine-phaser.js">
                Spine 4.1
            </option>
            <option value="https://unpkg.com/@esotericsoftware/spine-phaser@4.2.*/dist/iife/spine-phaser.js">
                Spine 4.2
            </option>
        </select>
        <button @click="reloadWithVersion" class="control-button">
            Reload with Version
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';
const params = new URLSearchParams(window.location.search);
const selectedSpineUrl = ref(params.get('spineVer') || 'https://unpkg.com/@esotericsoftware/spine-phaser@4.2.*/dist/iife/spine-phaser.js');

const reloadWithVersion = () => {
    window.location.href = `?spineVer=${encodeURIComponent(selectedSpineUrl.value)}`;
};
</script>