import { phaserStore } from '../store/phaserStore.js'
import { GameScene } from './GameScene.js'

const RUNTIME_URLS = {
  '4.1':
    'https://unpkg.com/@esotericsoftware/spine-phaser@4.1.*/dist/iife/spine-phaser.js',
  '4.2':
    'https://unpkg.com/@esotericsoftware/spine-phaser@4.2.*/dist/iife/spine-phaser.js',
}

export const getRuntimeUrl = (version) => RUNTIME_URLS[version] || RUNTIME_URLS['4.1']

const loadSpineRuntime = (url) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-spine-phaser]')
    if (existing) {
      if (existing.src === url) {
        resolve()
        return
      }
      existing.remove()
    }

    // Ensure any previously loaded runtime is fully cleared so a new script
    // can provide its own plugin and global references. The properties created
    // by the runtime aren't configurable, so set them to undefined instead of
    // deleting them.
    if ('SpinePlugin' in window) window.SpinePlugin = undefined
    if ('spine' in window) window.spine = undefined

    const script = document.createElement('script')
    script.src = url
    script.setAttribute('data-spine-phaser', 'true')
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

// Initialize the Phaser game. If a game already exists and the runtime matches
// the requested version, the existing instance is returned. Otherwise the
// previous game is destroyed and a new one is created using the required
// Spine runtime.
export const initGame = async (runtimeVersion) => {
  if (phaserStore.gameInstance && phaserStore.runtimeVersion === runtimeVersion)
    return phaserStore.gameInstance

  // Destroy any existing game before swapping runtimes.
  if (phaserStore.gameInstance) {
    phaserStore.gameInstance.destroy(true)
    phaserStore.setGameInstance(null)
    phaserStore.cleanup()
  }

  await loadSpineRuntime(getRuntimeUrl(runtimeVersion))

  return await new Promise((resolve) => {
    const config = {
      renderType: Phaser.WEBGL,
      parent: 'game-container',
      width: 1280,
      height: 720,
      backgroundColor: '#111318',
      scene: [GameScene],
      plugins: {
        scene: [{ key: 'spine', plugin: spine.SpinePlugin, mapping: 'spine' }],
      },
    }

    const game = new Phaser.Game(config)
    game.events.once(Phaser.Core.Events.READY, () => {
      phaserStore.setGameInstance(game)
      phaserStore.setRuntimeVersion(runtimeVersion)
      resolve(game)
    })
  })
}

// Parse a Spine JSON file and return both the skeleton version string reported
// within the file and the major runtime version to load (4.1 vs 4.2).
export const detectSpineVersion = async (jsonFile) => {
  try {
    const text = await jsonFile.text()
    const data = JSON.parse(text)
    const skeletonVer = data?.skeleton?.spine || null
    const runtimeVer = skeletonVer?.startsWith('4.2') ? '4.2' : '4.1'
    return { skeletonVer, runtimeVer }
  } catch (e) {
    console.warn('Unable to detect Spine version, defaulting to 4.1', e)
    return { skeletonVer: null, runtimeVer: '4.1' }
  }
}

