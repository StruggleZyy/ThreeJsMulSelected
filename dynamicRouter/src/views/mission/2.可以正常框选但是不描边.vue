<template>
  <div id="app">
    <div ref="threeContainer" class="three-container"></div>

    <!-- DOM框选 -->
    <div
      v-if="isDragging"
      class="selection-box"
      :style="{
        left: selectionRect.left + 'px',
        top: selectionRect.top + 'px',
        width: selectionRect.width + 'px',
        height: selectionRect.height + 'px',
      }"
    ></div>

    <div id="selected-info" v-if="selectedObjects.length > 0">
      <p>选中的模型数量: {{ selectedObjects.length }}</p>
      <ul>
        <li v-for="(object, index) in selectedObjects" :key="index">{{ object.name }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

const threeContainer = ref(null);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  10000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const selectedObjects = ref([]);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// ====================
// ✅ 固定加入 outlinePass（只加一次）
// ====================
const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.visibleEdgeColor.set(0x00ff00);
outlinePass.edgeThickness = 2;
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 0.0;

composer.addPass(outlinePass);
outlinePass.enabled = false;

const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const selectionRect = ref({ left: 0, top: 0, width: 0, height: 0 });

// 模型加载
const loader = new FBXLoader();
const modelUrls = [
  '/static/model/01.fbx',
  '/static/model/02.fbx',
  '/static/model/03.fbx',
];
const modelPositions = [
  { x: 0, y: 0, z: 0 },
  { x: 500, y: 2, z: -2 },
  { x: -500, y: -1, z: 3 },
];

modelUrls.forEach((url, index) => {
  loader.load(
    url,
    (object) => {
      const pos = modelPositions[index];
      object.position.set(pos.x, pos.y, pos.z);
      scene.add(object);
    },
    undefined,
    (err) => console.error('模型加载失败', err)
  );
});

camera.position.set(0, 0, 1000);
renderer.setSize(window.innerWidth, window.innerHeight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(ambientLight, directionalLight);

const animate = () => {
  requestAnimationFrame(animate);
  composer.render();
};

const onMouseDown = (e) => {
  if (e.button !== 0) return;
  isDragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  selectionRect.value = { left: e.clientX, top: e.clientY, width: 0, height: 0 };
};

const onMouseMove = (e) => {
  if (!isDragging.value) return;
  const currentX = e.clientX;
  const currentY = e.clientY;
  const left = Math.min(startX.value, currentX);
  const top = Math.min(startY.value, currentY);
  const width = Math.abs(currentX - startX.value);
  const height = Math.abs(currentY - startY.value);
  selectionRect.value = { left, top, width, height };
};

// ==============================
// ✅ 核心修复：高亮一直显示
// ==============================
const onMouseUp = (e) => {
  if (!isDragging.value) return;
  isDragging.value = false;

  const minX = selectionRect.value.left;
  const maxX = minX + selectionRect.value.width;
  const minY = selectionRect.value.top;
  const maxY = minY + selectionRect.value.height;

  selectedObjects.value = [];

  scene.traverse((object) => {
    if (object.isMesh) {
      const v = new THREE.Vector3();
      object.getWorldPosition(v);
      v.project(camera);
      const screenX = (v.x + 1) / 2 * renderer.domElement.clientWidth;
      const screenY = (1 - v.y) / 2 * renderer.domElement.clientHeight;
      if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
        selectedObjects.value.push(object);
      }
    }
  });

  // ========== 关键：只控制 enabled，不增删 Pass ==========
  if (selectedObjects.value.length > 0) {
    outlinePass.selectedObjects = selectedObjects.value;
    // outlinePass.enabled = true;
  } else {
    outlinePass.selectedObjects = [];
    // outlinePass.enabled = false;
  }
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  outlinePass.setSize(new THREE.Vector2(window.innerWidth, window.innerHeight));
  composer.setSize(window.innerWidth, window.innerHeight);
};

onMounted(() => {
  threeContainer.value.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  renderer.domElement.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  renderer.dispose();
});
</script>

<style scoped>
.three-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
}
.selection-box {
  position: fixed;
  z-index: 9999;
  border: 2px solid #00ff00;
  background: transparent;
  pointer-events: none;
}
#selected-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255,255,255,0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 100;
}
</style>