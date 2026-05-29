import { ref, reactive } from 'vue'

const viewer = reactive({
  open: false,
  src: '',
  scale: 1,
  fitScale: 1,
  x: 0,
  y: 0,
  dragging: false,
  _dragStart: { x: 0, y: 0 },
  _posStart: { x: 0, y: 0 },
})
const viewerEl = ref(null)

export function openViewerFromSrc(src) {
  if (!src) return
  const img = new Image()
  img.onload = () => {
    const pad = 48
    const fitScale = Math.min(
      (window.innerWidth  - pad) / img.naturalWidth,
      (window.innerHeight - pad) / img.naturalHeight,
      1,
    )
    viewer.src = src
    viewer.fitScale = fitScale
    viewer.scale = fitScale
    viewer.x = 0
    viewer.y = 0
    viewer.dragging = false
    viewer.open = true
  }
  img.src = src
}

function onViewerWheel(evt) {
  evt.preventDefault()
  const rect = viewerEl.value.getBoundingClientRect()
  const mx = evt.clientX - rect.left - rect.width / 2
  const my = evt.clientY - rect.top - rect.height / 2
  const factor = evt.deltaY < 0 ? 1.12 : 1 / 1.12
  const newScale = Math.max(0.1, Math.min(40, viewer.scale * factor))
  const ratio = newScale / viewer.scale
  viewer.x = mx * (1 - ratio) + viewer.x * ratio
  viewer.y = my * (1 - ratio) + viewer.y * ratio
  viewer.scale = newScale
}

function onViewerMouseDown(evt) {
  if (evt.button !== 0) return
  viewer.dragging = true
  viewer._dragStart = { x: evt.clientX, y: evt.clientY }
  viewer._posStart = { x: viewer.x, y: viewer.y }
}

function onViewerMouseMove(evt) {
  if (!viewer.dragging) return
  viewer.x = viewer._posStart.x + evt.clientX - viewer._dragStart.x
  viewer.y = viewer._posStart.y + evt.clientY - viewer._dragStart.y
}

function onViewerMouseUp() {
  viewer.dragging = false
}

function onViewerDblClick() {
  viewer.scale = viewer.fitScale
  viewer.x = 0
  viewer.y = 0
}

function onViewerMounted(el) {
  if (!el) return
  el.addEventListener('wheel', onViewerWheel, { passive: false })
}

export function useViewer() {
  return {
    viewer, viewerEl,
    openViewerFromSrc,
    onViewerMouseDown, onViewerMouseMove, onViewerMouseUp,
    onViewerDblClick, onViewerMounted,
  }
}
