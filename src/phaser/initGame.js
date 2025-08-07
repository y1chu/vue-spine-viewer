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

    // Ensure the global spine object is cleared so the newly loaded runtime
    // replaces the previous version completely. The property created by the
    // runtime isn't configurable, so we can't delete it; set it to undefined
    // instead so the next script can override it.
    if ('spine' in window) window.spine = undefined

    const script = document.createElement('script')
    script.src = url
    script.setAttribute('data-spine-phaser', 'true')
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

// Initialize the Phaser game or swap out the Spine runtime without a full reload.
export const initGame = async (runtimeVersion) => {
  // First run: create the game with the requested runtime.
  if (!phaserStore.gameInstance) {
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

  const game = phaserStore.gameInstance

  // Runtime already matches; nothing to do.
  if (phaserStore.runtimeVersion === runtimeVersion) return game

  // Swap to a different Spine runtime.
  await loadSpineRuntime(getRuntimeUrl(runtimeVersion))

  // Remove previous plugin and scene so the new runtime can be installed.
  phaserStore.cleanup()
  game.plugins.removeScenePlugin('spine')

  if (game.scene.getScene('GameScene')) {
    game.scene.stop('GameScene')
    game.scene.remove('GameScene')
  }

  // Install the new plugin and recreate the scene.
  game.plugins.installScenePlugin('spine', spine.SpinePlugin, 'spine')
  const newScene = game.scene.add('GameScene', GameScene, true)

  return await new Promise((resolve) => {
    newScene.events.once(Phaser.Scenes.Events.CREATE, () => {
      phaserStore.setRuntimeVersion(runtimeVersion)
      resolve(game)
    })
  })
}

export const detectSpineVersion = async (jsonFile) => {
  try {
    const text = await jsonFile.text()
    const data = JSON.parse(text)
    const ver = data?.skeleton?.spine || ''
    if (ver.startsWith('4.2')) return '4.2'
  } catch (e) {
    console.warn('Unable to detect Spine version, defaulting to 4.1', e)
  }
  return '4.1'
}

