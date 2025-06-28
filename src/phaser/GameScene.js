import { toText, toURL } from './utils.js'
import { phaserStore } from '../store/phaserStore.js'

let activeObjectUrls = []

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.welcomeText = null
    this.backgroundImage = null
  }

  create() {
    this.welcomeText = this.add
      .text(
        this.sys.game.config.width / 2,
        this.sys.game.config.height / 2,
        'Select your Spine files to begin.',
        {
          fontSize: '32px',
          fill: '#fff',
          fontFamily: 'Poppins',
          align: 'center',
        },
      )
      .setOrigin(0.5)
  }

  async loadAndDisplaySpine(spineFiles) {
    phaserStore.cleanup()
    activeObjectUrls.forEach(URL.revokeObjectURL)
    activeObjectUrls.length = 0

    const [jsonTxt, atlasTxt] = await Promise.all([
      toText(spineFiles.jsonFile),
      toText(spineFiles.atlasFile),
    ])

    const skelKey = `spine_${Date.now()}`
    const pageNames = [
      ...new Set(atlasTxt.match(/^\s*(\S+\.(?:png|pma\.png))/gim)?.map((l) => l.trim()) || []),
    ]

    for (const page of pageNames) {
      const file = [...spineFiles.pngFiles].find((f) => f.name === page)
      if (!file) {
        console.warn(`⚠️ PNG '${page}' is referenced in the atlas but was not selected.`)
        continue
      }
      const url = toURL(file)
      const phaserKey = `${skelKey}!${skelKey}_${page}`
      activeObjectUrls.push(url)
      this.load.image(phaserKey, url)
    }

    const atlasKey = skelKey
    let modifiedAtlasTxt = atlasTxt.replace(/^\s*(\S+\.(?:png|pma\.png))$/gim, `${skelKey}_$1`)
    this.cache.text.add(atlasKey, {
      data: modifiedAtlasTxt,
    })
    this.cache.json.add(skelKey, JSON.parse(jsonTxt))

    this.load.once('complete', () => {
      const spineObj = this.add.spine(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        skelKey,
        atlasKey,
      )

      if (this.welcomeText) {
        this.welcomeText.destroy()
        this.welcomeText = null
      }

      spineObj.skeleton.setSkinByName('default')
      spineObj.skeleton.setSlotsToSetupPose()

      const animations = spineObj.skeleton.data.animations
      if (animations.length) {
        spineObj.animationState.setAnimation(0, animations[0].name, true)
      }

      this.fitAndCenterSpineObject(spineObj)

      phaserStore.setSpineObject(spineObj)
      phaserStore.setSkins(spineObj.skeleton.data.skins.map((skin) => skin.name))
      phaserStore.setAnimations(animations.map((anim) => anim.name))
    })

    this.load.start()
  }

  fitAndCenterSpineObject(spineObj) {
    const bounds = {
      offset: new spine.Vector2(),
      size: new spine.Vector2(),
    }
    spineObj.skeleton.getBounds(bounds.offset, bounds.size, [])

    if (bounds.size.x > 0 && bounds.size.y > 0) {
      const scale =
        Math.min(this.scale.width / bounds.size.x, this.scale.height / bounds.size.y) * 0.9
      spineObj.setScale(scale)
    }

    const centerX_relative = bounds.offset.x + bounds.size.x / 2
    const centerY_relative = bounds.offset.y + bounds.size.y / 2

    spineObj.x = this.cameras.main.centerX - centerX_relative * spineObj.scaleX
    spineObj.y = this.cameras.main.centerY - centerY_relative * spineObj.scaleY
  }

  setBackgroundColor(hexColor) {
    const color = Phaser.Display.Color.ValueToColor(hexColor)
    this.cameras.main.setBackgroundColor(color)
  }

  setBackgroundImage(file) {
    if (this.backgroundImage) {
      this.backgroundImage.destroy()
      this.backgroundImage = null
    }

    const key = 'bg-image'
    const url = URL.createObjectURL(file)

    if (this.textures.exists(key)) {
      this.textures.remove(key)
    }

    this.load.image(key, url)
    this.load.once('complete', () => {
      this.backgroundImage = this.add.image(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        key,
      )
      this.backgroundImage.setOrigin(0.5, 0.5)

      const scaleX = this.cameras.main.width / this.backgroundImage.width
      const scaleY = this.cameras.main.height / this.backgroundImage.height
      const scale = Math.max(scaleX, scaleY)
      this.backgroundImage.setScale(scale)

      this.backgroundImage.setDepth(-1)
      URL.revokeObjectURL(url)
    })
    this.load.start()
  }

  clearBackgroundImage() {
    if (this.backgroundImage) {
      this.backgroundImage.destroy()
      this.backgroundImage = null
    }
  }
}
