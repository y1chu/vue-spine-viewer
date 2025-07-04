import { toText, toURL } from './utils.js'
import { phaserStore } from '../store/phaserStore.js'
import { i18n } from '../i18n.js'

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
        i18n.global.t('game.welcome'),
        {
          fontSize: '32px',
          fill: '#fff',
          fontFamily: 'Poppins',
          align: 'center',
        },
      )
      .setOrigin(0.5)

    this.scale.on('resize', this.handleResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this)
    })
  }

  handleResize() {
    if (phaserStore.spineObject) {
      this.fitAndCenterSpineObject(phaserStore.spineObject)
    }
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
    const atlasKey = skelKey
    const pageRegex = /^\s*(\S+\.(?:png|pma\.png))/gim

    const pageNames = [...atlasTxt.matchAll(pageRegex)]
      .map((m) => m[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    const missing = []

    for (const page of pageNames) {
      const file = spineFiles.pngFiles.find((f) => f.name === page)
      if (!file) {
        missing.push(page)
        continue
      }

      const url = toURL(file)
      const phaserKey = `${skelKey}!${page}`
      activeObjectUrls.push(url)
      this.load.image(phaserKey, url)
    }

    this.cache.text.add(atlasKey, { data: atlasTxt })
    this.cache.json.add(skelKey, JSON.parse(jsonTxt))

    if (missing.length) {
      console.warn('⚠️ Missing PNG files:', missing.join(', '))
      alert(
        `These texture pages are referenced in the atlas but were not selected:\n` +
          missing.join('\n'),
      )
    }

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

      const { skins } = spineObj.skeleton.data
      const defaultSkin = spineObj.skeleton.data.findSkin('default')
      if (skins.length > 1) {
        const composite = new spine.Skin('auto-skin')
        if (defaultSkin) composite.addSkin(defaultSkin)
        const extraSkin = skins.find((s) => s.name !== 'default')
        if (extraSkin) composite.addSkin(extraSkin)
        composite.componentSkinNames = [defaultSkin?.name, extraSkin?.name].filter(Boolean)
        spineObj.skeleton.setSkin(composite)
      } else if (defaultSkin) {
        spineObj.skeleton.setSkin(defaultSkin)
      }
      spineObj.skeleton.setSlotsToSetupPose()

      const anims = spineObj.skeleton.data.animations
      if (anims.length) spineObj.animationState.setAnimation(0, anims[0].name, true)

      this.fitAndCenterSpineObject(spineObj)

      phaserStore.setSpineObject(spineObj)
      phaserStore.setSkins(spineObj.skeleton.data.skins.map((s) => s.name))
      phaserStore.setAnimations(anims.map((a) => a.name))
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
        Math.min(this.scale.width / bounds.size.x, this.scale.height / bounds.size.y) *
        phaserStore.scaleFactor
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
