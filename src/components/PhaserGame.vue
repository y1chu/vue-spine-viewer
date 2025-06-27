<template>
    <div id="game-container" class="game-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { phaserStore } from '../store/phaserStore.js';
import { GameScene } from '../phaser/GameScene.js';

let game;

// This function loads the Spine runtime dynamically
const loadSpineRuntime = (spineVersionUrl) => {
    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${spineVersionUrl}"]`);
        if (existingScript) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = spineVersionUrl;
        script.setAttribute('data-spine-phaser', 'true');
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const launchGame = async () => {
    // Get the selected Spine version from URL or default
    const params = new URLSearchParams(window.location.search);
    const spineVersionUrl = params.get('spineVer') || 'https://unpkg.com/@esotericsoftware/spine-phaser@4.2.*/dist/iife/spine-phaser.js';

    try {
        await loadSpineRuntime(spineVersionUrl);

        const gameConfig = {
            type: Phaser.WEBGL,
            parent: 'game-container',
            width: 1280,
            height: 720,
            backgroundColor: '#111318',
            scene: [GameScene],
            plugins: {
                scene: [{ key: 'spine', plugin: window.spine.SpinePlugin, mapping: 'spine' }]
            }
        };

        game = new Phaser.Game(gameConfig);
        phaserStore.setGameInstance(game);
    } catch (error) {
        console.error('Failed to load Spine Phaser runtime.', error);
    }
};

onMounted(() => {
    launchGame();
});

onUnmounted(() => {
    game?.destroy(true);
    phaserStore.setGameInstance(null);
});
</script>

<style scoped>
.game-container {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #111318;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    min-width: 0;
    overflow: hidden;
}

:deep(canvas) {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 16px;
}
</style>