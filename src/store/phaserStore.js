import { reactive } from 'vue'

// A simple reactive object to act as our store
export const phaserStore = reactive({
  // Phaser and Spine instances
  gameInstance: null,
  spineObject: null,

  // Animation data
  skins: [],
  animations: [],

  // UI state
  isAnimationLoaded: false,

  // Methods to update the state (actions)
  setGameInstance(game) {
    this.gameInstance = game
  },

  setSpineObject(spineObj) {
    this.spineObject = spineObj
    this.isAnimationLoaded = !!spineObj
  },

  setSkins(skinNames) {
    this.skins = skinNames
  },

  setAnimations(animationNames) {
    this.animations = animationNames
  },

  cleanup() {
    this.spineObject?.destroy()
    this.spineObject = null
    this.isAnimationLoaded = false
    this.skins = []
    this.animations = []
  },
})
