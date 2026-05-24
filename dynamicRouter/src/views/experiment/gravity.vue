<template>
  <div>
    <div id="three"></div>
    <div class="pos">
      <div id="A" class="bu">设备A</div>
      <div id="B" class="bu" style="margin-left: 15px">设备B</div>
      <div id="car" class="bu" style="margin-left: 15px">停车场</div>
      <div id="all" class="bu" style="margin-left: 15px">整体</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { onMounted } from "vue";
import TWEEN from "@tweenjs/tween.js";

// 场景
const scene = new THREE.Scene();
const loader = new GLTFLoader();
const model = new THREE.Group();
scene.add(model);

// 模型对象添加到场景中
const texture = new THREE.TextureLoader().load(
  "/Cesium/Assets/Textures/雨滴/雨滴.png",
);
const spriteMaterial = new THREE.SpriteMaterial({
  map: texture,
});

// 光源设置
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 60, 50);
scene.add(directionalLight);
const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

// 渲染器和相机
const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera(30, width / height, 1, 3000);
camera.position.set(202, 123, 125);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true, // 抗锯齿
  alpha: true,
});
renderer.setSize(width, height);
renderer.outputEncoding = THREE.sRGBEncoding; // 解决加载gltf格式模型颜色偏差问题
document.body.appendChild(renderer.domElement);

// 渲染循环
function render() {
  TWEEN.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();

onMounted(() => {
  document.getElementById("three").appendChild(renderer.domElement);

  // 设置相机控件轨道控制器OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);

  // 相机从当前位置飞行到三维场景中某个世界坐标附近
  document.getElementById("A")?.addEventListener("click", function () {
    const A = model.getObjectByName("设备A标注");
    if (A) {
      const pos = A.position.clone();
      const pos2 = pos.clone().addScalar(30); // 设定飞行终点位置

      // 禁用 OrbitControls，防止飞行过程中相机控制冲突
      controls.enabled = false;

      new TWEEN.Tween({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        tx: camera.position.x,
        ty: camera.position.y,
        tz: camera.position.z,
      })
        .to(
          {
            x: pos2.x,
            y: pos2.y,
            z: pos2.z,
            tx: pos.x,
            ty: pos.y,
            tz: pos.z,
          },
          800,
        )
        .onUpdate(function (obj) {
          camera.position.set(obj.x, obj.y, obj.z);
          camera.lookAt(obj.tx, obj.ty, obj.tz);
        })
        .onComplete(() => {
          // 飞行完成后重新启用 OrbitControls
          controls.enabled = true;
        })
        .start();
    }
  });

  document.getElementById("B")?.addEventListener("click", function () {
    const B = model.getObjectByName("设备B标注");
    if (B) {
      const pos = B.position.clone();

      const pos2 = new THREE.Vector3(-36.6142578125, 4, -38.35918140411377);
      // 禁用 OrbitControls，防止飞行过程中相机控制冲突
      controls.enabled = false;

      new TWEEN.Tween({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        tx: camera.position.x,
        ty: camera.position.y,
        tz: camera.position.z,
      })
        .to(
          {
            x: pos2.x,
            y: pos2.y,
            z: pos2.z,
            tx: pos.x,
            ty: pos.y,
            tz: pos.z,
          },
          600,
        )
        .onUpdate(function (obj) {
          camera.position.set(obj.x, obj.y, obj.z);
          camera.lookAt(obj.tx, obj.ty, obj.tz);
        })
        .onComplete(() => {
          // 飞行完成后重新启用 OrbitControls
          controls.enabled = true;
        })
        .start();
    }
  });

  // 画布跟随窗口变化
  window.onresize = function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };

  // 加载模型
  loader.load("/static/model/工厂.glb", function (gltf) {
    model.add(gltf.scene);
  });

  // 批量创建多个精灵模型，在一个长方体空间上随机分布
  const group = new THREE.Group();
  model.add(group);
  for (let i = 0; i < 1000; i++) {
    const sprite = new THREE.Sprite(spriteMaterial);
    group.add(sprite);
    sprite.scale.set(1, 1, 1);
    const x = 400 * (Math.random() - 0.5);
    const y = 100 * Math.random();
    const z = 400 * (Math.random() - 0.5);
    sprite.position.set(x, y, z);
  }

  function loop() {
    group.children.forEach((sprite) => {
      sprite.position.y -= 0.1;
      if (sprite.position.y < 0) {
        sprite.position.y = 700;
      }
    });
    requestAnimationFrame(loop);
  }
  loop();
  // 打印场景中所有物体的位置
  function logObjectPositions(object: THREE.Object3D) {
    // 如果是物体且有位置属性，打印位置
    if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
      console.log(`${object.name || "Unnamed"} position:`, object.position);
    }

    // 遍历所有子对象
    object.traverse((child) => {
      logObjectPositions(child); // 递归调用
    });
  }

  // 打印model中所有物体的位置
  console.log(22, model.children);
});
</script>

<style scoped>
body {
  overflow: hidden;
  margin: 0px;
}
.bu {
  background: rgba(0, 0, 0, 0.3);
  width: 60px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  display: inline-block;
  border-radius: 30px;
}

.bu:hover {
  cursor: pointer;
}

.pos {
  position: absolute;
  left: 50%;
  margin-left: -135px;
  bottom: 100px;
}
</style>
