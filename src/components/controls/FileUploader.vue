<template>
  <div class="upload-section">
    <label>{{ t('uploader.title') }}</label>

    <div class="drop-area" :class="{ dragging: isDragging }" @click="triggerFileInput"
      @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop">
      {{ t('uploader.drag_or_click_hint') }}
    </div>
    <input ref="fileInputRef" type="file" multiple accept=".json,.atlas,.txt,.png,.pma,.pma.png" style="display: none"
      @change="handleFileSelect" />

    <label for="json-upload" class="control-button file-label">
      <span class="file-button-text">{{ t('uploader.select_json') }}</span>
      <span class="file-name-display">{{ jsonFileName }}</span>
    </label>
    <input id="json-upload" type="file" accept=".json" @change="handleFileChange($event, 'json')"
      style="display: none" />

    <label for="atlas-upload" class="control-button file-label">
      <span class="file-button-text">{{ t('uploader.select_atlas') }}</span>
      <span class="file-name-display">{{ atlasFileName }}</span>
    </label>
    <input id="atlas-upload" type="file" accept=".atlas,.txt" @change="handleFileChange($event, 'atlas')"
      style="display: none" />

    <label for="png-upload" class="control-button file-label">
      <span class="file-button-text">{{ t('uploader.select_png') }}</span>
      <span class="file-name-display">{{ pngFileName }}</span>
    </label>
    <input id="png-upload" type="file" accept=".png,.pma,.pma.png" multiple @change="handleFileChange($event, 'png')"
      style="display: none" />

    <div class="runtime-detected" v-if="detectedSpineVersion">
      {{ t('uploader.detected_runtime', { ver: detectedSpineVersion }) }}
    </div>

    <div v-if="pendingRuntimeUrl" class="runtime-reload">
      <div class="runtime-reload-text">
        {{ t('uploader.runtime_reload_needed', { ver: pendingRuntimeVersion }) }}
        <span class="hint">{{ t('uploader.remember_files') }}</span>
      </div>
      <button class="control-button" @click="reloadNow">{{ t('uploader.reload_now') }}</button>
    </div>

    <div v-if="postReloadInfo" class="post-reload-tip">
      <div class="title">{{ t('uploader.after_reload_reselect') }}</div>
      <ul>
        <li v-for="name in postReloadInfo.fileNames" :key="name">{{ name }}</li>
      </ul>
      <div class="actions">
        <button class="control-button" :disabled="autoReapplying" @click="autoReapplyFromBundle">
          {{ autoReapplying ? t('uploader.reapply_loading') : t('uploader.reapply_auto') }}
        </button>
        <button class="control-button" @click="copyNames">{{ copyLabel }}</button>
        <button class="control-button" @click="dismissPostReload">{{ t('uploader.dismiss') }}</button>
      </div>
      <div v-if="autoReapplyError" class="error">{{ autoReapplyError }}</div>
    </div>

    <button
      @click="loadAnimation"
      class="control-button load-button"
      :disabled="Boolean(pendingRuntimeUrl)"
      :title="pendingRuntimeUrl ? t('uploader.runtime_reload_needed', { ver: pendingRuntimeVersion }) : ''"
    >
      {{ t('uploader.load') }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { phaserStore } from '@/store/phaserStore.js'

// ... (t, files, isDragging, etc. remain the same) ...

const { t } = useI18n()

const files = ref({
  jsonFile: null,
  atlasFile: null,
  pngFiles: null,
})

const isDragging = ref(false)
const fileInputRef = ref(null)

const jsonFileName = computed(() => files.value.jsonFile?.name || '')
const atlasFileName = computed(() => files.value.atlasFile?.name || '')
const pngFileName = computed(() => {
  if (!files.value.pngFiles || files.value.pngFiles.length === 0) return ''
  if (files.value.pngFiles.length === 1) return files.value.pngFiles[0].name
  return `${files.value.pngFiles.length} images selected`
})

const detectedSpineVersion = computed(() => phaserStore.detectedSpineVersion)

// Runtime reload helpers
const pendingRuntimeUrl = ref(null)
const pendingRuntimeVersion = ref(null)
const postReloadInfo = ref(null)
const copyLabel = ref('Copy list')
const autoReapplying = ref(false)
const autoReapplyError = ref('')

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const processFiles = (fileList) => {
  files.value.jsonFile = null
  files.value.atlasFile = null
  files.value.pngFiles = []

  const newFiles = Array.from(fileList)

  for (const file of newFiles) {
    const name = file.name.toLowerCase()
    if (name.endsWith('.json')) {
      files.value.jsonFile = file
      detectRuntimeFromJson(file)
    } else if (name.endsWith('.atlas') || name.endsWith('.txt')) {
      files.value.atlasFile = file
    } else if (name.endsWith('.png') || name.endsWith('.pma') || name.endsWith('.pma.png')) {
      files.value.pngFiles.push(file)
    }
  }
}

const handleFileSelect = (event) => {
  const selectedFiles = event.target.files
  if (selectedFiles?.length) {
    processFiles(selectedFiles)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const droppedFiles = event.dataTransfer.files
  if (droppedFiles?.length) {
    processFiles(droppedFiles)
  }
}

const handleFileChange = (event, type) => {
  const fileList = event.target.files
  if (!fileList || fileList.length === 0) return

  if (type === 'json') {
    files.value.jsonFile = fileList[0]
    detectRuntimeFromJson(fileList[0])
  }
  if (type === 'atlas') files.value.atlasFile = fileList[0]
  if (type === 'png') files.value.pngFiles = Array.from(fileList)
}

const loadAnimation = () => {
  // Prevent loading when a runtime mismatch has been detected.
  // Users must reload to switch the Spine runtime version.
  if (pendingRuntimeUrl.value) {
    alert(t('uploader.runtime_reload_needed', { ver: pendingRuntimeVersion.value }))
    return
  }
  if (!files.value.jsonFile || !files.value.atlasFile || !files.value.pngFiles?.length) {
    alert(t('uploader.missing_files'))
    return
  }
  const gameScene = phaserStore.gameInstance?.scene.getScene('GameScene')
  if (gameScene) {
    gameScene.loadAndDisplaySpine(files.value)
  }
}

const detectRuntimeFromJson = async (file) => {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const ver = typeof parsed?.spine === 'string'
      ? parsed.spine
      : typeof parsed?.skeleton?.spine === 'string'
        ? parsed.skeleton.spine
        : null
    if (!ver) return

    const version = ver.trim()
    phaserStore.setDetectedSpineVersion(version)
    // 4.1 -> wildcards; 4.2 -> exact
    const m = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/)
    let url = null
    if (m) {
      const major = m[1]
      const minor = m[2]
      const captured = m[0]
      if (major === '4' && minor === '1') {
        url = `https://unpkg.com/@esotericsoftware/spine-phaser@${major}.${minor}.*/dist/iife/spine-phaser.js`
      } else {
        url = `https://unpkg.com/@esotericsoftware/spine-phaser@${captured}/dist/iife/spine-phaser.js`
      }
    }
    // Reset any prior pending state; set again only if mismatch
    pendingRuntimeUrl.value = null
    pendingRuntimeVersion.value = null
    // Suggest page reload to switch runtime
    if (url) {
      const params = new URLSearchParams(window.location.search)
      const current = params.get('spineVer') || ''
      if (current !== url) {
        pendingRuntimeUrl.value = url
        pendingRuntimeVersion.value = version
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

    // *** FIX: Await the save operation and log errors ***
    if (selected.length > 0) {
      await saveBundleToIDB(bundleId, selected)
    }

    const names = selected.map((f) => f.name)
    const info = {
      ver: pendingRuntimeVersion.value,
      url: pendingRuntimeUrl.value,
      fileNames: names,
      bundleId,
      ts: Date.now(),
    }
    sessionStorage.setItem('spv.reloadInfo', JSON.stringify(info))

    // *** FIX: Only navigate AFTER successful save ***
    const params = new URLSearchParams(window.location.search)
    params.set('spineVer', pendingRuntimeUrl.value)
    window.location.href = `${window.location.pathname}?${params.toString()}`

  } catch (e) {
    // *** FIX: Add proper error handling ***
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
      // Attempt auto reapply immediately
      autoReapplyFromBundle()
    }
  } catch { }
})

const dismissPostReload = () => {
  postReloadInfo.value = null
}

const copyNames = async () => {
  if (!postReloadInfo.value?.fileNames?.length) return
  try {
    await navigator.clipboard.writeText(postReloadInfo.value.fileNames.join('\n'))
    copyLabel.value = t('uploader.copied')
    setTimeout(() => (copyLabel.value = 'Copy list'), 1500)
  } catch { }
}

let _idb = null
const idbOpen = async () => {
  if (_idb) return _idb
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('spv-db', 2)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = (event) => {
      const db = event.target.result
      // *** FIX: More robust object store creation ***
      if (!db.objectStoreNames.contains('bundles')) {
        db.createObjectStore('bundles')
      }
    }
    req.onsuccess = () => {
      _idb = req.result
      resolve(_idb)
    }
  })
}

// ... (saveBundleToIDB and other IDB functions are correct as you wrote them) ...
const saveBundleToIDB = async (id, fileList) => {
  // Step 1: Prepare the entire payload *before* opening the transaction.
  // This is the key change.
  const payload = await Promise.all(
    fileList.map(async (f) => ({
      name: f.name,
      type: f.type || '',
      lastModified: f.lastModified || Date.now(),
      data: await f.arrayBuffer(),
    })),
  )

  // Step 2: Now that the data is ready, open the DB and start the transaction.
  const db = await idbOpen()
  const tx = db.transaction('bundles', 'readwrite')
  const store = tx.objectStore('bundles')

  // Step 3: Execute the 'put' request and wait for the transaction to complete.
  return new Promise((resolve, reject) => {
    // Set up transaction completion handlers first
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error || new Error('IDB transaction aborted'))
    tx.onerror = () => reject(tx.error || new Error('IDB transaction error'))

    // Now make the request
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
  await new Promise((resolve) => { tx.oncomplete = () => resolve() })
}

const waitForGameReady = async (timeoutMs = 15000) => {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const scene = phaserStore.gameInstance?.scene?.getScene?.('GameScene')
      if (scene && scene.scene.isActive()) return resolve(true)
      if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for game scene to be active'))
      setTimeout(tick, 100)
    }
    tick()
  })
}

const autoReapplyFromBundle = async () => {
  autoReapplyError.value = ''
  if (!postReloadInfo.value?.bundleId) return
  try {
    autoReapplying.value = true
    const bundleId = postReloadInfo.value.bundleId
    const payload = await loadBundleFromIDB(bundleId)
    if (!payload || !payload.length) throw new Error('Bundle not found in IndexedDB')

    const rebuild = payload.map((p) => new File([new Blob([p.data], { type: p.type })], p.name, { type: p.type, lastModified: p.lastModified }))
    const byExt = (name) => name.toLowerCase().split('.').pop()
    const json = rebuild.find((f) => byExt(f.name) === 'json')
    const atlas = rebuild.find((f) => ['atlas', 'txt'].includes(byExt(f.name)))
    const pngs = rebuild.filter((f) => {
      const n = f.name.toLowerCase()
      return n.endsWith('.png') || n.endsWith('.pma') || n.endsWith('.pma.png')
    })
    if (!json || !atlas || !pngs.length) throw new Error('Missing required files in bundle')

    files.value.jsonFile = json
    files.value.atlasFile = atlas
    files.value.pngFiles = pngs

    try {
      // Temporarily clear the pending URL to prevent detectRuntimeFromJson from re-triggering a reload prompt
      const originalPendingUrl = pendingRuntimeUrl.value
      pendingRuntimeUrl.value = null
      await detectRuntimeFromJson(json)
      pendingRuntimeUrl.value = originalPendingUrl

      await waitForGameReady()
      loadAnimation()
      await deleteBundleFromIDB(bundleId)
      postReloadInfo.value = null
    } catch (gameError) {
      console.warn('Auto-reapply failed at game-ready stage, files are populated for manual load.', gameError)
    }
    autoReapplying.value = false
  } catch (e) {
    autoReapplying.value = false
    autoReapplyError.value = t('uploader.reapply_failed') + `: ${e.message}`
    console.error('Error during auto-reapply:', e)
  }
}
</script>

<style lang="postcss" scoped>
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 15px;

  &>label {
    color: var(--color-white);
    font-size: 1.1em;
    font-weight: 600;
  }
}

.drop-area {
  background: var(--color-section);
  border: 2px dashed var(--color-gray-dark);
  border-radius: 8px;
  cursor: pointer;
  padding: 20px;
  text-align: center;
  transition:
    background 0.2s,
    border-color 0.2s;

  &.dragging {
    background: var(--color-gray-dark);
    border-color: var(--color-red);
  }
}

.file-label {
  align-items: center;
  background: var(--color-section);
  border: 2px dashed var(--color-gray-dark);
  display: flex;
  flex-direction: column;
  padding: 10px;

  &:hover {
    background: var(--color-gray-dark);
    border-color: var(--color-red);
  }
}

.file-button-text {
  font-weight: 600;
  pointer-events: none;
}

.file-name-display {
  color: var(--color-red-light);
  font-size: 0.8em;
  font-weight: 400;
  height: 1.2em;
  margin-top: 5px;
  max-width: 100%;
  overflow: hidden;
  pointer-events: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-detected {
  background: var(--color-gray-dark);
  border: 1px solid var(--color-gray);
  color: var(--color-white);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.9em;
}

.runtime-reload {
  display: flex;
  gap: 10px;
  align-items: center;
  background: var(--color-section);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 10px;
}

.runtime-reload .hint {
  color: var(--color-gray);
  font-size: 0.85em;
}

.post-reload-tip {
  background: var(--color-section);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
}

.post-reload-tip .title {
  font-weight: 600;
  margin-bottom: 6px;
}

.post-reload-tip ul {
  margin: 6px 0 10px 16px;
}

.post-reload-tip .actions {
  display: flex;
  gap: 8px;
}
</style>
