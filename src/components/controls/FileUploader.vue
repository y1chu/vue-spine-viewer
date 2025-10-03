<template>
  <div class="file-uploader">
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept=".json,.atlas,.txt,.png,.pma,.pma.png,.mp3,.ogg,.wav,.m4a,.aac"
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
        <span class="hint">Spine JSON / Atlas / PNG / Audio</span>
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'
import { logError } from '@/utils/logError.js'

const { t } = useI18n()
const files = ref({ jsonFile: null, atlasFile: null, pngFiles: [], audioFiles: [] })
const isDragging = ref(false)
const fileInputRef = ref(null)
const pendingRuntimeUrl = ref(null)
const pendingRuntimeVersion = ref(null)
const postReloadInfo = ref(null)

const fileStatuses = computed(() => [
  {
    type: 'json',
    label: '.json',
    file: files.value.jsonFile,
    name: files.value.jsonFile?.name,
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
  {
    type: 'audio',
    label: '.mp3/.ogg/.wav (optional)',
    file: files.value.audioFiles.length > 0,
    name: files.value.audioFiles.length > 0 ? `${files.value.audioFiles.length} audio file(s)` : 'optional',
    icon: '🎵',
  },
])

const hasFiles = computed(
  () => files.value.jsonFile || files.value.atlasFile || files.value.pngFiles.length > 0,
)

const allFilesReady = computed(
  () => !!files.value.jsonFile && !!files.value.atlasFile && files.value.pngFiles.length > 0,
)

const triggerFileInput = () => fileInputRef.value?.click()

const processFiles = (fileList) => {
  const newFiles = Array.from(fileList || [])
  const newPngFiles = []
  const newAudioFiles = []

  for (const file of newFiles) {
    const name = file.name.toLowerCase()
    if (name.endsWith('.json')) {
      files.value.jsonFile = file
      detectRuntimeFromJson(file)
    } else if (name.endsWith('.atlas') || name.endsWith('.txt')) {
      files.value.atlasFile = file
    } else if (name.endsWith('.png') || name.endsWith('.pma') || name.endsWith('.pma.png')) {
      newPngFiles.push(file)
    } else if (
      name.endsWith('.mp3') ||
      name.endsWith('.ogg') ||
      name.endsWith('.wav') ||
      name.endsWith('.m4a') ||
      name.endsWith('.aac')
    ) {
      newAudioFiles.push(file)
    }
  }

  if (newPngFiles.length > 0) {
    files.value.pngFiles = newPngFiles
  }
  if (newAudioFiles.length > 0) {
    files.value.audioFiles = newAudioFiles
  }
  try {
    phaserStore.setHasAudio(files.value.audioFiles?.length > 0)
  } catch (err) {
    logError('FileUploader.processFiles: update hasAudio', err)
  }
  if (newAudioFiles.length > 0) {
    files.value.audioFiles = newAudioFiles
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

const loadAnimation = () => {
  if (pendingRuntimeUrl.value) {
    alert(t('uploader.runtime_reload_needed', { ver: pendingRuntimeVersion.value }))
    return
  }
  if (!files.value.jsonFile || !files.value.atlasFile || !files.value.pngFiles?.length) {
    alert(t('uploader.missing_files'))
    return
  }
  const gameScene = phaserStore.gameInstance?.scene.getScene('GameScene')
  if (gameScene) gameScene.loadAndDisplaySpine(files.value)
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
    if (files.value.atlasFile) selected.push(files.value.atlasFile)
    if (files.value.pngFiles?.length) selected.push(...files.value.pngFiles)
    if (files.value.audioFiles?.length) selected.push(...files.value.audioFiles)
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
    const atlas = rebuild.find((f) => ['atlas', 'txt'].includes(byExt(f.name)))
    const pngs = rebuild.filter((f) => {
      const n = f.name.toLowerCase()
      return n.endsWith('.png') || n.endsWith('.pma') || n.endsWith('.pma.png')
    })
    const audios = rebuild.filter((f) => {
      const n = f.name.toLowerCase()
      return (
        n.endsWith('.mp3') ||
        n.endsWith('.ogg') ||
        n.endsWith('.wav') ||
        n.endsWith('.m4a') ||
        n.endsWith('.aac')
      )
    })
    if (!json || !atlas || !pngs.length) throw new Error('Missing required files in bundle')

    files.value.jsonFile = json
    files.value.atlasFile = atlas
    files.value.pngFiles = pngs
    files.value.audioFiles = audios
    try {
      phaserStore.setHasAudio(files.value.audioFiles?.length > 0)
    } catch (err) {
      logError('FileUploader.autoReapplyFromBundle: update hasAudio', err)
    }

    try {
      const originalPendingUrl = pendingRuntimeUrl.value
      pendingRuntimeUrl.value = null
      await detectRuntimeFromJson(json)
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
