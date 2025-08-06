import { reactive } from 'vue'

export const phaserStore = reactive({
  gameInstance: null,
  spineObject: null,
  skins: [],
  animations: [],
  isAnimationLoaded: false,
  scaleFactor: 0.9,
  runtimeVersion: '4.1',
  skeletonVersion: null,

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

  setRuntimeVersion(version) {
    this.runtimeVersion = version
  },

  setSkeletonVersion(version) {
    this.skeletonVersion = version
  },

  cleanup() {
    this.spineObject?.destroy()
    this.spineObject = null
    this.isAnimationLoaded = false
    this.skins = []
    this.animations = []
  },
})
