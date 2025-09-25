import { reactive } from 'vue'

export const phaserStore = reactive({
  gameInstance: null,
  spineObject: null,
  skins: [],
  animations: [],
  isAnimationLoaded: false,
  scaleFactor: 0.9,
  spineRuntimeUrl: null,
  detectedSpineVersion: null,

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

  setScaleFactor(factor) {
    this.scaleFactor = factor
  },

  setSpineRuntimeUrl(url) {
    this.spineRuntimeUrl = url
  },

  setDetectedSpineVersion(ver) {
    this.detectedSpineVersion = ver
  },

  cleanup() {
    this.spineObject?.destroy()
    this.spineObject = null
    this.isAnimationLoaded = false
    this.skins = []
    this.animations = []
  },
})
