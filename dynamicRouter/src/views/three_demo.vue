<template>
  <div id="app">
    <div ref="threeContainer" class="three-container"></div>
    <!-- 框选矩形 -->
    <div 
      v-if="isDragging" 
      class="selection-box"
      :style="selectionBoxStyle"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

const threeContainer = ref(null);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
// 1. 先创建渲染器，不直接设置尺寸
const renderer = new THREE.WebGLRenderer({ antialias: true });
const selectedObjects = ref([]);

// 框选状态
const isDragging = ref(false);
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// 计算框选矩形样式
const selectionBoxStyle = computed(() => {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`
  };
});

// 加载 FBX 模型
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
  loader.load(url, (object) => {
    const { x, y, z } = modelPositions[index];
    object.position.set(x, y, z);
    scene.add(object);
  }, undefined, (error) => {
    console.error('模型加载出错:', error);
  });
});

// 设置场景、相机和渲染器
camera.position.set(0, 0, 1000);
// 2. 关键修复：先设置像素比，再设置尺寸
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// 光照设置
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// 3. 后期处理必须在 setSize 和 setPixelRatio 之后初始化
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);

// 初始化 OutlinePass
outlinePass.visibleEdgeColor.set(0xff0000);
outlinePass.hiddenEdgeColor.set(0x000000);
outlinePass.edgeThickness = 2;
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 0.5;
composer.addPass(renderPass);
composer.addPass(outlinePass);

// 动画循环 - 使用 composer.render()
const animate = () => {
  requestAnimationFrame(animate);
  composer.render(); // 使用 composer 渲染以支持描边效果
};

// 检查点是否在矩形内
const isPointInRect = (pointX, pointY, rectLeft, rectTop, rectWidth, rectHeight) => {
  return pointX >= rectLeft && pointX <= rectLeft + rectWidth &&
         pointY >= rectTop && pointY <= rectTop + rectHeight;
};

// 鼠标按下事件
const onMouseDown = (event) => {
  isDragging.value = true;
  startX = event.clientX;
  startY = event.clientY;
  currentX = startX;
  currentY = startY;
};

// 鼠标移动事件
const onMouseMove = (event) => {
  if (isDragging.value) {
    currentX = event.clientX;
    currentY = event.clientY;
  }
};

// 鼠标松开事件
const onMouseUp = (event) => {
  if (isDragging.value) {
    isDragging.value = false;
    
    const rectLeft = Math.min(startX, currentX);
    const rectTop = Math.min(startY, currentY);
    const rectWidth = Math.abs(currentX - startX);
    const rectHeight = Math.abs(currentY - startY);
    
    // 忽略太小的拖拽（视为点击）
    const minDragSize = 5;
    if (rectWidth < minDragSize && rectHeight < minDragSize) {
      // 点击操作 - 可以添加单点选择逻辑
      return;
    }
    
    // 执行框选
    selectedObjects.value = [];
    
    scene.traverse((object) => {
      if (object.isMesh) {
        // 获取对象在屏幕上的位置
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(object.matrixWorld);
        vector.project(camera);
        
        const screenX = (vector.x + 1) * renderer.domElement.clientWidth / 2;
        const screenY = (-vector.y + 1) * renderer.domElement.clientHeight / 2;
        
        // 检查是否在框选区域内
        if (isPointInRect(screenX, screenY, rectLeft, rectTop, rectWidth, rectHeight)) {
          selectedObjects.value.push(object);
        }
      }
    });
    
    // 更新描边
    outlinePass.selectedObjects = selectedObjects.value;
    console.log('选中对象:', selectedObjects.value.map(obj => obj.name));
  }
};

// 窗口大小改变事件 - 同步更新 composer 和 outlinePass
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  outlinePass.setSize(new THREE.Vector2(window.innerWidth, window.innerHeight));
};

onMounted(() => {
  threeContainer.value.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);
  renderer.domElement.addEventListener('mouseleave', () => {
    if (isDragging.value) {
      isDragging.value = false;
    }
  });
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  renderer.domElement.removeEventListener('mousedown', onMouseDown);
  renderer.domElement.removeEventListener('mousemove', onMouseMove);
  renderer.domElement.removeEventListener('mouseup', onMouseUp);
  renderer.dispose();
  composer.dispose();
});
</script>

<style scoped>
.three-container {
  width: 90vw;
  height: 100vh;
  position: relative;
}

/* 框选矩形样式 */
.selection-box {
  position: fixed;
  border: 2px dashed #00ff00;
  background-color: rgba(0, 255, 0, 0.1);
  pointer-events: none;
  z-index: 1000;
}

#selected-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-size: 14px;
}

#selected-info p {
  margin: 0 0 8px 0;
  font-weight: bold;
  color: #333;
}

#selected-info ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

#selected-info li {
  margin: 4px 0;
}
</style>