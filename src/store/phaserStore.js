import { reactive } from 'vue'

export const phaserStore = reactive({
  gameInstance: null,
  spineObject: null,
  spineObjects: [],
  compareLayout: null,
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
    this.setSpineObjects(spineObj ? [spineObj] : [], { compareLayout: null })
  },

  setSpineObjects(spineObjs, options = {}) {
    this.spineObjects = spineObjs || []
    this.spineObject = this.spineObjects[0] || null
    this.isAnimationLoaded = this.spineObjects.length > 0
    this.compareLayout = options.compareLayout || null
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

  setCompareLayout(layout) {
    this.compareLayout = layout || null
  },

  setSpineRuntimeUrl(url) {
    this.spineRuntimeUrl = url
  },

  setDetectedSpineVersion(ver) {
    this.detectedSpineVersion = ver
  },

  cleanup() {
    this.spineObjects.forEach((obj) => obj?.destroy())
    this.spineObjects = []
    this.spineObject = null
    this.compareLayout = null
    this.isAnimationLoaded = false
    this.skins = []
    this.animations = []
  },
})
