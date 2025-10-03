import { toText, toURL } from './utils.js'
import { phaserStore } from '../store/phaserStore.js'
import { i18n } from '../i18n.js'
import { logError } from '../utils/logError.js'

let activeObjectUrls = []

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.welcomeText = null
    this.backgroundImage = null
    // Keep a single Sound instance per audio key to avoid stacking overlaps
    this._audioByKey = new Map()
  }

  create() {
    // Ensure the sound manager starts at our global default volume
    try {
      const initialVol = typeof phaserStore.audioVolume === 'number' ? phaserStore.audioVolume : 0.5
      if (this.sound) this.sound.volume = initialVol
    } catch (err) {
      logError('GameScene.create: apply initial volume', err)
    }

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
      // Cleanup audio instances
      try {
        this._audioByKey?.forEach((snd) => {
          try {
            snd.destroy()
          } catch (err) {
            logError('GameScene.shutdown: destroy sound instance', err, { key: snd?.key })
          }
        })
        this._audioByKey?.clear()
      } catch (err) {
        logError('GameScene.shutdown: cleanup audio map', err)
      }
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

    const atlasTxt = await toText(spineFiles.atlasFile)

    const skelKey = `spine_${Date.now()}`
    const atlasKey = skelKey
    const pageRegex = /^\s*([^\r\n]+?\.(?:png|pma\.png))\s*$/gim

    const pageNames = [...atlasTxt.matchAll(pageRegex)]
      .map((m) => m[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    const missing = []

    // NOTE: 需要手動匯入圖片
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

    // Preload all selected audio files (optional but simple)
    if (Array.isArray(spineFiles.audioFiles) && spineFiles.audioFiles.length) {
      for (const file of spineFiles.audioFiles) {
        const url = toURL(file)
        activeObjectUrls.push(url)
        const key = `audio:${file.name}`
        this.load.audio(key, url)
      }
      try {
        phaserStore.setHasAudio(true)
      } catch (err) {
        logError('GameScene.loadAndDisplaySpine: setHasAudio(true)', err)
      }
    }

    // NOTE: 不用 cache 匯入，原因是手動寫入 cache 會導致 obj 沒吃到 PMA 而在 spine 物件接縫處有黑邊
    // this.cache.text.add(atlasKey, { data: atlasTxt })
    // this.cache.json.add(skelKey, JSON.parse(jsonTxt))
    // console.error(jsonTxt, pageNames);

    if (missing.length) {
      console.warn('Missing PNG files:', missing.join(', '))
      alert(
        `These texture pages are referenced in the atlas but were not selected:\n` +
          missing.join('\n'),
      )
    }

    const jsonURL = toURL(spineFiles.jsonFile)
    this.load.spineJson(skelKey, jsonURL)

    // NOTE: 使用 spineAtlas 匯入 atlas 資料方便開啟 PMA
    // @see https://g.co/gemini/share/51c5c2c841e2
    const atlasURL = toURL(spineFiles.atlasFile)
    this.load.spineAtlas(atlasKey, atlasURL, true)

    this.load.once('complete', () => {
      const spineObj = this.add.spine(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        skelKey,
        atlasKey,
      )

      // NOTE: 如果 spine 物件有 PMA 會是 true
      // console.error('Spine Object PMA:', spineObj.premultipliedAlpha);

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

      this._attachSpineAudio(spineObj)

      // Apply current global audio volume from store
      this.setAudioVolume(typeof phaserStore.audioVolume === 'number' ? phaserStore.audioVolume : 0.5)
    })

    this.load.start()
  }

  _attachSpineAudio(spineObj) {
    if (!spineObj || !this.sound) return;
    if (spineObj._audioListenerBound) return;
    spineObj._audioListenerBound = true;

    const toBaseName = (p) => (typeof p === 'string' ? p.split(/[/\\]/).pop() : null);

    // Single instance per audio key
    if (!this._audioByKey) this._audioByKey = new Map();
    const getOrCreateSound = (key) => {
      if (!key || !this.cache?.audio?.exists(key)) return null;
      let s = this._audioByKey.get(key);
      if (!s) {
        s = this.sound.add(key);
        this._audioByKey.set(key, s);
      }
      return s;
    };

    // Build: eventName -> audioPath from skeleton data (only events with audio are eligible)
    const eventAudioMap = new Map();
    try {
      const evDatas = spineObj?.skeleton?.data?.events || [];
      for (const ev of evDatas) {
        const name = ev?.name;
        const audioPath = ev?.audioPath || ev?.audio; // Spine 4.x
        if (name && typeof audioPath === 'string' && audioPath.trim()) {
          eventAudioMap.set(name, audioPath.trim());
        }
      }
    } catch (err) {
      logError('GameScene._attachSpineAudio: build eventAudioMap', err);
    }

    // Build: animationName -> Set(eventNames present in that animation’s event timeline)
    const animEventsMap = new Map();
    try {
      const animations = spineObj?.skeleton?.data?.animations || [];
      for (const anim of animations) {
        const aName = anim?.name;
        if (!aName) continue;
        const evSet = new Set();

        // Spine JSON stores event timelines at animations[...].events (array of {time,name,...})
        const evTimeline = anim?.events;
        if (Array.isArray(evTimeline)) {
          for (const e of evTimeline) {
            const n = e?.name;
            if (n) evSet.add(n);
          }
        }

        // Some exports/runtimes also have timeline objects; be permissive
        if (Array.isArray(anim?.timelines)) {
          for (const tl of anim.timelines) {
            const arr = tl?.events || (typeof tl?.getEvents === 'function' ? tl.getEvents() : null);
            if (Array.isArray(arr)) {
              for (const e of arr) {
                const n = e?.data?.name || e?.name;
                if (n) evSet.add(n);
              }
            }
          }
        }

        if (evSet.size) animEventsMap.set(aName, evSet);
      }
    } catch (err) {
      logError('GameScene._attachSpineAudio: build animEventsMap', err);
    }

    // Listener: on event, play only if (a) this animation has that event and (b) the event has an audio file
    const playFromEvent = (trackEntry, event) => {
      try {
        const animName = trackEntry?.animation?.name;
        const evName = event?.data?.name || event?.name;
        if (!animName || !evName) return;

        // Must exist on this animation’s event set AND have audio configured
        const evSet = animEventsMap.get(animName);
        const audioPath = eventAudioMap.get(evName);
        if (!evSet || !evSet.has(evName) || !audioPath) return;

        const base = toBaseName(audioPath);
        if (!base) return;
        const key = `audio:${base}`;

        const snd = getOrCreateSound(key);
        if (!snd) return;

        // Use per-event volume/balance if present; mix with master volume already on this.sound
        if (typeof snd.setVolume === 'function') snd.setVolume(event?.volume ?? 1);
        if (typeof snd.setPan === 'function') {
          const bal = Number.isFinite(event?.balance) ? event.balance : 0;
          snd.setPan(Math.max(-1, Math.min(1, bal)));
        }

        if (snd.isPlaying) {
          try { snd.stop(); } catch (err) {
            logError('GameScene._attachSpineAudio: stop overlapping', err, { key: snd?.key });
          }
        }
        snd.play();
      } catch (err) {
        logError('GameScene._attachSpineAudio: event handler', err, {
          evName: event?.data?.name, anim: trackEntry?.animation?.name
        });
      }
    };

    // Wire via animationState (spine-phaser 4.1/4.2) or Phaser spine events fallback
    const state = spineObj.animationState || spineObj.state;
    if (state?.addListener) {
      state.addListener({
        start: () => this._stopAllAudio(),
        interrupt: () => this._stopAllAudio(),
        event: (entry, ev) => playFromEvent(entry, ev),
      });
    } else if (spineObj?.on) {
      spineObj.on('spine.start', () => this._stopAllAudio());
      spineObj.on('spine.interrupt', () => this._stopAllAudio());
      spineObj.on('spine.event', (_obj, ev) => {
        const curr = spineObj?.animationState?.getCurrent?.(0);
        if (!curr) return;
        playFromEvent(curr, ev);
      });
    }
  }

  _stopAllAudio() {
    if (!this._audioByKey || !this.sound) return
    try {
      this._audioByKey.forEach((snd) => {
        if (snd?.isPlaying) {
          try {
            snd.stop()
          } catch (err) {
            logError('GameScene._stopAllAudio: stop sound', err, { key: snd?.key })
          }
        }
      })
    } catch (err) {
      logError('GameScene._stopAllAudio: iterate & stop', err)
    }
  }

  setAudioVolume(value) {
    const v = Math.max(0, Math.min(1, Number(value)))
    if (this.sound && Number.isFinite(v)) {
      // Set master volume on Phaser sound manager
      this.sound.volume = v
    }
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

