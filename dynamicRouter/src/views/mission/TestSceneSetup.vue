<template>
  <div class="app">
    <div ref="canvasRef" class="canvas-wrap"></div>

    <!-- 📌 添加选中测点信息显示 -->
    <div
      class="ceDianInfo"
      v-for="(cedian, index) in selectedPoints"
      :key="index"
      
    >
      <div>测点名称: {{ cedian.name }}</div>
      <div>实时数据:</div>
      <div v-for="(value, key) in cedian.data" :key="key">
        <span class="DataChannel">{{ key }}</span
        >: {{ value }}
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="操作提示">
      <div class="提示标题">操作说明</div>
      <div class="提示内容">
        <div><span class="快捷键">Ctrl + 拖拽</span> 框选测点</div>
        <div><span class="快捷键">鼠标滚轮</span> 缩放视图</div>
        <div><span class="快捷键">鼠标拖拽</span> 旋转视角</div>
        <div><span class="快捷键">右键拖拽</span> 平移视图</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { SelectArea3D } from "@/utils/threeapi/SelectArea3D.js";
import { websocketService } from "@/utils/websocket.js";
import { getMeasurePointsConfig } from "../../api/virtual-real-online-compare";
import mitter from "@/utils/EventBus"; // ✅ 默认导入（正确）
// 添加 CSS2DRenderer
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

let scene, camera, renderer, controls;
let width = 0; // 模块级变量（全局）
let height = 0;
let isCtrlDown = false;
let selectArea = null;
let composer, outlinePass;
let objects = [];
let fbxModel = null;
// 📌 添加 CSS2DRenderer 相关变量
let css2dRenderer;
const labelGroup = new THREE.Group();
const canvasRef = ref(null);
// 存储测点配置（从 API 获取）
const measurePointsConfig = ref([]);

// 选中测点信息
const selectedPoints = ref([]);
// 存储所有测点数据（用于实时更新）
const measurePointData = ref({});

// 📌 更新选中测点信息
function updateSelectedPointsInfo(selected) {
  selectedPoints.value = selected.map((obj) => ({
    id: obj.info_id,
    name: obj.info_name,
    data: {}, // 用于存储实时数据
  }));
}
// 初始化测点（从 API 获取配置）
async function initMeasurePoints() {
  try {
    const response = await getMeasurePointsConfig();
    const config = response;
   
    measurePointsConfig.value = config;
    measurePointData.value = config;

    if (!fbxModel) return;

    const box = new THREE.Box3().setFromObject(fbxModel);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const pointSize = Math.max(maxDimension * 0.008, 0.01);

    Object.entries(config).forEach(([name, point]) => {
      const geo = new THREE.SphereGeometry(pointSize, 12,12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0x442200,
        metalness: 0.3,
        roughness: 0.4,
        depthTest: false,
      });

      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(Number(point.x), Number(point.y), Number(point.z));
      sphere.info_name = name; // 使用 key 作为测点名称
      sphere.info_id = point.id;
      sphere.userData = { type: "measurePoint", originalData: point };
      sphere.renderOrder = 10;

      scene.add(sphere);
      objects.push(sphere);

      console.log(
        `✅ 创建测点: ${name} 位置: (${point.x}, ${point.y}, ${point.z})`,
      );
    });

    selectArea.setObjects(objects);
  } catch (error) {
    console.error("❌ 获取测点配置失败:", error);
  }
}
//更新测点
function updateSeletedPointData(data) {
  selectedPoints.value.forEach((point) => {
    const pointInfo = data[point.name];

    if (pointInfo) {
      // 📌 确保 point.data 存在
      if (!point.data) {
        point.data = {};
      }
      point.data[pointInfo.channelName] =
        `${pointInfo.data}${pointInfo.unitCode}`;
    }
  });
}
// 更新测点数据（位置不变）
function updateMeasurePointData(data) {
  objects.forEach((obj) => {
    if (obj.userData?.type === "measurePoint") {
      const pointInfo = data[obj.info_name];
      if (pointInfo) {
        // 更新数据但保持位置不变
        obj.userData.originalData = {
          ...obj.userData.originalData,
          ...pointInfo,
        };
        console.log(`🔄 更新测点数据: ${obj.info_name}`);
      }
    }
  });

  // 更新选中测点的显示
  updateSeletedPointData(data);
}

//连接websocket
function connectWebSocket() {
  // 初始化 WebSocket 连接
  websocketService.connect();

  // 监听 WebSocket 消息
  const handleWsData = (data) => {
    // console.log('📊 收到 WebSocket 数据:', data);

    measurePointData.value = data;
    // 📌 只更新数据，不更新位置
    updateMeasurePointData(data);
    // 📌 更新 CSS2D 标签内容
    updateLabelsContent();
  };

  mitter.on("wsType32", handleWsData);

  // 4. 组件卸载时清理
  onUnmounted(() => {
    mitter.off("wsType32", handleWsData);
    websocketService.disconnect();
  });
}

onMounted(() => {
  init();
});

function init() {
  const container = canvasRef.value;
  width = container.clientWidth;
  height = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x555333);

  camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 3000);
  camera.position.set(20, 20, 12);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // 后期处理
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new OutlinePass(
    new THREE.Vector2(width, height),
    scene,
    camera,
  );
  outlinePass.edgeStrength = 3.0;
  outlinePass.edgeGlow = 0.0;
  outlinePass.edgeThickness = 1.0;
  outlinePass.pulsePeriod = 0;
  outlinePass.visibleEdgeColor.set(0x00ff00);
  outlinePass.hiddenEdgeColor.set(0x000000);
  composer.addPass(outlinePass);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // 灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(ambientLight, dirLight);

   // 📌 初始化 CSS2DRenderer
  css2dRenderer = new CSS2DRenderer();
  css2dRenderer.setSize(width, height);
  css2dRenderer.domElement.style.position = 'absolute';
  css2dRenderer.domElement.style.top = '0';
  css2dRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(css2dRenderer.domElement);
    // 添加标签组到场景
  scene.add(labelGroup);

  initSelectArea();
  loadFBXModel();
  bindEvents();
  connectWebSocket(); // 连接 WebSocket
  animate();
}

// 加载 FBX
function loadFBXModel() {
  const loader = new FBXLoader();
  loader.load(
    // "/static/model/04.fbx",
      "/static/model/歼灭机.fbx",
    (model) => {
      fbxModel = model;
      model.scale.set(3.8, 3.8,3.8);
      model.position.y = 0;
      scene.add(model);

      // 📌 先通过 API 获取配置并创建测点
      initMeasurePoints();

      // 📌 然后连接 WebSocket 更新数据
      connectWebSocket();
    },
    (xhr) => {
      console.log("加载进度：", (xhr.loaded / xhr.total) * 100 + "%");
    },
    (error) => {
      console.error("FBX 加载失败", error);
    },
  );
}
// 📌 创建测点标签
function createMeasurePointLabel(pointMesh, pointData) {
  // 创建 HTML 元素
  const div = document.createElement('div');
  div.className = 'measure-point-label';
  div.innerHTML = `
    <div class="label-name">${pointMesh.info_name}</div>
    <div class="label-data">${pointData.data}${pointData.unitCode}</div>
  `;
  
  // 创建 CSS2DObject
  const label = new CSS2DObject(div);
  label.position.set(0, 1.5, 0);  // 在测点上方 1.5 单位处
  pointMesh.add(label);
  
  return label;
}

// 📌 更新选中测点标签
// 更新选中测点标签
function updateSelectedPointsLabels(selected) {
 
   // 📌 先移除所有测点的标签
  objects.forEach((obj) => {
    if (obj.userData?.type !== 'measurePoint') return;
    
    // 找到并移除 CSS2DObject 子对象
    const labels = obj.children.filter(child => child.element && child.element.tagName === 'DIV');
    labels.forEach(label => {
      obj.remove(label);
    });
  });
  // 为选中的测点添加标签
  selected.forEach((obj) => {
    const pointData = measurePointData.value[obj.info_name];
    if (pointData) {
      // 创建 HTML 元素
      const div = document.createElement('div');
      
      // 📌 使用内联样式（灰色背景，白色文字）
      div.style.background = 'rgba(100, 100, 100, 0.9)';
      div.style.color = 'white';
      div.style.padding = '8px 12px';
      div.style.borderRadius = '6px';
      div.style.fontSize = '12px';
      div.style.whiteSpace = 'nowrap';
      div.style.pointerEvents = 'auto';
      div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
      
      // 📌 内容也使用内联样式
      div.innerHTML = `
        <div style="font-weight: bold; color: white; margin-bottom: 7px;">${obj.info_name}</div>
        <div style="color: white;margin-bottom: 4px;"">${pointData.channelName}: ${pointData.data}${pointData.unitCode}</div>
      `;
      
      // 创建 CSS2DObject
      const label = new CSS2DObject(div);
      label.position.set(1, 2.5, 0);  // 在测点上方 2 单位处
      obj.add(label);
      console.log('🔍 为测点', obj.info_name, '创建了标签');
    }
  });
}
// 更新 CSS2D 标签内容（新增）
function updateLabelsContent() {
  objects.forEach((obj) => {
    // 只处理测点对象
    if (obj.userData?.type !== 'measurePoint') return;
    
    // 📌 使用更可靠的方式查找标签
    let label = null;
    obj.children.forEach((child) => {
      // CSS2DObject 有一个 element 属性，是 HTML 元素
      if (child.element && child.element.tagName === 'DIV') {
        label = child;
      }
    });
    
    
    
   if (!label) return;
    
    // 获取最新数据
    const pointData = measurePointData.value[obj.info_name];
    if (!pointData) return;
    
    // 更新标签内容
    const div = label.element;
    div.innerHTML = `
      <div style="font-weight: bold; color: white; margin-bottom: 4px;">${obj.info_name}</div>
      <div style="color: white;">${pointData.channelName}: ${pointData.data}${pointData.unitCode}</div>
    `;
  });
}

//获取从websocket获取的测点数据
function createMeasurePointsFromWebSocket() {
  if (!fbxModel) return;

  const box = new THREE.Box3().setFromObject(fbxModel);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const pointSize = Math.max(maxDimension * 0.05, 0.1);

  // 📌 创建/更新测点（不清除旧测点）
  Object.entries(measurePointData.value).forEach(([name, pointInfo]) => {
    // 检查是否已存在该测点
    let existingPoint = objects.find(
      (obj) => obj.info_name === name && obj.userData?.type === "measurePoint",
    );

    if (!existingPoint) {
      // 📌 创建新测点（只执行一次）
      const geo = new THREE.SphereGeometry(pointSize, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0x442200,
        metalness: 0.3,
        roughness: 0.4,
        depthTest: false,
      });
      existingPoint = new THREE.Mesh(geo, mat);

      // 📌 位置只设置一次！
      const { x, y, z } = pointInfo;
      if (x !== undefined && y !== undefined && z !== undefined) {
        existingPoint.position.set(Number(x), Number(y), Number(z));
      } else {
        const center = box.getCenter(new THREE.Vector3());
        existingPoint.position.set(
          center.x + (Math.random() - 0.5) * size.x * 0.8,
          center.y + (Math.random() - 0.5) * size.y * 0.8,
          center.z + (Math.random() - 0.5) * size.z * 0.8,
        );
      }

      existingPoint.info_name = name;
      existingPoint.info_id = pointInfo.id || name;
      existingPoint.userData = {
        type: "measurePoint",
        originalData: pointInfo,
      };
      existingPoint.renderOrder = 10;

      scene.add(existingPoint);
      objects.push(existingPoint);

      console.log(`✅ 创建测点: ${name}`);
    } else {
      // 📌 更新现有测点的数据（位置不变！）
      existingPoint.userData.originalData = pointInfo;
      console.log(`🔄 更新测点数据: ${name}`);
    }
  });

  // 📌 移除已删除的测点
  const currentNames = Object.keys(measurePointData.value);
  objects = objects.filter((obj) => {
    if (
      obj.userData?.type === "measurePoint" &&
      !currentNames.includes(obj.info_name)
    ) {
      scene.remove(obj);
      return false;
    }
    return true;
  });

  selectArea.setObjects(objects);
}

//动态调整选
function lookpoint() {
  if (objects.length === 0) {
    console.log("⚠️ 没有测点需要查看");
    return;
  }

  //1. 创建包围盒并计算所有测点的边界
  const box = new THREE.Box3();
  box.setFromObjects(objects);

  //2.获取包围盒的中心点
  const center = new THREE.Vector3();
  box.getCenter(center);
  // 3. 获取包围盒的尺寸
  const size = new THREE.Vector3();
  box.getSize(size);
  //4.计算相机需要移动的距离（确保所有测点都在视野里）
  const maxDim = Math.max(size.x, size.y, size.z);
  const cameraDistance = maxDim * 1.5; // 相机距离最大尺寸的1.5倍

  //5.设置相机位置
  camera.position.set(
    center.x + cameraDistance * 0.5,
    center.y + cameraDistance * 0.5,
    cameraDistance + cameraDistance,
  );
  // 6. 让相机看向测点中心
  camera.lookAt(center);

  // 7. 更新控制器目标点
  if (controls) {
    controls.target.copy(center);
    controls.update();
  }
  console.log(
    `✅ 视角已调整到测点区域，中心位置: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`,
  );
}
function initSelectArea() {
  selectArea = new SelectArea3D(camera, controls, renderer, objects);
}

function bindEvents() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Control") isCtrlDown = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "Control") isCtrlDown = false;
  });

  window.addEventListener("mousedown", (e) => {
    if (!isCtrlDown || e.button !== 0) return;
    selectArea.startSelect(e);
  });

  window.addEventListener("mousemove", (e) => {
    selectArea.move(e);
  });

  window.addEventListener("mouseup", () => {
    const selected = selectArea.endSelect();
console.log('🔍 框选结束，选中:', selected.length, '个');  // 📌 调试
    if (outlinePass) outlinePass.selectedObjects = selected;
    // 📌 更新选中测点信息
    updateSelectedPointsInfo(selected);
    // 📌 更新选中测点标签
    updateSelectedPointsLabels(selected);
   
    // 📌 如果有已缓存的 WebSocket 数据，立即更新显示
    if (Object.keys(measurePointData.value).length > 0) {
      updateSeletedPointData(measurePointData.value);
    }
  });

  // 修复：resize 正确获取窗口大小
  window.addEventListener("resize", () => {
    const container = canvasRef.value;
    width = container.clientWidth;
    height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    outlinePass.setSize(width, height);
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
   css2dRenderer.render(scene, camera);  // 📌 渲染 CSS2D 标签
}

onUnmounted(() => {
  window.removeEventListener("keydown", () => {});
  window.removeEventListener("keyup", () => {});
  window.removeEventListener("mousedown", () => {});
  window.removeEventListener("mousemove", () => {});
  window.removeEventListener("mouseup", () => {});
  window.removeEventListener("resize", () => {});
  renderer?.dispose();
  composer?.dispose();
});
</script>

<style scoped>
.app {
  height: 100%;
  width: 100%;
  position: relative;
  background: #333;
  overflow: hidden;
}

.canvas-wrap {
  height: 100%;
  width: 100%;
  position: absolute;
  z-index: 1; /* ✅ 设置较低层级 */
}
/* 操作提示 */
.操作提示 {
  position: absolute;
top: 20px;        /* 📌 左上角 */
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  font-size: 13px;
  z-index: 9999;
  min-width: 100px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.提示标题 {
  font-weight: bold;
  color: #afb4b2;
  margin-top: 12px;
  margin-bottom: 3px;
  font-size: 14px;
}

.提示内容 {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.快捷键 {
  display: inline-block;
  background: rgba(100, 100, 100, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
  color: #ffaa00;
}
</style>
