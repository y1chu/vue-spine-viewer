<template>
  <div id="game-container" class="game-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { phaserStore } from '../store/phaserStore.js'
import { GameScene } from '../phaser/GameScene.js'

let game = null

const loadSpineRuntime = (spineVersionUrl) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${spineVersionUrl}"]`)
    if (existing) return resolve()
    const script = document.createElement('script')
    script.src = spineVersionUrl
    script.setAttribute('data-spine-phaser', 'true')
    script.onload = resolve
    script.onerror = () => reject(new Error(`Failed to load runtime script: ${spineVersionUrl}`))
    document.head.appendChild(script)
  })

const removeExistingSpineScripts = () => {
  const added = Array.from(document.querySelectorAll('script[data-spine-phaser="true"]'))
  const anySpine = Array.from(document.querySelectorAll('script[src*="@esotericsoftware/spine-phaser"]'))
    ;[...new Set([...added, ...anySpine])].forEach((s) => s.parentElement?.removeChild(s))
  try {
    if (window && window.spine) delete window.spine
  } catch { }
}

const buildUnpkgUrlFromVersion = (ver) => {
  if (!ver) return null
  const raw = String(ver).trim()
  const m = raw.match(/^(\d+)\.(\d+)(?:\.(\d+))?/)
  if (!m) return null
  const major = m[1]
  const minor = m[2]
  const captured = m[0]
  const versionForCdn = major === '4' && minor === '1' ? `${major}.${minor}.*` : captured
  return `https://unpkg.com/@esotericsoftware/spine-phaser@${versionForCdn}/dist/iife/spine-phaser.js`
}

const launchGameWithUrl = async (spineVersionUrl) => {
  try {
    removeExistingSpineScripts()
    await loadSpineRuntime(spineVersionUrl)
    const gameConfig = {
      renderType: Phaser.WEBGL,
      parent: 'game-container',
      width: 1280,
      height: 720,
      backgroundColor: '#111318',
      scene: [GameScene],
      plugins: { scene: [{ key: 'spine', plugin: spine.SpinePlugin, mapping: 'spine' }] },
    }
    game = new Phaser.Game(gameConfig)
    phaserStore.setGameInstance(game)
  } catch (error) {
    console.error('Failed to load Spine Phaser runtime.', error)
    alert(`Could not load Spine Phaser runtime.\n${error?.message || error}`)
  }
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const qp = params.get('spineVer')
  let initialUrl = null
  if (qp) initialUrl = /^https?:\/\//i.test(qp) ? qp : buildUnpkgUrlFromVersion(qp)
  if (initialUrl && initialUrl !== phaserStore.spineRuntimeUrl) {
    phaserStore.setSpineRuntimeUrl(initialUrl)
    launchGameWithUrl(initialUrl)
  }
  watch(
    () => phaserStore.spineRuntimeUrl,
    (newUrl, oldUrl) => {
      if (!newUrl || newUrl === oldUrl) return
      game?.destroy(true)
      phaserStore.setGameInstance(null)
      phaserStore.cleanup()
      launchGameWithUrl(newUrl)
    }
  )
})

onUnmounted(() => {
  game?.destroy(true)
  phaserStore.setGameInstance(null)
})
</script>

<style lang="postcss" scoped>
.game-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #111318;
  border-radius: 16px;
  box-shadow: 0 8px 30px var(--color-shadow);
  min-width: 0;
  overflow: hidden;

  :deep(canvas) {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 16px;
  }
}

@media (max-width: 1024px) {
  .game-container {
    width: 100%;
    min-height: 50vh;
  }
}
</style>