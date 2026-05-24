<template>
  <div class="testSceneSetup">
    <a-spin :loading="moduleLoading" :tip="loadingText">
      <div ref="threedom" :class="{ three: true, bigDom: bigDiaolog }">
        <div class="big_btn" @click="bigBtnFunc" v-if="!false">
          <!-- <icon-expand style="font-size: 25px" /> -->
          全屏
        </div>

        <div class="ceDianInfo" v-for="(cedian, index) in ceDianArr" :key="index" :id="cedian.id">
          <div>测点名称: {{ cedian.name }}</div>
          <div>实时数据: </div>
          <div v-for="(value, key) in cedian.data" :key="key">
            <span class="DataChannel">{{ key }}</span>: {{ value }}
          </div>
        </div>
      </div>
    </a-spin>
    <!-- <button type="" @click="test">测试按钮</button> -->
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  onMounted,
  nextTick,
  onBeforeUnmount,
  defineExpose,
  watch,
  computed,
} from 'vue';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject, } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

import LoadSTP from '@/utils/threeAPI/LoadSTP';
import LoadFBX from '@/utils/threeAPI/LoadFBX';
import Icytree from '@/utils/threeAPI/Icythree';
import Caster from '@/utils/threeAPI/caster';
import MouseFrameSelect from '@/utils/threeAPI/MouseFrameSelect';
import LoadOBJ from '@/utils/threeAPI/LoadOBJ';

import { selectedMeasurePointsApi } from '@/api/virtual-real-online-compare';
import { useLayoutStore, useWebsocketStore } from '@/store';
import mitter from '@/utils/EventBus';

const websocketStore = useWebsocketStore();
const layoutStore = useLayoutStore();

const emit = defineEmits(['initOk']);

let oldPointInfo = [];
mitter.on('wsType32', (data) => {
  console.log('获取回显测点的数据');
  oldPointInfo = data;
});

const menuSelInfo = computed(() => layoutStore.getInfoList);

const threedom = ref('');
const ceDianArr = ref([]);
let renderer;
let scene;
let camera;
let controls;
let outlinePass;
let css2dRenderer;
let icy;
let rect;
let mouseFrameSelect;
let caster;
const css2darr = [];
const css2dgroup = new THREE.Group();

function renderer3D() {
  if (css2dRenderer) {
    css2dRenderer.render(scene, camera);
  }
  icy.animate();
  requestAnimationFrame(renderer3D);
}

function maxSize(vec3) {
  let max;
  if (vec3.x > vec3.y) { max = vec3.x; }
  else { max = vec3.y; }
  if (max > vec3.z) {}
  else { max = vec3.z; }
  return max;
}

const moduleGroup = new THREE.Group();
const pointsGroup = new THREE.Group();
const fbxLoader = new FBXLoader();

const moduleLoading = ref(false);
const loadingText = ref("模型加载中...");

const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const Pointmaterial = new THREE.PointsMaterial({ color: 0x888888 });
const select_Pointmaterial = new THREE.PointsMaterial({ color: 0xff0000 });

const addPoint = (position: any, data: any) => {
  console.log(`准备添加测点: ${data.name}`, position);
  
  if (window.config.three.cedianModule[data.type]) {
    // FBX测点逻辑
    LoadFBX.FBXList.forEach((mesh) => {
      if (data.type == mesh.name) {
        const { x, y, z } = position;
        const model = mesh.clone(true);
        model.position.set(Number(x), Number(y), Number(z));
        model.info_name = data.name || '';
        model.info_id = data.id || '';
        
        // 🔧 关键修复：确保FBX测点可见
        model.traverse((child) => {
          if (child.isMesh) {
            child.material.depthTest = true;
            child.material.transparent = false;
          }
        });
        
        pointsGroup.add(model);
        console.log(`✅ 添加FBX测点模型: ${data.name}`);
      }
    });
  } else {
    // 🔧 修复：使用可见的球体几何体
    const geometry = new THREE.SphereGeometry(5, 32, 32); // 半径5，分段数32
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0x441111,
      metalness: 0.3,
      roughness: 0.4
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    const { x, y, z } = position;
    sphere.position.set(Number(x), Number(y) + 5, Number(z)); // 抬高一点
    sphere.info_name = data.name || '';
    sphere.info_id = data.id || '';
    sphere.userData = { type: 'measurePoint', originalData: data };
    
    pointsGroup.add(sphere);
    console.log(`✅ 添加红色球体测点: ${data.name} 位置:`, sphere.position);
  }

  if (!caster) {
    createdCaster();
    eventList();
  }
  lookMesh(pointsGroup);
};

const addFBX = (url: string) => {
  if (window.config.three.debuger) url = 'test.fbx';
  if (!url) { console.error('未传入模型地址'); return; }
  moduleGroup.children = [];
  url = window.config.three.urlPrefix + url;
  console.log('模型地址', url);
};

const addObj = (url: string) => {
  if (!url) { console.error('未传入模型地址'); return; }
  moduleGroup.children = [];
  if (window.config.three.debuger) {
    url = window.config.three.urlPrefix1 + 'qinglianghuahou.obj';
  } else {
    url = window.config.three.urlPrefix + url;
  }
  console.log('模型地址', url);
  moduleLoading.value = true;
  new LoadOBJ(url, (mesh) => {
    mesh.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.side=THREE.DoubleSide
        obj.material.depthTest
      }
    })
    moduleGroup.add(mesh)
    lookMesh(mesh);
  }, (xhr) => {
    loadingText.value = `模型加载中... ${(xhr.loaded / xhr.total*100).toFixed(2)} %`;
    if(xhr.loaded / xhr.total >= 1){
      moduleLoading.value = false;
    }
  })
};

const createdCaster = () => {
  caster = new Caster(camera, renderer, pointsGroup, async (mesh) => {
    const { info_id, info_name } = mesh.object;
    if (ControlLeft == 0) {
      await clearCeDianInfo();
      outlinePass.selectedObjects = [mesh.object];
      ceDianArr.value = [{ id: info_id, name: info_name, data: {} }];
      selectPointAPI();
      await nextTick();
      const dom = document.getElementById(info_id);
      addCssObject(dom, mesh.object.position, { id: info_id });
    } else if (ControlLeft == 1) {
      const findMesh = css2dgroup.children.find(
        (item) => item.name == `info_${info_id}`
      );
      if (findMesh) {
        outlinePass.selectedObjects = outlinePass.selectedObjects.filter(
          (item) => `info_${item.info_id}` != findMesh.name
        );
        ceDianArr.value = ceDianArr.value.filter(
          (item) => `info_${item.id}` != findMesh.name
        );
        const dom = findMesh.element;
        dom.parentNode.removeChild(dom);
        css2dgroup.remove(findMesh);
      } else {
        outlinePass.selectedObjects = [
          ...outlinePass.selectedObjects,
          mesh.object,
        ];
        ceDianArr.value.push({ id: info_id, name: info_name, data: {} });
        await nextTick();
        const dom = document.getElementById(info_id);
        addCssObject(dom, mesh.object.position, { id: info_id });
      }
      selectPointAPI();
    }
  });
};

const lookPoint = () => {
  const sizeMax = 120;
  const sizeLengthMax = 28288;
  const box = new THREE.Box3();
  box.setFromObject(pointsGroup);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x,size.y,size.z);
  const cameraZ = maxDim * 1.5
  camera.position.z = cameraZ;
  camera.lookAt(center);
  let minV3 = box.min
  let maxV3 = box.max
  let sizeLength = minV3.distanceTo(maxV3);
  pointsGroup.children.map(item=>{
    const size = sizeMax * (sizeLength/sizeLengthMax);
    item.scale.set(size,size,size);
  })
}

const bigDiaolog = ref(false);
const bigBtnFunc = async () => {
  bigDiaolog.value = !bigDiaolog.value;
  await nextTick();
  setTimeout(() => {
    icy.updateRender();
    css2dRenderer.setSize(
      renderer.domElement.offsetWidth,
      renderer.domElement.offsetHeight
    );
  }, 1000);
};

const lookMesh = (mesh) => {
  const box3 = new THREE.Box3();
  box3.expandByObject(mesh);
  const size = new THREE.Vector3();
  box3.getSize(size);
  const center = new THREE.Vector3();
  box3.getCenter(center);
  let max = maxSize(size);
  const centerx = center.x;
  max *= 1.5;
  camera.position.copy(center.clone().addScalar(max));
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  controls.target.set(centerx, center.y, center.z);
  controls.update();
}

const changeThree = () => {
  icy.updateRender();
  css2dRenderer.setSize(
    renderer.domElement.offsetWidth,
    renderer.domElement.offsetHeight
  );
}

const selectPointAPI = () => {
  const param = {
    ids: [],
    names: [],
    workConditionId:menuSelInfo.value.testWorkCondition?.id,
    testType:menuSelInfo.value.test?.testType,
  };
  ceDianArr.value.map((item) => {
    const { id, name } = item;
    param.ids.push(id);
    param.names.push(name);
  });

  selectedMeasurePointsApi(param).then((res) => {
    console.log('成功选择测点');
    let keyArr = Object.keys(res)
    keyArr.forEach(key=>{
      let {channelName,data,unitCode=""} = res[key]
      ceDianArr.value.map(item=>{
        if(item.name == key){
          item.data[channelName] = `${data}${unitCode}`
        }
      })
    })
  });
};

const getCedianData = computed(() => websocketStore.getCeDianNowData);
watch(getCedianData, (data) => {
  data.map((item) => {
    const [channelName, data, measuringPointName] = item;
    const unitCode = item.unitCode ? item.unitCode : '';
    ceDianArr.value.map((item) => {
      if (item.name == measuringPointName) {
        if (item.data[channelName]) {
          item.data[channelName] = data + unitCode;
        } else {
          item.data[channelName] = data + unitCode;
        }
      }
    });
  });
}, { deep: true, immediate: true });

const defaultSelPoint = async () => {
  if (!oldPointInfo || oldPointInfo.length == 0) return;
  ceDianArr.value = [];
  const moduleList = [];
  await clearCeDianInfo();
  Object.keys(oldPointInfo).forEach((key) => {
    const pointinfo = oldPointInfo[key];
    const { data, channelName, unitCode = '' } = pointinfo;
    pointsGroup.children.map((pointMesh) => {
      const { info_name, info_id } = pointMesh;
      if (info_name == key) {
        addPointInfo({
          id: info_id,
          name: info_name,
          value: `${data}${unitCode}`,
          position: new THREE.Vector3().copy(pointMesh.position),
        });
        moduleList.push({ name: channelName });
      }
    });
  });
  selectCeDianModule(moduleList);
};

const selectCeDianModule = (arr) => {
  const selectModule = [];
  arr.forEach((item) => {
    const { name } = item;
    pointsGroup.children.forEach((module) => {
      if (module.info_name == name) {
        selectModule.push(module);
      }
    });
  });
  outlinePass.selectedObjects = [...selectModule];
};

const addPointInfo = async (obj) => {
  const { id, name, value, position } = obj;
  let ok = false;
  let arrIndex = -1;
  ceDianArr.value.map((item, i) => {
    if (item.name == name) {
      ok = true;
      arrIndex = i;
    }
  });
  if (ok) {
    ceDianArr[arrIndex][name] = value;
  } else {
    const paramData = {
      id,
      name,
      position,
      data: {},
    };
    paramData.data[name] = value;
    ceDianArr.value.push(paramData);
    await nextTick();
    const dom = document.getElementById(id);
    addCssObject(dom, position, { id });
  }
};

const clearCeDianInfo = async () => {
  css2dgroup.children.length = [];
  css2darr.length = 0;
  ceDianArr.value.length = 0;
  await nextTick();
};

const addCssObject = (dom, position, data = {}) => {
  const objectCSS = new CSS2DObject(dom);
  objectCSS.name = `info_${data.id}`;
  const p = new THREE.Vector3().copy(position);
  objectCSS.center.set(0, 0);
  objectCSS.position.copy(p);
  css2dgroup.add(objectCSS);
  css2darr.push(objectCSS);
};

let ControlLeft = 0;
const keydownFunc = (e) => {
  if (e.code == 'ControlLeft' && ControlLeft == 0) {
    ControlLeft = 1;
  }
  if(ControlLeft){
    e.preventDefault();
  }
};

const keyUpFunc = (e) => {
  if (e.code == 'ControlLeft' && ControlLeft == 1) {
    ControlLeft = 0;
  }
};

const blurFunc = (e) => {
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.enableZoom = true;
  AltState = 0;
};

const mouseDownFunc = (e) => {
  if (e.button !== 0) return;
  const { layerX, layerY } = e;
  mouseFrameSelect.setStartPoint(layerX, layerY);
};

const mouseMoveFunc = (e) => {
  if (e.button !== 0) return;
  const { layerX, layerY } = e;
  mouseFrameSelect.updateDomDiv(layerX, layerY);
};

const mouseUpFunc = async (e) => {
  if (e.button !== 0) return;
  const width = mouseFrameSelect.getWidth();
  if (width.indexOf('px') == -1 || width == '0px') {
    caster.onMouseDown(e);
    mouseFrameSelect.clear();
    return;
  }
  const arr = mouseFrameSelect.selectMeshArr(pointsGroup, camera);
  mouseFrameSelect.clear();
  await clearCeDianInfo();
  arr.map((item) => {
    const { info_id, info_name } = item;
    ceDianArr.value.push({
      id: info_id,
      name: info_name,
      data: {},
      position: new THREE.Vector3().copy(item.position),
    });
  });
  selectPointAPI();
  await nextTick();
  ceDianArr.value.map(({ id: info_id, position }) => {
    const dom = document.getElementById(info_id);
    addCssObject(dom, position, { id: info_id });
  });
  e.stopPropagation();
  e.preventDefault();
};

const eventList = () => {
  window.addEventListener('keydown', keydownFunc);
  window.addEventListener('keyup', keyUpFunc);
  renderer.domElement.addEventListener('mousedown', mouseDownFunc);
  renderer.domElement.addEventListener('mousemove', mouseMoveFunc);
  renderer.domElement.addEventListener('mouseup', mouseUpFunc);
  rect = renderer.domElement.getBoundingClientRect();
};

onMounted(() => {
  icy = new Icytree(threedom.value);
  scene = icy.scene;
  renderer = icy.renderer;
  camera = icy.camera;
  controls = icy.controls;
  outlinePass = icy.outlinePass;
  threedom.value.appendChild(renderer.domElement);
  renderer.domElement.style.border = "1px solid #e5e6eb"
  {
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.none,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.none,
    };
  }
  renderer3D();

  scene.add(moduleGroup);
  scene.add(pointsGroup);
  scene.add(css2dgroup);

  mouseFrameSelect = new MouseFrameSelect(controls);

  css2dRenderer = new CSS2DRenderer();
  css2dRenderer.setSize(
    renderer.domElement.offsetWidth,
    renderer.domElement.offsetHeight
  );
  css2dRenderer.domElement.style.position = 'absolute';
  css2dRenderer.domElement.style.top = '0';
  css2dRenderer.domElement.style.pointerEvents = 'none';
  threedom.value.appendChild(css2dRenderer.domElement);

  emit('initOk');

  mitter.on("changeThree", changeThree)
});

onBeforeUnmount(() => {
  mitter.off('wsType32');
  mitter.off("changeThree", changeThree)

  window.removeEventListener('keydown', keydownFunc);
  window.removeEventListener('keyup', keyUpFunc);

  renderer.domElement.removeEventListener('mousedown', mouseDownFunc);
  renderer.domElement.removeEventListener('mousemove', mouseMoveFunc);
  renderer.domElement.removeEventListener('mouseup', mouseUpFunc);
});

defineExpose({
  addPoint,
  addFBX,
  addObj,
  lookPoint,
});
</script>

<style lang="less" scoped>
.testSceneSetup {
  width: 100%;
  height: 100%;
}
:deep(.arco-spin){
  height: 100%;
}
.three {
  width: 100%;
  position: relative;
  background: #fff;
  height: 100%;
}
.ceDianInfo {
  width: 140px;
  height: 100px;
  border: 1px solid;
  border-radius: 5px;
  background: rgba(240, 240, 240, 0.5);
  font-size: 12px;
  padding: 5px;
  .DataChannel {
    font-size: 12px;
    font-weight: 600;
  }
}
.big_btn {
  top: 0;
  left: 0;
}
.bigDom {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 100;
}
.ceDianArr{
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>