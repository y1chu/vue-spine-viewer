import { onMounted, onUnmounted } from 'vue'

const positionCache = new Map()

/**
 * Makes a DOM element draggable.
 * @param {import('vue').Ref<HTMLElement | null>} targetRef - The ref of the element to be dragged.
 * @param {import('vue').Ref<HTMLElement | null>} handleRef - The ref of the element that acts as the drag handle.
 * @param {string} id - A unique identifier to store and retrieve the position.
 */
export function useDraggable(targetRef, handleRef, id) {
  const onMouseDown = (e) => {
    if (e.button !== 0) return // Only react to left-click
    e.preventDefault()

    const target = targetRef.value
    if (!target) return

    const rect = target.getBoundingClientRect()
    const startMouseX = e.clientX
    const startMouseY = e.clientY

    const style = window.getComputedStyle(target)
    const matrix = new DOMMatrixReadOnly(style.transform)
    const startX = matrix.e // Current translateX
    const startY = matrix.f // Current translateY

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startMouseX
      const dy = moveEvent.clientY - startMouseY
      // Calculate the potential new visual position of the top-left corner
      const newLeft = rect.left + dx
      const newTop = rect.top + dy

      // Get viewport dimensions
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Clamp the visual position to keep it within the viewport
      const clampedLeft = Math.max(0, Math.min(newLeft, viewportWidth - rect.width))
      const clampedTop = Math.max(0, Math.min(newTop, viewportHeight - rect.height))

      // Convert the clamped visual position back into a transform value
      const newTx = startX + (clampedLeft - rect.left)
      const newTy = startY + (clampedTop - rect.top)

      target.style.transform = `translate(${newTx}px, ${newTy}px)`
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      // After dragging, save the new position
      if (id) {
        const finalStyle = window.getComputedStyle(target)
        const finalMatrix = new DOMMatrixReadOnly(finalStyle.transform)
        const position = { x: finalMatrix.e, y: finalMatrix.f }

        positionCache.set(id, position)
        try {
          localStorage.setItem(`draggable-pos-${id}`, JSON.stringify(position))
        } catch (error) {
          console.error('Failed to save position to localStorage:', error)
        }
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  onMounted(() => {
    const handle = handleRef.value
    const target = targetRef.value

    if (handle && target) {
      // Restore position on mount
      if (id) {
        let storedPosition = positionCache.get(id)
        if (!storedPosition) {
          try {
            const stored = localStorage.getItem(`draggable-pos-${id}`)
            if (stored) {
              storedPosition = JSON.parse(stored)
              positionCache.set(id, storedPosition)
            }
          } catch (error) {
            console.error('Failed to read position from localStorage:', error)
          }
        }

        if (storedPosition) {
          target.style.transform = `translate(${storedPosition.x}px, ${storedPosition.y}px)`
        }
      }

      handle.style.cursor = 'move'
      handle.addEventListener('mousedown', onMouseDown)
    }
  })

  onUnmounted(() => {
    const handle = handleRef.value
    if (handle) {
      handle.removeEventListener('mousedown', onMouseDown)
    }
  })
}
