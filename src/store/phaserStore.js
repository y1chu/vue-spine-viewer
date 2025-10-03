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
  hasAudio: false,
  audioVolume: 0.5,
  eventAudioList: [],

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

  setHasAudio(flag) {
    this.hasAudio = !!flag
  },

  setAudioVolume(vol) {
    const v = Math.max(0, Math.min(1, Number(vol)))
    this.audioVolume = Number.isFinite(v) ? v : 0.5
  },
  setEventAudioList(list) {
    this.eventAudioList = Array.isArray(list) ? list : []
  },

  cleanup() {
    this.spineObject?.destroy()
    this.spineObject = null
    this.isAnimationLoaded = false
    this.skins = []
    this.animations = []
    this.hasAudio = false
    this.eventAudioList = []
  },
})
