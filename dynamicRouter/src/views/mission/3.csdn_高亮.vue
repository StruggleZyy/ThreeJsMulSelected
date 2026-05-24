<template>
  <div ref="container" style="width:100vw;height:100vh;"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)

let scene, camera, renderer, controls
let isCtrlDown = false
let selectArea = null
let objects = []
// 原始模型线框缓存
const originalEdges = new WeakMap()
// 描边高亮材质（只做外轮廓）
const outlineMaterial = new THREE.LineBasicMaterial({
  color: 0x00ff00,
  linewidth: 2
})

onMounted(() => {
  init()
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x111111)

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(8, 8, 12)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // 灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 5)
  scene.add(ambientLight, dirLight)

  createCubes()
  initSelectArea()
  bindEvents()
  animate()
}

// 创建测试模型 + 为每个模型生成独立的描边线框（不修改模型本身）
function createCubes() {
  for (let x = -4; x <= 4; x += 2) {
    for (let z = -4; z <= 4; z += 2) {
      const geo = new THREE.BoxGeometry(1, 1, 1)
      const mat = new THREE.MeshStandardMaterial({ color: 0x4488ff })
      const cube = new THREE.Mesh(geo, mat)
      cube.position.set(x, 0.5, z)
      scene.add(cube)
      objects.push(cube)

      // 为模型创建独立的线框，不修改模型材质
      const edges = new THREE.EdgesGeometry(geo)
      const line = new THREE.LineSegments(edges, outlineMaterial)
      line.visible = false
      cube.add(line) // 线框作为子物体，随模型一起移动
      originalEdges.set(cube, line)
    }
  }
}

// 3D框选核心类（纯Three.js实现，无DOM）
class SelectArea3D {
  constructor(camera, controls) {
    this.camera = camera
    this.controls = controls
    this.start = new THREE.Vector2()
    this.end = new THREE.Vector2()
    this.drawing = false
  }

  startSelect(e) {
    this.drawing = true
    this.controls.enabled = false
    this.start.set(e.clientX, e.clientY)
    this.end.copy(this.start)
  }

  move(e) {
    if (!this.drawing) return
    this.end.set(e.clientX, e.clientY)
  }

  endSelect() {
    this.drawing = false
    this.controls.enabled = true
    return this.getSelectedObjects()
  }

  getSelectedObjects() {
    const selected = []
    const rect = renderer.domElement.getBoundingClientRect()
    const minX = Math.min(this.start.x, this.end.x)
    const maxX = Math.max(this.start.x, this.end.x)
    const minY = Math.min(this.start.y, this.end.y)
    const maxY = Math.max(this.start.y, this.end.y)

    objects.forEach(obj => {
      const screenPos = obj.position.clone().project(this.camera)
      const sx = (screenPos.x + 1) / 2 * rect.width + rect.left
      const sy = (-screenPos.y + 1) / 2 * rect.height + rect.top

      if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
        selected.push(obj)
      }
    })
    return selected
  }
}

function initSelectArea() {
  selectArea = new SelectArea3D(camera, controls)
}

function bindEvents() {
  // Ctrl键控制框选模式
  window.addEventListener('keydown', e => {
    if (e.key === 'Control') {
      isCtrlDown = true
    }
  })
  window.addEventListener('keyup', e => {
    if (e.key === 'Control') {
      isCtrlDown = false
    }
  })

  // 鼠标事件
  window.addEventListener('mousedown', e => {
    if (!isCtrlDown || e.button !== 0) return
    selectArea.startSelect(e)
  })

  window.addEventListener('mousemove', e => {
    selectArea.move(e)
  })

  window.addEventListener('mouseup', () => {
    const selected = selectArea.endSelect()
    // 1. 先隐藏所有描边
    objects.forEach(obj => {
      const edge = originalEdges.get(obj)
      if (edge) edge.visible = false
    })
    // 2. 只显示选中模型的描边
    selected.forEach(obj => {
      const edge = originalEdges.get(obj)
      if (edge) edge.visible = true
    })
  })

  // 窗口适配
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

onUnmounted(() => {
  renderer.dispose()
})
</script>

<style scoped>
* { margin: 0; padding: 0; }
</style>