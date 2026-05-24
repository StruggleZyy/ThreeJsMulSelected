<template>
  <div class="app">
    <div class="btns">
      <button @click="split">{{ isSplit ? "分解" : "组合" }}</button>
    </div>
    <div class="slider-container" style="margin-top: 30px">
      <label for="explosionRange" style="color: white; font-size: 18px"
        >爆炸系数:</label
      >
      <input
        type="range"
        id="explosionRange"
        v-model="explosionCoefficient"
        min="1"
        max="10"
        step="0.1"
      />
      <span style="color: white; font-size: 18px">{{
        explosionCoefficient
      }}</span>
    </div>
    <div ref="canvasRef" class="canvas-wrap"></div>
    <div id="modelInfo" v-if="modelLoaded">
      {{ selectedMeshInfo.name }}<br />{{ selectedMeshInfo.description }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { gsap } from "gsap"; // 加在最上面！
const canvasRef = ref(null);
//爆炸状态
const isSplit = ref(true);
const selectedMesh = ref(null);
const selectedMeshInfo = ref({
  name: "请选择一个模型",
  description: "将鼠标悬停在模型上来查看详细信息",
});
const modelLoaded = ref(false);
// 用于存储爆炸系数
const explosionCoefficient = ref(1);

let scene,
  camera,
  renderer,
  cameraControls,
  model,
  fragments,
  composer,
  outlinePass;

let width = 0; // 模块级变量（全局）
let height = 0;

function init() {
  // ✅ 获取父容器实际尺寸
  const container = canvasRef.value;
  width = container.clientWidth;
  height = container.clientHeight;
  // ✅ 初始化场景、相机、渲染器
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 4000);
  camera.position.set(260, 80, 120);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
// ✅ 添加环境光和定向光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5);
  directionalLight.position.set(20, 20, 40);
  scene.add(directionalLight);
// ✅ 添加轮廓线效果
  composer = new EffectComposer(renderer);

// 创建渲染通道：将场景渲染到缓冲区
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);// 添加到组合器

  outlinePass = new OutlinePass(
    new THREE.Vector2(width, height),
    scene,
    camera,
  );
  outlinePass.visibleEdgeColor.set(0xff0000);
  outlinePass.edgeThickness = 4;
  outlinePass.edgeStrength = 6;
  composer.addPass(outlinePass);// 添加到组合器
// ✅ 滚轮滚动	缩放（靠近/远离目标） 鼠标右键拖动	平移整个场景 鼠标左键拖动	围绕目标点旋转视角
   cameraControls = new OrbitControls(camera, renderer.domElement);

  loadModel();
}

function loadModel() {
  console.log("加载模型");

  new GLTFLoader().load(
    "/static/model/飞机.glb",
    (gltf) => {
      model = gltf.scene.children[0]; // 获取模型根节点
      model.scale.set(10, 10, 10); // 缩放适配场景
      scene.add(model);
      console.log(1111, model);
      // 遍历模型子节点，收集所有网格部件（Mesh）
      fragments = [];
      model.traverse((child) => {
        if (child.isMesh) {
          switch (child.name) {
            case "J20摇杆":
              // 给每个部件添加描述信息（用户数据）
              child.userData = {
                description: "用于控制飞机飞行姿态的操纵杆，通常位于驾驶舱内。",
              };
              break;
            case "主弹舱控制器":
              child.userData = {
                description: "控制飞机主弹舱开启和关闭的装置，管理武器发射。",
              };
              break;
            case "机翼控制":
              child.userData = {
                description:
                  "控制飞机机翼姿态的机构，可能包括襟翼、副翼等，用于调整飞行性能。",
              };
              break;
            case "歼20_01_1": // 假设这是尾部控制面的具体编号或标识
              child.userData = {
                description:
                  "飞机的尾部控制组件，包括水平尾翼和垂直尾翼，用于控制飞机的俯仰、偏航和滚转。",
              };
              break;
            case "喷管01":
              child.userData = {
                description:
                  "飞机的发动机喷管，负责将燃烧产生的高温高压气体排出，产生推力驱动飞机前进。",
              };
              break;
            default:
              child.userData = { description: "未知部分，请检查模型。" };
          }
          fragments.push(child); // 存储所有可交互部件
        }
      });
      modelLoaded.value = true;
    },
    (progress) => {
      // console.log(
      //   `加载中: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`,
      // );
    },
    (error) => {
      console.error(error);
    },
  );
}

function render() {
  composer.render();
  requestAnimationFrame(render);
}

function animate() {
  if (composer) {
    composer.render();
  }
  requestAnimationFrame(animate);
}

function split() {
  if (!modelLoaded.value) return;
  if (isSplit.value) {
    // 爆炸逻辑：计算每个部件与模型中心的偏移，按系数外扩
    const modelWorldCenter = new THREE.Vector3();
    model.getWorldPosition(modelWorldCenter); // 模型中心点
    model.traverse((child) => {
      if (child.isMesh) {
        // 计算部件自身中心相对模型中心的方向向量
        const childBox = new THREE.Box3().setFromObject(child);
        const childCenter = new THREE.Vector3()
          .addVectors(childBox.max, childBox.min)
          .multiplyScalar(0.5)
          .sub(modelWorldCenter)
          .normalize();
        // 使用爆炸系数调整位置
        const p = new THREE.Vector3()
          .copy(childCenter)
          .multiplyScalar(explosionCoefficient.value * 2);
        // 按爆炸系数移动位置（保存原始位置，用于组合）
        child.oldPosition = child.position.clone();
        // child.position.copy(p);
          gsap.to(child.position, {
        x: p.x,
        y: p.y,
        z: p.z,
        duration: 0.6,
        ease: "power2.out"
      });
      }
    });
  } else {
    // 组合逻辑：恢复原始位置
    model.traverse((child) => {
      if (child.isMesh && child.oldPosition) {
        //child.position.copy(child.oldPosition);// 没有动画，直接复制位置，实现组合效果 替换成下面的gsap动画
        // ✅ 组合时也做平滑动画
        gsap.to(child.position, {
          x: child.oldPosition.x,
          y: child.oldPosition.y,
          z: child.oldPosition.z,
          duration: 0.6,
          ease: "power2.out"
        });
     
      }
    });
  }
  isSplit.value = !isSplit.value;
}

function onMouseMove(event) {
  if (!fragments || !modelLoaded.value) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    (-(event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(fragments, true); // 修改为 true 以包括子对象

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    if (selectedMesh.value !== intersectedObject) {
      outlinePass.selectedObjects = [intersectedObject];
      selectedMesh.value = intersectedObject;
      selectedMeshInfo.value = {
        name: intersectedObject.name,
        description: intersectedObject.userData?.description || "暂无介绍",
      };
    }
  } else {
    outlinePass.selectedObjects = [];
    selectedMesh.value = null;
    selectedMeshInfo.value = {
      name: "请选择一个模型",
      description: "将鼠标悬停在模型上来查看详细信息",
    };
  }
}

function onWindowResize() {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  if (outlinePass) {
    outlinePass.setSize(width, height);
  }
  if (composer) {
    composer.setSize(width, height);
  }
}

onMounted(() => {
  init();
  animate();
  window.addEventListener("resize", onWindowResize, false);
  if (canvasRef.value) {
    canvasRef.value.appendChild(renderer.domElement);
  }
  renderer.domElement.addEventListener("mousemove", onMouseMove);
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
  renderer.domElement.removeEventListener("mousemove", onMouseMove);
  if (cameraControls) cameraControls.dispose();
  if (composer) composer.dispose();
});
</script>

<style scoped>
.app {
  height: 100%;
  width: 100%;
  position: relative;
  background-color: #333;
  user-select: none;
}
.canvas-wrap {
  height: 100%;
  width: 100%;
  position: absolute;
  z-index: 1; /* ✅ 设置较低层级 */
}
.btns {
  position: absolute;
  /* top: 5px; */
  left: 1px;
  width: 200px;
  height: 30px;
  padding-top: 10px;
}
.slider-container {
  padding-top: 10px;
  margin-left: 80px;
  position: relative; /* ✅ 添加相对定位 */
  z-index: 100; /* ✅ 设置较高层级 */
}

#modelInfo {
  position: absolute;
  top: 15px;
  right: 15px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  width: 300px;
  height: 105px;
  font-size: 16px;
  align-items: center;
  justify-content: center;
}
</style>
