<template>
  <div ref="canvasWrapRef" class="canvas-wrap"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasWrapRef = ref(null);
let scene, camera, renderer, animationId;

function init() {
  // ✅ 获取父容器实际尺寸
  const container = canvasWrapRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // 创建相机
  camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
  camera.position.set(0, 150, 300);
  camera.lookAt(0, 0, 0);

  // 创建物体
  const geometry = new THREE.BoxGeometry(50, 50, 50);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // ✅ 创建渲染器时传入父容器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);  // 使用父容器尺寸
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  animate();
}

function animate() {
  animationId = requestAnimationFrame(animate);
  scene.rotation.y += 0.01;
  renderer.render(scene, camera);
}

// ✅ 窗口resize时同步更新canvas尺寸
function onWindowResize() {
  const container = canvasWrapRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // 更新相机
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // ✅ 更新渲染器尺寸（关键！）
  renderer.setSize(width, height);
}

onMounted(() => {
  init();
  window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  cancelAnimationFrame(animationId);
  renderer.dispose();
});
</script>

<style scoped>
.canvas-wrap {
  width: 100%;  /* ✅ 确保父容器占满可用空间 */
  height: 100%;
  overflow: hidden;
}
</style>