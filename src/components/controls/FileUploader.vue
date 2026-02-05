<template>
  <div class="file-uploader">
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept=".json,.skel,.bytes,.atlas,.txt,.png,.pma,.pma.png"
      style="display: none"
      @change="handleFileSelect"
    />

    <div
      class="drop-area"
      :class="{ dragging: isDragging }"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <div v-if="!hasFiles" class="prompt">
        <div class="icon-upload"></div>
        <p>{{ t('uploader.drag_or_click_hint') }}</p>
        <span class="hint">{{ t('uploader.file_types_hint') }}</span>
      </div>

      <div v-else class="status-grid">
        <div
          v-for="status in fileStatuses"
          :key="status.type"
          class="file-status"
          :class="{ valid: !!status.file }"
        >
          <div class="icon-file">{{ status.icon }}</div>
          <div class="info">
            <span class="type">{{ status.label }}</span>
            <span class="name">{{ status.name || t('uploader.file_missing') }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLoadFormatToggle" class="format-select">
      <label class="format-label">{{ t('uploader.load_format') }}</label>
      <div class="format-toggle">
        <button
          type="button"
          class="toggle-button"
          :class="{ active: loadFormat === 'json' }"
          @click="loadFormat = 'json'"
        >
          {{ t('uploader.format_json') }}
        </button>
        <button
          type="button"
          class="toggle-button"
          :class="{ active: loadFormat === 'skel' }"
          @click="loadFormat = 'skel'"
        >
          {{ t('uploader.format_skel') }}
        </button>
      </div>
    </div>

    <label class="compare-toggle">
      <input type="checkbox" v-model="compareMode" />
      <span>{{ t('uploader.compare_mode') }}</span>
    </label>
    <div v-if="compareMode && !compareReady" class="compare-hint">
      {{ t('uploader.compare_requires') }}
    </div>

    <div v-if="compareMode" class="compare-layout">
      <label class="format-label">{{ t('uploader.compare_view') }}</label>
      <div class="format-toggle">
        <button
          type="button"
          class="toggle-button"
          :class="{ active: compareLayout === 'overlay' }"
          @click="compareLayout = 'overlay'"
        >
          {{ t('uploader.compare_overlay') }}
        </button>
        <button
          type="button"
          class="toggle-button"
          :class="{ active: compareLayout === 'side-by-side' }"
          @click="compareLayout = 'side-by-side'"
        >
          {{ t('uploader.compare_side_by_side') }}
        </button>
      </div>
      <div v-if="compareReady" class="compare-legend">{{ compareLegend }}</div>
    </div>

    <div v-if="compareMode && compareLayout === 'overlay'" class="compare-overlay-controls">
      <label class="format-label">
        {{ t('uploader.compare_opacity') }}
        <span>{{ overlayOpacity.toFixed(2) }}</span>
      </label>
      <input
        type="range"
        class="control-slider"
        min="0.1"
        max="1"
        step="0.05"
        v-model.number="overlayOpacity"
      />
      <div class="compare-tint-row">
        <label for="jsonTint">{{ t('uploader.compare_json_tint') }}</label>
        <input id="jsonTint" type="color" v-model="jsonTint" />
      </div>
      <div class="compare-tint-row">
        <label for="skelTint">{{ t('uploader.compare_skel_tint') }}</label>
        <input id="skelTint" type="color" v-model="skelTint" />
      </div>
    </div>

    <div v-if="compareMode && compareMetrics" class="compare-metrics">
      <div class="compare-metrics-title">{{ t('uploader.compare_metrics_title') }}</div>
      <div class="compare-metrics-grid">
        <div class="compare-metrics-header"></div>
        <div class="compare-metrics-header">{{ t('uploader.compare_metrics_json') }}</div>
        <div class="compare-metrics-header">{{ t('uploader.compare_metrics_binary') }}</div>

        <div class="compare-metrics-label">{{ t('uploader.compare_metric_width') }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.json.width) }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.skel.width) }}</div>

        <div class="compare-metrics-label">{{ t('uploader.compare_metric_height') }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.json.height) }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.skel.height) }}</div>

        <div class="compare-metrics-label">{{ t('uploader.compare_metric_x') }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.json.x) }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.skel.x) }}</div>

        <div class="compare-metrics-label">{{ t('uploader.compare_metric_y') }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.json.y) }}</div>
        <div class="compare-metrics-value">{{ formatMetric(compareMetrics.skel.y) }}</div>
      </div>
    </div>

    <div v-if="compareMode && compareReport" class="compare-diffs">
      <div class="compare-diffs-title">{{ t('uploader.compare_diffs_title') }}</div>
      <div v-if="!compareDiffLines.length" class="compare-diffs-empty">
        {{ t('uploader.compare_diffs_none') }}
      </div>
      <div v-else class="compare-diffs-lines">
        <div v-for="(line, index) in compareDiffLines" :key="`diff-${index}`" class="compare-diffs-line">
          {{ line }}
        </div>
      </div>
    </div>

    <div class="runtime-detected" v-if="phaserStore.detectedSpineVersion">
      {{ t('uploader.detected_runtime', { ver: phaserStore.detectedSpineVersion }) }}
    </div>

    <div v-if="pendingRuntimeUrl" class="runtime-reload">
      <div class="runtime-reload-text">
        {{ t('uploader.runtime_reload_needed', { ver: pendingRuntimeVersion }) }}
        <span class="hint">{{ t('uploader.remember_files') }}</span>
      </div>
      <button class="control-button" @click="reloadNow">{{ t('uploader.reload_now') }}</button>
    </div>

    <button
      @click="loadAnimation"
      class="control-button"
      :disabled="!allFilesReady || !!pendingRuntimeUrl"
      :title="
        pendingRuntimeUrl ? t('uploader.runtime_reload_needed', { ver: pendingRuntimeVersion }) : ''
      "
    >
      {{ t('uploader.load') }}
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'

const { t } = useI18n()
const files = ref({
  jsonFile: null,
  skelFile: null,
  bytesFile: null,
  atlasFile: null,
  pngFiles: [],
})
const isDragging = ref(false)
const fileInputRef = ref(null)
const pendingRuntimeUrl = ref(null)
const pendingRuntimeVersion = ref(null)
const postReloadInfo = ref(null)
const loadFormat = ref('json')
const compareMode = ref(false)
const compareLayout = ref('overlay')
const overlayOpacity = ref(0.6)
const jsonTint = ref('#5ad1ff')
const skelTint = ref('#ff8a5b')
const compareMetrics = ref(null)
const compareReport = ref(null)

const skeletonDisplayName = computed(() => {
  const names = []
  if (files.value.jsonFile) names.push(files.value.jsonFile.name)
  if (files.value.skelFile) names.push(files.value.skelFile.name)
  if (files.value.bytesFile) names.push(files.value.bytesFile.name)
  return names.length ? names.join(', ') : null
})

const binaryFile = computed(() => files.value.skelFile || files.value.bytesFile)

const fileStatuses = computed(() => [
  {
    type: 'skeleton',
    label: '.json / .skel / .bytes',
    file: files.value.jsonFile || binaryFile.value,
    name: skeletonDisplayName.value,
    icon: '📄',
  },
  {
    type: 'atlas',
    label: '.atlas / .txt',
    file: files.value.atlasFile,
    name: files.value.atlasFile?.name,
    icon: '🗺️',
  },
  {
    type: 'png',
    label: '.png(s)',
    file: files.value.pngFiles.length > 0,
    name: files.value.pngFiles.length > 0 ? `${files.value.pngFiles.length} image(s)` : null,
    icon: '🖼️',
  },
])

const hasFiles = computed(
  () =>
    files.value.jsonFile ||
    files.value.skelFile ||
    files.value.bytesFile ||
    files.value.atlasFile ||
    files.value.pngFiles.length > 0,
)

const hasSkeleton = computed(() => !!files.value.jsonFile || !!binaryFile.value)
const hasAtlas = computed(() => !!files.value.atlasFile)
const hasPngs = computed(() => files.value.pngFiles.length > 0)
const compareReady = computed(
  () => !!files.value.jsonFile && !!binaryFile.value && hasAtlas.value && hasPngs.value,
)
const allFilesReady = computed(() => {
  if (!hasAtlas.value || !hasPngs.value) return false
  if (compareMode.value) return !!files.value.jsonFile && !!binaryFile.value
  return hasSkeleton.value
})

const showLoadFormatToggle = computed(
  () => !compareMode.value && !!files.value.jsonFile && !!binaryFile.value,
)
const resolvedLoadFormat = computed(() => {
  if (loadFormat.value === 'skel' && binaryFile.value) return 'skel'
  if (loadFormat.value === 'json' && files.value.jsonFile) return 'json'
  if (files.value.jsonFile) return 'json'
  if (binaryFile.value) return 'skel'
  return null
})

const compareLegend = computed(() => {
  if (!compareReady.value) return ''
  return compareLayout.value === 'overlay'
    ? t('uploader.compare_legend_overlay')
    : t('uploader.compare_legend_side_by_side')
})

const formatNameList = (list, max = 6) => {
  if (!list?.length) return t('uploader.compare_none')
  const shown = list.slice(0, max)
  const suffix = list.length > max ? ` +${list.length - max}` : ''
  return `${shown.join(', ')}${suffix}`
}

const formatMetric = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return value.toFixed(2)
}

const compareDiffLines = computed(() => {
  if (!compareReport.value?.diffs?.length) return []
  return compareReport.value.diffs.map((diff) => {
    switch (diff.type) {
      case 'scalar':
        return t('uploader.compare_diff_scalar', {
          label: t(`uploader.compare_labels.${diff.field}`),
          json: diff.json ?? '-',
          skel: diff.skel ?? '-',
        })
      case 'names':
        return t('uploader.compare_diff_names', {
          label: t(`uploader.compare_labels.${diff.field}`),
          json: diff.jsonCount,
          skel: diff.skelCount,
          jsonOnly: formatNameList(diff.jsonOnly),
          skelOnly: formatNameList(diff.skelOnly),
        })
      case 'anim-duration':
        return t('uploader.compare_diff_anim_duration', {
          name: diff.name,
          json: Number.isFinite(diff.json) ? diff.json.toFixed(3) : diff.json,
          skel: Number.isFinite(diff.skel) ? diff.skel.toFixed(3) : diff.skel,
        })
      case 'anim-timelines':
        return t('uploader.compare_diff_anim_timelines', {
          name: diff.name,
          json: diff.json,
          skel: diff.skel,
        })
      case 'anim-timeline-types':
        return t('uploader.compare_diff_anim_timeline_types', {
          name: diff.name,
          jsonOnly: formatNameList(diff.jsonOnly),
          skelOnly: formatNameList(diff.skelOnly),
        })
      case 'skin-attachments':
        return t('uploader.compare_diff_skin_attachments', {
          name: diff.name,
          json: diff.json,
          skel: diff.skel,
          jsonOnly: formatNameList(diff.jsonOnly),
          skelOnly: formatNameList(diff.skelOnly),
        })
      default:
        return JSON.stringify(diff)
    }
  })
})

const triggerFileInput = () => fileInputRef.value?.click()

const processFiles = (fileList) => {
  const newFiles = Array.from(fileList || [])
  const newPngFiles = []
  compareMetrics.value = null
  compareReport.value = null

  for (const file of newFiles) {
    const name = file.name.toLowerCase()
    if (name.endsWith('.json')) {
      files.value.jsonFile = file
      detectRuntimeFromJson(file)
    } else if (name.endsWith('.skel')) {
      files.value.skelFile = file
    } else if (name.endsWith('.bytes')) {
      files.value.bytesFile = file
    } else if (name.endsWith('.atlas') || name.endsWith('.txt')) {
      files.value.atlasFile = file
    } else if (name.endsWith('.png') || name.endsWith('.pma') || name.endsWith('.pma.png')) {
      newPngFiles.push(file)
    }
  }

  if (newPngFiles.length > 0) {
    files.value.pngFiles = newPngFiles
  }
}

const handleFileSelect = (event) => {
  const selectedFiles = event.target.files
  if (selectedFiles?.length) processFiles(selectedFiles)
}

const handleDrop = (event) => {
  isDragging.value = false
  const droppedFiles = event.dataTransfer.files
  if (droppedFiles?.length) processFiles(droppedFiles)
}

const loadAnimation = async () => {
  if (pendingRuntimeUrl.value) {
    alert(t('uploader.runtime_reload_needed', { ver: pendingRuntimeVersion.value }))
    return
  }
  if (!allFilesReady.value) {
    alert(t('uploader.missing_files'))
    return
  }
  const gameScene = phaserStore.gameInstance?.scene.getScene('GameScene')
  if (!gameScene) return

  if (compareMode.value) {
    if (!compareReady.value) {
      alert(t('uploader.compare_requires'))
      return
    }
    if (typeof gameScene.loadAndDisplayCompare !== 'function') {
      alert(t('uploader.compare_unavailable'))
      return
    }
    try {
      const result = await gameScene.loadAndDisplayCompare(files.value, {
        layout: compareLayout.value,
        appearance: {
          overlayOpacity: overlayOpacity.value,
          jsonTint: jsonTint.value,
          skelTint: skelTint.value,
        },
      })
      compareMetrics.value = result?.metrics || gameScene.getCompareMetrics?.() || null
      compareReport.value = result?.report || gameScene.getCompareReport?.() || null
    } catch (e) {
      const msg = e?.message || String(e)
      compareMetrics.value = null
      compareReport.value = null
      alert(t('uploader.compare_failed', { msg }))
    }
    return
  }

  const format = resolvedLoadFormat.value
  if (!format) {
    alert(t('uploader.missing_files'))
    return
  }
  gameScene.loadAndDisplaySpine(files.value, { format })
}

const detectRuntimeFromJson = async (file) => {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const ver =
      typeof parsed?.spine === 'string'
        ? parsed.spine
        : typeof parsed?.skeleton?.spine === 'string'
          ? parsed.skeleton.spine
          : null
    if (!ver) return
    const version = ver.trim()
    phaserStore.setDetectedSpineVersion(version)
    const m = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/)
    let url = null
    if (m) {
      const major = Number(m[1])
      const minor = Number(m[2])
      const patch = Number(m[3] ?? '0')
      let resolved
      if (major === 4 && minor === 1) {
        resolved = '4.1.*'
      } else if (major === 4 && minor === 2) {
        resolved = patch < 65 ? '4.2.65' : `4.2.${patch}`
      } else {
        resolved = `${major}.${minor}${m[3] ? '.' + patch : ''}`
      }
      url = `https://unpkg.com/@esotericsoftware/spine-phaser@${resolved}/dist/iife/spine-phaser.js`
      pendingRuntimeVersion.value = resolved
    }
    pendingRuntimeUrl.value = null
    if (!pendingRuntimeVersion.value) pendingRuntimeVersion.value = null
    if (url) {
      const params = new URLSearchParams(window.location.search)
      const current = params.get('spineVer') || ''
      if (current !== url) {
        pendingRuntimeUrl.value = url
      }
    }
  } catch (e) {
    console.error('Failed to parse JSON for runtime detection.', e)
  }
}

const reloadNow = async () => {
  if (!pendingRuntimeUrl.value) return
  try {
    const bundleId = Date.now().toString()
    const selected = []
    if (files.value.jsonFile) selected.push(files.value.jsonFile)
    if (files.value.skelFile) selected.push(files.value.skelFile)
    if (files.value.bytesFile) selected.push(files.value.bytesFile)
    if (files.value.atlasFile) selected.push(files.value.atlasFile)
    if (files.value.pngFiles?.length) selected.push(...files.value.pngFiles)
    if (selected.length > 0) await saveBundleToIDB(bundleId, selected)
    const names = selected.map((f) => f.name)
    const info = {
      ver: pendingRuntimeVersion.value,
      url: pendingRuntimeUrl.value,
      fileNames: names,
      bundleId,
      ts: Date.now(),
    }
    sessionStorage.setItem('spv.reloadInfo', JSON.stringify(info))
    const params = new URLSearchParams(window.location.search)
    params.set('spineVer', pendingRuntimeUrl.value)
    window.location.href = `${window.location.pathname}?${params.toString()}`
  } catch (e) {
    console.error('Failed to save file bundle before reloading:', e)
    alert(t('uploader.reload_save_failed'))
  }
}

watch(compareLayout, (value) => {
  if (!compareMode.value) return
  const scene = phaserStore.gameInstance?.scene.getScene('GameScene')
  if (scene?.setCompareLayout) {
    scene.setCompareLayout(value)
  }
})

watch([overlayOpacity, jsonTint, skelTint], ([opacity, json, skel]) => {
  if (!compareMode.value) return
  const scene = phaserStore.gameInstance?.scene.getScene('GameScene')
  if (scene?.setCompareAppearance) {
    scene.setCompareAppearance({ overlayOpacity: opacity, jsonTint: json, skelTint: skel })
  }
})

watch(compareMode, (value) => {
  if (!value) {
    compareMetrics.value = null
    compareReport.value = null
  }
})

onMounted(() => {
  try {
    const raw = sessionStorage.getItem('spv.reloadInfo')
    if (raw) {
      const info = JSON.parse(raw)
      postReloadInfo.value = info
      sessionStorage.removeItem('spv.reloadInfo')
      autoReapplyFromBundle()
    }
  } catch (e) {
    console.error('Failed to parse reload info from sessionStorage:', e)
  }
})

let _idb = null
const idbOpen = async () => {
  if (_idb) return _idb
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('spv-db', 2)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('bundles')) db.createObjectStore('bundles')
    }
    req.onsuccess = () => {
      _idb = req.result
      resolve(_idb)
    }
  })
}

const saveBundleToIDB = async (id, fileList) => {
  const payload = await Promise.all(
    fileList.map(async (f) => ({
      name: f.name,
      type: f.type || '',
      lastModified: f.lastModified || Date.now(),
      data: await f.arrayBuffer(),
    })),
  )
  const db = await idbOpen()
  const tx = db.transaction('bundles', 'readwrite')
  const store = tx.objectStore('bundles')
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error || new Error('IDB transaction aborted'))
    tx.onerror = () => reject(tx.error || new Error('IDB transaction error'))
    store.put(payload, id)
  })
}

const loadBundleFromIDB = async (id) => {
  const db = await idbOpen()
  const tx = db.transaction('bundles', 'readonly')
  const store = tx.objectStore('bundles')
  const payload = await new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return payload || null
}

const deleteBundleFromIDB = async (id) => {
  const db = await idbOpen()
  const tx = db.transaction('bundles', 'readwrite')
  const store = tx.objectStore('bundles')
  await new Promise((resolve, reject) => {
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve()
  })
}

const waitForGameReady = async (timeoutMs = 15000) => {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const scene = phaserStore.gameInstance?.scene?.getScene?.('GameScene')
      if (scene && scene.scene.isActive()) return resolve(true)
      if (Date.now() - start > timeoutMs)
        return reject(new Error('Timeout waiting for game scene to be active'))
      setTimeout(tick, 100)
    }
    tick()
  })
}

const autoReapplyFromBundle = async () => {
  if (!postReloadInfo.value?.bundleId) return
  try {
    const bundleId = postReloadInfo.value.bundleId
    const payload = await loadBundleFromIDB(bundleId)
    if (!payload || !payload.length) throw new Error('Bundle not found in IndexedDB')

    const rebuild = payload.map(
      (p) =>
        new File([new Blob([p.data], { type: p.type })], p.name, {
          type: p.type,
          lastModified: p.lastModified,
        }),
    )

    const byExt = (name) => name.toLowerCase().split('.').pop()
    const json = rebuild.find((f) => byExt(f.name) === 'json')
    const skel = rebuild.find((f) => byExt(f.name) === 'skel')
    const bytes = rebuild.find((f) => byExt(f.name) === 'bytes')
    const atlas = rebuild.find((f) => ['atlas', 'txt'].includes(byExt(f.name)))
    const pngs = rebuild.filter((f) => {
      const n = f.name.toLowerCase()
      return n.endsWith('.png') || n.endsWith('.pma') || n.endsWith('.pma.png')
    })
    if ((!json && !skel && !bytes) || !atlas || !pngs.length)
      throw new Error('Missing required files in bundle')

    files.value.jsonFile = json || null
    files.value.skelFile = skel || null
    files.value.bytesFile = bytes || null
    files.value.atlasFile = atlas
    files.value.pngFiles = pngs

    try {
      const originalPendingUrl = pendingRuntimeUrl.value
      pendingRuntimeUrl.value = null
      if (json) await detectRuntimeFromJson(json)
      pendingRuntimeUrl.value = originalPendingUrl
      await waitForGameReady()
      loadAnimation()
      await deleteBundleFromIDB(bundleId)
      postReloadInfo.value = null
    } catch (gameError) {
      console.warn(
        'Auto-reapply failed at game-ready stage, files are populated for manual load.',
        gameError,
      )
    }
  } catch (e) {
    console.error('Error during auto-reapply:', e)
    alert(t('uploader.reapply_failed') + `\n\n${e.message}`)
  }
}
</script>

<style lang="postcss" scoped>
.file-uploader {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.drop-area {
  width: 100%;
  box-sizing: border-box;

  background: var(--color-surface-light);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  padding: 20px;
  text-align: center;
  transition: all 0.2s ease-in-out;
  color: var(--color-text-muted);

  &:hover,
  &.dragging {
    border-color: var(--color-primary);
    background: var(--control-bg-hover);
    transform: scale(1.02);
  }

  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .icon-upload {
      font-size: 2.5rem;
      line-height: 1;
      color: var(--color-primary);
    }

    p {
      margin: 0;
      font-weight: 600;
      color: var(--color-text);
      max-width: 200px;
    }

    .hint {
      font-size: 0.8rem;
    }
  }
}

.status-grid {
  display: grid;
  gap: 10px;
  text-align: left;
  grid-template-columns: minmax(0, 1fr);
}

.file-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-border);
  transition: all 0.2s;

  &.valid {
    border-left-color: var(--color-success);

    .icon-file {
      filter: grayscale(0);
    }

    .name {
      color: var(--color-text);
    }
  }

  .icon-file {
    font-size: 1.8rem;
    line-height: 1;
    flex-shrink: 0;
    filter: grayscale(100%);
    transition: filter 0.2s;
  }

  .info {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    gap: 2px;
  }

  .type {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .name {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text-muted);
  }
}

.format-select,
.compare-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.format-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.toggle-button {
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
  }

  &.active {
    border-color: var(--color-primary);
    background: linear-gradient(145deg, var(--color-primary-light), var(--color-primary));
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.compare-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-text);

  input {
    width: 16px;
    height: 16px;
  }
}

.compare-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.compare-legend {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.compare-metrics {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: 10px 12px;
  font-size: 0.85rem;
}

.compare-metrics-title {
  font-weight: 700;
  margin-bottom: 8px;
}

.compare-metrics-grid {
  display: grid;
  grid-template-columns: 1fr repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  align-items: center;
}

.compare-metrics-header {
  font-weight: 600;
  color: var(--color-text-muted);
}

.compare-metrics-label {
  color: var(--color-text-muted);
}

.compare-metrics-value {
  font-variant-numeric: tabular-nums;
}

.compare-diffs {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: 10px 12px;
  font-size: 0.85rem;
}

.compare-diffs-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.compare-diffs-empty {
  color: var(--color-text-muted);
}

.compare-diffs-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compare-diffs-line {
  color: var(--color-text);
}

.compare-overlay-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .format-label {
    display: flex;
    align-items: center;
    justify-content: space-between;

    span {
      font-weight: 700;
      color: var(--color-primary-light);
      background-color: var(--color-surface);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.85em;
    }
  }

  input[type='range'] {
    margin-top: -2px;
  }
}

.compare-tint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  padding: 6px 8px 6px 12px;
  border-radius: var(--radius-md);

  > label {
    font-weight: 500;
  }

  > input[type='color'] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 32px;
    height: 32px;
    border: none;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
    border-radius: var(--radius-sm);
    overflow: hidden;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: var(--radius-sm);
    }

    &::-moz-color-swatch {
      border: none;
      border-radius: var(--radius-sm);
    }
  }
}

.runtime-reload {
  display: flex;
  gap: 15px;
  align-items: center;
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  padding: 12px;
  font-size: 0.9em;

  .runtime-reload-text {
    flex-grow: 1;
  }

  .hint {
    display: block;
    color: var(--color-text-muted);
    font-size: 0.9em;
    margin-top: 4px;
  }
}

.runtime-detected {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 0.9em;
  text-align: center;
  font-weight: 500;
}
</style>
