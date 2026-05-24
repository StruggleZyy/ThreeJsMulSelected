<template>
  <div id="app">
    <div ref="threeContainer" class="three-container"></div>

    <!-- DOM框选（拖动时显示） -->
    <div
      v-if="isDragging && selectionRect.width > 0 && selectionRect.height > 0"
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
        <li v-for="(object, index) in selectedObjects" :key="index">{{ object.name || `模型${index+1}` }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

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
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const selectionRect = ref({ left: 0, top: 0, width: 0, height: 0 });

// ====================
// 模型描边专用（不模糊、不修改原模型）
// ====================
const edgeMaterial = new THREE.LineBasicMaterial({
  color: 0x00ff00,
  linewidth: 2, // 注意：linewidth 在 WebGL 中可能不支持所有系统，但效果还可以
});
const modelEdgeMap = new WeakMap(); // 存储每个模型的描边

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

// 存储所有模型对象
const allModels = [];

modelUrls.forEach((url, index) => {
  loader.load(
    url,
    (object) => {
      const pos = modelPositions[index];
      object.position.set(pos.x, pos.y, pos.z);
      object.name = `模型${index + 1}`;
      scene.add(object);
      allModels.push(object);

      // 给模型自动创建描边（默认隐藏）
      object.traverse((child) => {
        if (child.isMesh) {
          const edges = new THREE.EdgesGeometry(child.geometry);
          const line = new THREE.LineSegments(edges, edgeMaterial);
          line.visible = false;
          child.add(line);
          modelEdgeMap.set(child, line);
        }
      });
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

// 可选：添加辅助网格，方便观察
const gridHelper = new THREE.GridHelper(2000, 20, 0x888888, 0x444444);
scene.add(gridHelper);

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
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
// 鼠标抬起：只高亮模型，不显示框
// ==============================
const onMouseUp = (e) => {
  if (!isDragging.value) return;
  
  // 如果框选范围太小（比如只是点击），可以不处理
  const isSignificantDrag = selectionRect.value.width > 5 && selectionRect.value.height > 5;
  
  if (isSignificantDrag) {
    const minX = selectionRect.value.left;
    const maxX = minX + selectionRect.value.width;
    const minY = selectionRect.value.top;
    const maxY = minY + selectionRect.value.height;

    // 先隐藏所有描边
    selectedObjects.value.forEach((obj) => {
      const line = modelEdgeMap.get(obj);
      if (line) line.visible = false;
    });

    selectedObjects.value = [];

    // 遍历所有网格物体
    scene.traverse((object) => {
      if (object.isMesh && !object.isLineSegments) { // 排除描边线段
        // 获取物体在屏幕上的位置
        const worldPos = new THREE.Vector3();
        object.getWorldPosition(worldPos);
        worldPos.project(camera);
        
        // 转换到屏幕坐标
        const screenX = (worldPos.x + 1) / 2 * renderer.domElement.clientWidth;
        const screenY = (1 - worldPos.y) / 2 * renderer.domElement.clientHeight;

        // 检查是否在框选范围内
        if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
          selectedObjects.value.push(object);
        }
      }
    });

    // 只显示选中模型的描边
    selectedObjects.value.forEach((obj) => {
      const line = modelEdgeMap.get(obj);
      if (line) line.visible = true;
    });
  }
  
  // 重置拖拽状态，绿色框会自动消失（因为 v-if 条件为 false）
  isDragging.value = false;
  selectionRect.value = { left: 0, top: 0, width: 0, height: 0 };
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
  border: 2px solid #00ff00;
  background: rgba(0, 255, 0, 0.1); /* 添加半透明填充，让框选更直观 */
  z-index: 9999;
  pointer-events: none; /* 让框选不干扰鼠标事件 */
}
#selected-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255,255,255,0.9);
  padding: 10px;
  border-radius: 5px;
  z-index: 100;
  font-size: 14px;
  pointer-events: none; /* 避免遮挡点击 */
}
</style>