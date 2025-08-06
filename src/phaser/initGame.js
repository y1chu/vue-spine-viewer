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

    const script = document.createElement('script')
    script.src = url
    script.setAttribute('data-spine-phaser', 'true')
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

export const initGame = async (runtimeUrl) => {
  if (phaserStore.gameInstance) {
    phaserStore.gameInstance.destroy(true)
    phaserStore.setGameInstance(null)
  }

  phaserStore.cleanup()

  await loadSpineRuntime(runtimeUrl)

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
  phaserStore.setGameInstance(game)
  return game
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

