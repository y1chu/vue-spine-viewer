import { toText, toURL } from './utils.js'
import { phaserStore } from '../store/phaserStore.js'
import { i18n } from '../i18n.js'

let activeObjectUrls = []

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.welcomeText = null
    this.backgroundImage = null
    this.compareAppearance = {
      overlayOpacity: 0.6,
      jsonTint: '#5ad1ff',
      skelTint: '#ff8a5b',
    }
    this.compareMetrics = null
    this.compareReport = null
    this.layoutOffset = { x: 0, y: 0 }
    this.isDraggingLayout = false
    this.dragPointerId = null
    this.dragStartPointer = { x: 0, y: 0 }
    this.dragStartOffset = { x: 0, y: 0 }
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
    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
    this.input.on('pointerupoutside', this.handlePointerUp, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this)
      this.input.off('pointerdown', this.handlePointerDown, this)
      this.input.off('pointermove', this.handlePointerMove, this)
      this.input.off('pointerup', this.handlePointerUp, this)
      this.input.off('pointerupoutside', this.handlePointerUp, this)
    })
  }

  handleResize() {
    this.refreshLayout()
  }

  resetLayoutOffset() {
    this.layoutOffset = { x: 0, y: 0 }
    this.isDraggingLayout = false
    this.dragPointerId = null
  }

  getLoadedSpineObjects() {
    if (phaserStore.spineObjects?.length) return phaserStore.spineObjects
    if (phaserStore.spineObject) return [phaserStore.spineObject]
    return []
  }

  isPointerInsideSpineObject(pointer, spineObj) {
    if (!pointer || !spineObj?.active) return false
    const bounds = this.getSpineBounds(spineObj)
    const scaleX = Number(spineObj.scaleX) || 1
    const scaleY = Number(spineObj.scaleY) || 1
    const left = spineObj.x + bounds.offset.x * scaleX
    const top = spineObj.y + bounds.offset.y * scaleY
    const right = left + bounds.size.x * scaleX
    const bottom = top + bounds.size.y * scaleY
    const minX = Math.min(left, right)
    const maxX = Math.max(left, right)
    const minY = Math.min(top, bottom)
    const maxY = Math.max(top, bottom)
    return pointer.x >= minX && pointer.x <= maxX && pointer.y >= minY && pointer.y <= maxY
  }

  handlePointerDown(pointer) {
    if (!pointer) return
    if (typeof pointer.button === 'number' && pointer.button !== 0) return
    const spineObjs = this.getLoadedSpineObjects()
    if (!spineObjs.length) return
    const isInside = spineObjs.some((obj) => this.isPointerInsideSpineObject(pointer, obj))
    if (!isInside) return
    this.isDraggingLayout = true
    this.dragPointerId = pointer.id
    this.dragStartPointer = { x: pointer.x, y: pointer.y }
    this.dragStartOffset = { ...this.layoutOffset }
  }

  handlePointerMove(pointer) {
    if (!this.isDraggingLayout || this.dragPointerId !== pointer?.id) return
    const deltaX = pointer.x - this.dragStartPointer.x
    const deltaY = pointer.y - this.dragStartPointer.y
    this.layoutOffset = {
      x: this.dragStartOffset.x + deltaX,
      y: this.dragStartOffset.y + deltaY,
    }
    this.refreshLayout()
  }

  handlePointerUp(pointer) {
    if (!this.isDraggingLayout) return
    if (pointer && this.dragPointerId !== pointer.id) return
    this.isDraggingLayout = false
    this.dragPointerId = null
  }

  getSpineBounds(spineObj) {
    const bounds = {
      offset: new spine.Vector2(),
      size: new spine.Vector2(),
    }
    spineObj.skeleton.getBounds(bounds.offset, bounds.size, [])
    return bounds
  }

  computeScaleForBounds(bounds, targetWidth, targetHeight) {
    if (bounds.size.x <= 0 || bounds.size.y <= 0) return 1
    return Math.min(targetWidth / bounds.size.x, targetHeight / bounds.size.y) * phaserStore.scaleFactor
  }

  positionSpineObject(spineObj, bounds, centerX, centerY, scale) {
    spineObj.setScale(scale)
    const centerXRelative = bounds.offset.x + bounds.size.x / 2
    const centerYRelative = bounds.offset.y + bounds.size.y / 2
    spineObj.x = centerX - centerXRelative * scale
    spineObj.y = centerY - centerYRelative * scale
  }

  getCompareBounds(spineObj, fallbackBounds) {
    const data = spineObj?.skeleton?.data
    const width = Number.isFinite(data?.width) && data.width > 0 ? data.width : fallbackBounds.size.x
    const height =
      Number.isFinite(data?.height) && data.height > 0 ? data.height : fallbackBounds.size.y
    const x = Number.isFinite(data?.x) ? data.x : fallbackBounds.offset.x
    const y = Number.isFinite(data?.y) ? data.y : fallbackBounds.offset.y
    return {
      offset: { x, y },
      size: { x: width, y: height },
    }
  }

  applyDefaultSkin(spineObj) {
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
  }

  getNameList(items) {
    return (items || [])
      .map((item) => item?.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }

  intersectNameLists(lists) {
    if (!lists?.length) return []
    return lists.reduce((acc, list) => acc.filter((name) => list.includes(name)))
  }

  clamp(value, min, max) {
    if (Number.isNaN(value)) return min
    return Math.min(max, Math.max(min, value))
  }

  normalizeHexColor(hex) {
    if (!hex) return null
    const raw = String(hex).trim()
    if (!raw) return null
    let clean = raw.startsWith('#') ? raw.slice(1) : raw
    if (clean.length === 3) {
      clean = clean
        .split('')
        .map((c) => `${c}${c}`)
        .join('')
    }
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
    return `#${clean.toLowerCase()}`
  }

  hexToRgb01(hex) {
    const normalized = this.normalizeHexColor(hex)
    if (!normalized) return null
    const value = Number.parseInt(normalized.slice(1), 16)
    return {
      r: ((value >> 16) & 255) / 255,
      g: ((value >> 8) & 255) / 255,
      b: (value & 255) / 255,
      tint: value,
    }
  }

  setObjectAlpha(spineObj, alpha) {
    if (!spineObj) return
    if (spineObj.skeleton?.color) {
      spineObj.skeleton.color.a = alpha
    }
    if (typeof spineObj.setAlpha === 'function') {
      spineObj.setAlpha(alpha)
    } else {
      spineObj.alpha = alpha
    }
  }

  applyTint(spineObj, hex) {
    if (!spineObj) return
    const rgb = this.hexToRgb01(hex)
    if (spineObj.skeleton?.color) {
      const color = spineObj.skeleton.color
      if (rgb) {
        color.r = rgb.r
        color.g = rgb.g
        color.b = rgb.b
      } else {
        color.r = 1
        color.g = 1
        color.b = 1
      }
      if (Number.isNaN(color.a) || color.a === 0) color.a = 1
      return
    }
    if (rgb && typeof spineObj.setTint === 'function') {
      spineObj.setTint(rgb.tint)
      return
    }
    if (typeof spineObj.clearTint === 'function') spineObj.clearTint()
  }

  setObjectBlendMode(spineObj, mode) {
    if (!spineObj) return
    if (typeof spineObj.setBlendMode === 'function') {
      spineObj.setBlendMode(mode)
      return
    }
    if ('blendMode' in spineObj) {
      spineObj.blendMode = mode
    }
  }

  computeCompareObjectScale(baseScale, runtimeBounds, compareBounds) {
    const ratios = []
    if (runtimeBounds?.size?.x > 0 && compareBounds?.size?.x > 0) {
      ratios.push(compareBounds.size.x / runtimeBounds.size.x)
    }
    if (runtimeBounds?.size?.y > 0 && compareBounds?.size?.y > 0) {
      ratios.push(compareBounds.size.y / runtimeBounds.size.y)
    }
    const validRatios = ratios.filter((value) => Number.isFinite(value) && value > 0)
    const ratio = validRatios.length ? Math.min(...validRatios) : 1
    return baseScale * ratio
  }

  buildCompareMetrics(jsonObj, skelObj) {
    const jsonData = jsonObj?.skeleton?.data
    const skelData = skelObj?.skeleton?.data
    const jsonBounds = this.getSpineBounds(jsonObj)
    const skelBounds = this.getSpineBounds(skelObj)

    const fromData = (data, bounds) => ({
      width: Number.isFinite(data?.width) ? data.width : bounds.size.x,
      height: Number.isFinite(data?.height) ? data.height : bounds.size.y,
      x: Number.isFinite(data?.x) ? data.x : bounds.offset.x,
      y: Number.isFinite(data?.y) ? data.y : bounds.offset.y,
    })

    return {
      json: fromData(jsonData, jsonBounds),
      skel: fromData(skelData, skelBounds),
    }
  }

  getCompareMetrics() {
    return this.compareMetrics
  }

  getCompareReport() {
    return this.compareReport
  }

  buildCompareReport(jsonData, skelData) {
    const diffs = []
    const toNames = (items) =>
      (items || [])
        .map((item) => item?.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    const compareScalar = (field, jsonValue, skelValue) => {
      if (jsonValue !== skelValue) {
        diffs.push({ type: 'scalar', field, json: jsonValue, skel: skelValue })
      }
    }

    const compareNames = (field, jsonList, skelList) => {
      const jsonSet = new Set(jsonList)
      const skelSet = new Set(skelList)
      const jsonOnly = jsonList.filter((name) => !skelSet.has(name))
      const skelOnly = skelList.filter((name) => !jsonSet.has(name))
      if (jsonOnly.length || skelOnly.length) {
        diffs.push({
          type: 'names',
          field,
          jsonOnly,
          skelOnly,
          jsonCount: jsonList.length,
          skelCount: skelList.length,
        })
      }
    }

    const jsonBones = toNames(jsonData?.bones)
    const skelBones = toNames(skelData?.bones)
    const jsonSlots = toNames(jsonData?.slots)
    const skelSlots = toNames(skelData?.slots)
    const jsonSkins = toNames(jsonData?.skins)
    const skelSkins = toNames(skelData?.skins)
    const jsonAnims = toNames(jsonData?.animations)
    const skelAnims = toNames(skelData?.animations)
    const jsonEvents = toNames(jsonData?.events)
    const skelEvents = toNames(skelData?.events)
    const jsonIk = toNames(jsonData?.ikConstraints)
    const skelIk = toNames(skelData?.ikConstraints)
    const jsonTransform = toNames(jsonData?.transformConstraints)
    const skelTransform = toNames(skelData?.transformConstraints)
    const jsonPath = toNames(jsonData?.pathConstraints)
    const skelPath = toNames(skelData?.pathConstraints)

    compareScalar('hash', jsonData?.hash || null, skelData?.hash || null)
    compareScalar('version', jsonData?.version || null, skelData?.version || null)
    compareScalar('width', jsonData?.width ?? null, skelData?.width ?? null)
    compareScalar('height', jsonData?.height ?? null, skelData?.height ?? null)
    compareScalar('x', jsonData?.x ?? null, skelData?.x ?? null)
    compareScalar('y', jsonData?.y ?? null, skelData?.y ?? null)
    compareNames('bones', jsonBones, skelBones)
    compareNames('slots', jsonSlots, skelSlots)
    compareNames('skins', jsonSkins, skelSkins)
    compareNames('animations', jsonAnims, skelAnims)
    compareNames('events', jsonEvents, skelEvents)
    compareNames('ik', jsonIk, skelIk)
    compareNames('transform', jsonTransform, skelTransform)
    compareNames('path', jsonPath, skelPath)

    const animByName = (list) => new Map((list || []).map((anim) => [anim.name, anim]))
    const jsonAnimMap = animByName(jsonData?.animations)
    const skelAnimMap = animByName(skelData?.animations)
    const commonAnims = jsonAnims.filter((name) => skelAnimMap.has(name))
    const epsilon = 0.0001

    const timelineTypes = (anim) => {
      const timelines = anim?.timelines || []
      return timelines
        .map((tl) => tl?.constructor?.name || tl?.propertyId || 'Timeline')
        .map((val) => String(val))
    }

    for (const name of commonAnims) {
      const jsonAnim = jsonAnimMap.get(name)
      const skelAnim = skelAnimMap.get(name)
      if (!jsonAnim || !skelAnim) continue
      const jsonDuration = Number(jsonAnim.duration || 0)
      const skelDuration = Number(skelAnim.duration || 0)
      if (Math.abs(jsonDuration - skelDuration) > epsilon) {
        diffs.push({
          type: 'anim-duration',
          name,
          json: jsonDuration,
          skel: skelDuration,
        })
      }
      const jsonTimelineCount = jsonAnim.timelines?.length || 0
      const skelTimelineCount = skelAnim.timelines?.length || 0
      if (jsonTimelineCount !== skelTimelineCount) {
        diffs.push({
          type: 'anim-timelines',
          name,
          json: jsonTimelineCount,
          skel: skelTimelineCount,
        })
      }

      const jsonTypes = timelineTypes(jsonAnim)
      const skelTypes = timelineTypes(skelAnim)
      const jsonTypeSet = new Set(jsonTypes)
      const skelTypeSet = new Set(skelTypes)
      const jsonOnly = [...jsonTypeSet].filter((t) => !skelTypeSet.has(t))
      const skelOnly = [...skelTypeSet].filter((t) => !jsonTypeSet.has(t))
      if (jsonOnly.length || skelOnly.length) {
        diffs.push({
          type: 'anim-timeline-types',
          name,
          jsonOnly,
          skelOnly,
        })
      }
    }

    const slotNames = toNames(jsonData?.slots)
    const getAttachmentKeys = (skin) => {
      const keys = []
      if (!skin) return keys
      if (typeof skin.getAttachments === 'function') {
        try {
          const entries = skin.getAttachments() || []
          entries.forEach((entry) => {
            const slotName = slotNames[entry.slotIndex] || String(entry.slotIndex)
            keys.push(`${slotName}:${entry.name}`)
          })
          return keys
        } catch {
          // fall through
        }
      }
      const attachments = skin.attachments
      if (Array.isArray(attachments)) {
        attachments.forEach((slotAttachments, slotIndex) => {
          if (!slotAttachments) return
          const slotName = slotNames[slotIndex] || String(slotIndex)
          if (slotAttachments instanceof Map) {
            slotAttachments.forEach((_value, key) => {
              keys.push(`${slotName}:${key}`)
            })
          } else if (typeof slotAttachments === 'object') {
            Object.keys(slotAttachments).forEach((key) => {
              keys.push(`${slotName}:${key}`)
            })
          }
        })
      } else if (attachments instanceof Map) {
        attachments.forEach((_value, key) => {
          keys.push(String(key))
        })
      } else if (attachments && typeof attachments === 'object') {
        Object.keys(attachments).forEach((key) => {
          keys.push(String(key))
        })
      }
      return keys
    }

    const skinByName = (list) => new Map((list || []).map((skin) => [skin.name, skin]))
    const jsonSkinMap = skinByName(jsonData?.skins)
    const skelSkinMap = skinByName(skelData?.skins)
    const commonSkins = jsonSkins.filter((name) => skelSkinMap.has(name))

    for (const skinName of commonSkins) {
      const jsonSkin = jsonSkinMap.get(skinName)
      const skelSkin = skelSkinMap.get(skinName)
      const jsonKeys = getAttachmentKeys(jsonSkin)
      const skelKeys = getAttachmentKeys(skelSkin)
      if (!jsonKeys.length && !skelKeys.length) continue
      const jsonSet = new Set(jsonKeys)
      const skelSet = new Set(skelKeys)
      const jsonOnly = jsonKeys.filter((k) => !skelSet.has(k))
      const skelOnly = skelKeys.filter((k) => !jsonSet.has(k))
      if (jsonOnly.length || skelOnly.length || jsonKeys.length !== skelKeys.length) {
        diffs.push({
          type: 'skin-attachments',
          name: skinName,
          json: jsonKeys.length,
          skel: skelKeys.length,
          jsonOnly,
          skelOnly,
        })
      }
    }

    return { diffs }
  }

  applyCompareVisuals(spineObjs, layout) {
    if (!spineObjs?.length) return
    if (layout === 'overlay') {
      const opacity = this.clamp(
        Number(this.compareAppearance?.overlayOpacity ?? 0.6),
        0.1,
        1,
      )
      spineObjs.forEach((obj, index) => {
        const alpha = index === 0 ? 1 : opacity
        this.setObjectAlpha(obj, alpha)
        obj.setDepth(index + 1)
        const tint = index === 0 ? this.compareAppearance?.jsonTint : this.compareAppearance?.skelTint
        this.applyTint(obj, tint)
        this.setObjectBlendMode(obj, Phaser.BlendModes.NORMAL)
      })
      return
    }
    spineObjs.forEach((obj) => {
      this.setObjectAlpha(obj, 1)
      obj.setDepth(1)
      this.applyTint(obj, null)
      this.setObjectBlendMode(obj, Phaser.BlendModes.NORMAL)
    })
  }

  layoutCompareSpineObjects(spineObjs, layout) {
    if (!spineObjs?.length) return
    const runtimeBoundsList = spineObjs.map((obj) => this.getSpineBounds(obj))
    const compareBoundsList = spineObjs.map((obj, index) =>
      this.getCompareBounds(obj, runtimeBoundsList[index]),
    )
    const compareCenterXList = compareBoundsList.map((bounds) => bounds.offset.x + bounds.size.x / 2)
    const compareCenterYList = compareBoundsList.map((bounds) => bounds.offset.y + bounds.size.y / 2)
    const compareAnchorX = (Math.min(...compareCenterXList) + Math.max(...compareCenterXList)) / 2
    const compareAnchorY = (Math.min(...compareCenterYList) + Math.max(...compareCenterYList)) / 2
    const maxWidth = Math.max(...compareBoundsList.map((bounds) => bounds.size.x || 0))
    const maxHeight = Math.max(...compareBoundsList.map((bounds) => bounds.size.y || 0))
    if (maxWidth <= 0 || maxHeight <= 0) return

    const gap = 40
    const isSideBySide = layout === 'side-by-side'
    const targetWidth = isSideBySide
      ? Math.max(10, (this.scale.width - gap) / 2)
      : this.scale.width
    const targetHeight = this.scale.height
    const baseScale = this.computeScaleForBounds(
      { size: { x: maxWidth, y: maxHeight } },
      targetWidth,
      targetHeight,
    )

    const centerY = this.cameras.main.centerY + this.layoutOffset.y
    const centersX = isSideBySide
      ? [
          this.cameras.main.centerX + this.layoutOffset.x - (targetWidth / 2 + gap / 2),
          this.cameras.main.centerX + this.layoutOffset.x + (targetWidth / 2 + gap / 2),
        ]
      : [this.cameras.main.centerX + this.layoutOffset.x, this.cameras.main.centerX + this.layoutOffset.x]

    spineObjs.forEach((obj, index) => {
      const centerX = centersX[Math.min(index, centersX.length - 1)]
      const runtimeBounds = runtimeBoundsList[index]
      const compareBounds = compareBoundsList[index]
      const scale = this.computeCompareObjectScale(baseScale, runtimeBounds, compareBounds)
      const compareCenterX = compareBounds.offset.x + compareBounds.size.x / 2
      const compareCenterY = compareBounds.offset.y + compareBounds.size.y / 2
      const relativeCenterX = compareCenterX - compareAnchorX
      const relativeCenterY = compareCenterY - compareAnchorY
      obj.setScale(scale)
      obj.x = centerX - relativeCenterX * scale
      obj.y = centerY - relativeCenterY * scale
    })

    this.applyCompareVisuals(spineObjs, layout)
  }

  refreshLayout() {
    const spineObjs = this.getLoadedSpineObjects()
    if (!spineObjs.length) return
    if (phaserStore.compareLayout && spineObjs.length > 1) {
      this.layoutCompareSpineObjects(spineObjs, phaserStore.compareLayout)
      return
    }
    this.fitAndCenterSpineObject(spineObjs[0])
  }

  setCompareLayout(layout) {
    const resolved = layout || null
    phaserStore.setCompareLayout(resolved)
    if (resolved && phaserStore.spineObjects?.length > 1) {
      this.layoutCompareSpineObjects(phaserStore.spineObjects, resolved)
    } else if (phaserStore.spineObject) {
      this.fitAndCenterSpineObject(phaserStore.spineObject)
    }
  }

  setCompareAppearance(appearance = {}) {
    this.compareAppearance = { ...this.compareAppearance, ...appearance }
    if (phaserStore.compareLayout && phaserStore.spineObjects?.length > 1) {
      this.applyCompareVisuals(phaserStore.spineObjects, phaserStore.compareLayout)
    }
  }

  getAtlasPageNames(atlasTxt) {
    const pageRegex = /^\s*([^\r\n]+?\.(?:png|pma\.png))\s*$/gim
    return [...atlasTxt.matchAll(pageRegex)]
      .map((m) => m[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }

  queueAtlasTextures(spineFiles, atlasKey, pageNames, urlBucket) {
    const missing = []
    for (const page of pageNames) {
      const file = spineFiles.pngFiles.find((f) => f.name === page)
      if (!file) {
        missing.push(page)
        continue
      }

      const url = toURL(file)
      const phaserKey = `${atlasKey}!${page}`
      urlBucket.push(url)
      this.load.image(phaserKey, url)
    }
    return missing
  }

  queueSpineAtlas(spineFiles, atlasKey, urlBucket) {
    const atlasURL = toURL(spineFiles.atlasFile)
    urlBucket.push(atlasURL)
    this.load.spineAtlas(atlasKey, atlasURL, true)
  }

  queueSkeletonData(spineFiles, dataKey, format, urlBucket) {
    const file =
      format === 'skel' ? spineFiles.skelFile || spineFiles.bytesFile : spineFiles.jsonFile
    if (!file) throw new Error(`Missing ${format === 'skel' ? 'skel/bytes' : format} file`)
    const dataURL = toURL(file)
    urlBucket.push(dataURL)
    if (format === 'skel') {
      if (typeof this.load.spineBinary !== 'function') {
        throw new Error('spineBinary loader is unavailable in this runtime')
      }
      this.load.spineBinary(dataKey, dataURL)
    } else {
      this.load.spineJson(dataKey, dataURL)
    }
  }

  warnMissingPages(missing) {
    if (!missing.length) return
    console.warn('Missing PNG files:', missing.join(', '))
    alert(
      `These texture pages are referenced in the atlas but were not selected:\n` +
        missing.join('\n'),
    )
  }

  async loadAndDisplaySpine(spineFiles, options = {}) {
    phaserStore.cleanup()
    activeObjectUrls.forEach(URL.revokeObjectURL)
    activeObjectUrls.length = 0
    this.compareMetrics = null
    this.compareReport = null
    this.resetLayoutOffset()

    const format = options.format || (spineFiles.jsonFile ? 'json' : 'skel')
    if (!format) throw new Error('Missing skeleton file')

    const atlasTxt = await toText(spineFiles.atlasFile)

    const baseKey = `spine_${Date.now()}`
    const atlasKey = `${baseKey}_atlas`
    const jsonKey = `${baseKey}_json`
    const skelKey = `${baseKey}_skel`

    const pageNames = this.getAtlasPageNames(atlasTxt)
    const missing = this.queueAtlasTextures(spineFiles, atlasKey, pageNames, activeObjectUrls)
    this.warnMissingPages(missing)

    this.queueSpineAtlas(spineFiles, atlasKey, activeObjectUrls)
    const dataKey = format === 'skel' ? skelKey : jsonKey
    this.queueSkeletonData(spineFiles, dataKey, format, activeObjectUrls)

    this.load.once('complete', () => {
      const spineObj = this.add.spine(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        dataKey,
        atlasKey,
      )

      // NOTE: ??? spine ?????PMA ??? true
      // console.error('Spine Object PMA:', spineObj.premultipliedAlpha);

      if (this.welcomeText) {
        this.welcomeText.destroy()
        this.welcomeText = null
      }

      this.applyDefaultSkin(spineObj)

      const anims = spineObj.skeleton.data.animations
      if (anims.length) spineObj.animationState.setAnimation(0, anims[0].name, true)

      phaserStore.setSpineObjects([spineObj], { compareLayout: null })
      phaserStore.setSkins(this.getNameList(spineObj.skeleton.data.skins))
      phaserStore.setAnimations(this.getNameList(anims))
      this.refreshLayout()
    })

    this.load.start()
  }

  async loadAndDisplayCompare(spineFiles, options = {}) {
    phaserStore.cleanup()
    activeObjectUrls.forEach(URL.revokeObjectURL)
    activeObjectUrls.length = 0
    this.compareMetrics = null
    this.compareReport = null
    this.resetLayoutOffset()

    if (!spineFiles.jsonFile || !(spineFiles.skelFile || spineFiles.bytesFile)) {
      throw new Error('Both .json and a binary (.skel/.bytes) file are required for compare mode')
    }

    const layout = options.layout || 'overlay'
    if (options.appearance) {
      this.compareAppearance = { ...this.compareAppearance, ...options.appearance }
    }
    const atlasTxt = await toText(spineFiles.atlasFile)

    const baseKey = `compare_${Date.now()}`
    const atlasKey = `${baseKey}_atlas`
    const jsonKey = `${baseKey}_json`
    const skelKey = `${baseKey}_skel`

    const pageNames = this.getAtlasPageNames(atlasTxt)
    const missing = this.queueAtlasTextures(spineFiles, atlasKey, pageNames, activeObjectUrls)
    this.warnMissingPages(missing)

    this.queueSpineAtlas(spineFiles, atlasKey, activeObjectUrls)
    this.queueSkeletonData(spineFiles, jsonKey, 'json', activeObjectUrls)
    this.queueSkeletonData(spineFiles, skelKey, 'skel', activeObjectUrls)

    return await new Promise((resolve, reject) => {
      let settled = false
      const cleanup = () => {
        // no-op for now; compare assets are kept for display
      }
      const onComplete = () => {
        if (settled) return
        settled = true
        try {
          const jsonObj = this.add.spine(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            jsonKey,
            atlasKey,
          )
          const skelObj = this.add.spine(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            skelKey,
            atlasKey,
          )

          if (this.welcomeText) {
            this.welcomeText.destroy()
            this.welcomeText = null
          }

          this.applyDefaultSkin(jsonObj)
          this.applyDefaultSkin(skelObj)

          this.compareMetrics = this.buildCompareMetrics(jsonObj, skelObj)
          this.compareReport = this.buildCompareReport(
            jsonObj.skeleton.data,
            skelObj.skeleton.data,
          )

          const jsonAnimations = this.getNameList(jsonObj.skeleton.data.animations)
          const skelAnimations = this.getNameList(skelObj.skeleton.data.animations)
          const commonAnimations = this.intersectNameLists([jsonAnimations, skelAnimations])
          const initialAnimation = commonAnimations[0]
          if (initialAnimation) {
            jsonObj.animationState.setAnimation(0, initialAnimation, true)
            skelObj.animationState.setAnimation(0, initialAnimation, true)
          }

          const jsonSkins = this.getNameList(jsonObj.skeleton.data.skins)
          const skelSkins = this.getNameList(skelObj.skeleton.data.skins)
          const commonSkins = this.intersectNameLists([jsonSkins, skelSkins])

          phaserStore.setSpineObjects([jsonObj, skelObj], { compareLayout: layout })
          phaserStore.setSkins(commonSkins)
          phaserStore.setAnimations(commonAnimations)

          this.layoutCompareSpineObjects([jsonObj, skelObj], layout)
          cleanup()
          resolve({ metrics: this.compareMetrics, report: this.compareReport })
        } catch (e) {
          cleanup()
          reject(e)
        }
      }
      const onError = (file) => {
        if (settled) return
        settled = true
        cleanup()
        const key = file?.key ? ` (${file.key})` : ''
        reject(new Error(`Failed to load spine data${key}`))
      }

      this.load.once('complete', onComplete)
      this.load.once('loaderror', onError)
      this.load.start()
    })
  }

  fitAndCenterSpineObject(spineObj) {
    if (!spineObj) return
    const bounds = this.getSpineBounds(spineObj)
    const scale = this.computeScaleForBounds(bounds, this.scale.width, this.scale.height)
    this.positionSpineObject(
      spineObj,
      bounds,
      this.cameras.main.centerX + this.layoutOffset.x,
      this.cameras.main.centerY + this.layoutOffset.y,
      scale,
    )
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
