<template>
  <div id="app">
    <div ref="threeContainer" class="three-container"></div>
    <div id="selected-info" v-if="selectedObjects.length > 0">
      <p>选中的模型数量: {{ selectedObjects.length }}</p>
      <ul>
        <li v-for="(object, index) in selectedObjects" :key="index">{{
          object.name
        }}</li>
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
  // 调整相机的 near 和 far 参数
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01, // 减小 near 值
    10000 // 增大 far 值
  );
  // 修改 renderer 创建部分，开启抗锯齿
  const renderer = new THREE.WebGLRenderer();
  // 设置设备像素比
  renderer.setPixelRatio(window.devicePixelRatio);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const selectedObjects = ref([]);
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);


  const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.visibleEdgeColor.set(0xff0000); // Set edge color to red

  outlinePass.edgeThickness = 2;
  outlinePass.edgeStrength = 3;
//  composer.addPass(outlinePass);

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let boxHelper; // 用于绘制框选矩形的辅助对象

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
    loader.load(
      url,
      (object) => {
        const { x, y, z } = modelPositions[index];
        object.position.set(x, y, z);
        scene.add(object);
      },
      undefined,
      (error) => {
        console.error('模型加载出错:', error);
      }
    );
  });

  // 设置场景、相机和渲染器
  camera.position.set(0, 0, 1000);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // 光照设置
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // 初始化 OutlinePass
  // outlinePass.visibleEdgeColor.set(0xff0000); // 设置高亮颜色为红色
  // outlinePass.edgeThickness = 2;
  // outlinePass.edgeStrength = 3;
  // composer.addPass(renderPass);
  // composer.addPass(outlinePass); // 不添加 OutlinePass 添加到 composer 中

  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate);

    composer.render(); // 使用 composer 进行渲染
  };

  // 鼠标按下事件
  const onMouseDown = (event) => {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
  };

  // 鼠标移动事件
  const onMouseMove = (event) => {
    if (isDragging) {
      const endX = event.clientX;
      const endY = event.clientY;

      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      if (!boxHelper) {
        const boxGeometry = new THREE.BoxGeometry(1, 1, 0.01);
        const boxMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        });
        boxHelper = new THREE.Mesh(boxGeometry, boxMaterial);
        boxHelper.renderOrder = 9999; // 确保最后渲染
        boxHelper.material.depthTest = false; // 禁用深度测试
        scene.add(boxHelper);
      }

      boxHelper.scale.set(width, height, 1); // 动态调整尺寸

      boxHelper.position.set(
        left + width / 2,
        -(top + height / 2) + renderer.domElement.clientHeight,
        -1 // Z 坐标（确保在模型前面）
      );
      console.log('boxHelper.position', boxHelper.position);
    }
  };

  // 鼠标松开事件
  const onMouseUp = (event) => {
    if (isDragging) {
      isDragging = false;
      const endX = event.clientX;
      const endY = event.clientY;

      // 计算框选矩形的范围
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);

      // 清空之前的选择
      selectedObjects.value = [];

      // 遍历场景中的物体，检查是否在框选范围内
      scene.traverse((object) => {
        if (object.isMesh) {
          // 获取物体在屏幕上的投影坐标
          const vector = new THREE.Vector3();
          object.updateWorldMatrix(true, false);
          object.getWorldPosition(vector);
          vector.project(camera);

          // 将投影坐标转换为屏幕坐标
          const screenX =
            ((vector.x + 1) * renderer.domElement.clientWidth) / 2;
          const screenY =
            ((-vector.y + 1) * renderer.domElement.clientHeight) / 2;

          // 检查是否在框选范围内
          if (
            screenX >= minX &&
            screenX <= maxX &&
            screenY >= minY &&
            screenY <= maxY
          ) {
            selectedObjects.value.push(object);
          }
        }
      });
 // 如果有选中的模型，添加 outlinePass 到 composer 并设置高亮对象
        if (selectedObjects.value.length > 0) {
            composer.addPass(outlinePass);
            outlinePass.selectedObjects = selectedObjects.value;
        } else {
            // 如果没有选中的模型，移除 outlinePass（如果已添加）
            const index = composer.passes.indexOf(outlinePass);
            if (index > -1) {
                composer.removePass(outlinePass);
            }
            outlinePass.selectedObjects = [];
        }

      // 更新高亮效果
      outlinePass.selectedObjects = selectedObjects.value;
     
      // 移除框选矩形
      if (boxHelper) {
        scene.remove(boxHelper);
        boxHelper = null;
      }
    }
  };

  // 窗口大小改变事件
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.setSize(
      new THREE.Vector2(window.innerWidth, window.innerHeight)
    );
    composer.setSize(window.innerWidth, window.innerHeight);
  };

  onMounted(() => {
    threeContainer.value.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
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


const selectProduct = (item) => {
    const handleEnter = (e) => { // 新增：处理Enter键的函数
        if (e.key === 'Enter') {
            e.preventDefault();
            // 执行确定按钮的逻辑
            formData.value.testArticleProductId = item.id;
            selectedArticleProduct.value = item.modelName;
            openModel(item.preview || item.origin);
            oriProduct.value = true;
            test.close();
            document.removeEventListener('keydown', handleEnter); // 移除监听
        }
    };

    const test = Modal.info({
        title: '确认选择？',
        content: '确认选择已完成的试验产品？选择后会清空当前场景。',
        footer: () =>
            h('div', {}, [
                h(
                    Button,
                    {
                        style: 'margin-right:30px',
                        onClick: () => {
                            test.close();
                            document.removeEventListener('keydown', handleEnter); // 新增：取消时移除监听
                        },
                    },
                    '取消'
                ),
                h(
                    Button,
                    {
                        type: 'primary',
                        onClick: () => {
                            formData.value.testArticleProductId = item.id;
                            selectedArticleProduct.value = item.modelName;
                            openModel(item.preview || item.origin);
                            oriProduct.value = true;
                            test.close();
                            document.removeEventListener('keydown', handleEnter); // 新增：确定时移除监听
                        },
                    },
                    '确定'
                )
            ]),
        // 假设Modal支持onClose回调（根据UI库调整）
        onClose: () => document.removeEventListener('keydown', handleEnter) // 新增：模态框关闭时移除监听
    });

    document.addEventListener('keydown', handleEnter); // 新增：添加Enter键监听
};



</script>

<style scoped>
  .three-container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
  }
  #selected-info {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-radius: 5px;
  }
</style>
