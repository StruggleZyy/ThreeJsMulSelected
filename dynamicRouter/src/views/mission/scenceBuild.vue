<template>
  <div ref="threedom" class="three">
    <SceneBuildLeftMenu @clickModule="clickModule" v-if="!(router.currentRoute.value.path == '/digital-test-design/digital-test-design-index')" />
    <sceneInfo ref="sceneInfoDom" @unselectModule="unselectModule" @deleteModule="deleteModule"></sceneInfo>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  onMounted,
  nextTick,
  onBeforeUnmount,
  defineProps
} from 'vue';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

import { useLayoutStore } from '@/store/index';

import LoadFBX from '@/utils/threeAPI/LoadFBX';
import LoadGLB from '@/utils/threeAPI/LoadGLB';
import Icytree from '@/utils/threeAPI/Icythree';
import Caster from '@/utils/threeAPI/caster';
import MoveModule from '@/utils/threeAPI/MoveModule';
import { SceneUpdate, selectScene } from '@/api/sceneApi';
import { getAllTestWorkConditionInfoApi } from '@/api/digital-test-design';

import SceneBuildLeftMenu from './SceneBuildLeftMenu.vue';
import sceneInfo from '@/views/configMenu/sceneInfo.vue';
import { useRouter } from 'vue-router';
import mitter from '@/utils/EventBus';
import { Message } from '@arco-design/web-vue';

const router = useRouter();
const layoutStore = useLayoutStore();
const prop = defineProps({
  height: {
    type: Number,
    default() { return 720; },
  }
});

const threedom = ref('');
const sceneInfoDom = ref(null);

let renderer;
let scene;
let camera;
let controls;
let moveModule;
let outlinePass;
let css2dRenderer;
let icy;

let caster;
const meshArrGroup = new THREE.Group();
meshArrGroup.name = "模型集合";
meshArrGroup.msg = '点击左侧模型菜单添加进场景的模型';
let selectMeshid = '';
const changfang_Group = new THREE.Group();
changfang_Group.name = "厂房";
const gongwei_Group = new THREE.Group();
gongwei_Group.name = "工位";

const createdCaster = () => {
  caster = new Caster(camera, renderer, gongwei_Group, async (mesh) => {
    let mesObj = mesh.object;
    if (selectMeshid !== mesObj.uuid) {
      mesObj = gongwei_Group.children.find(gw => gw.serverId == mesObj.serverId)
      selectMeshid = mesObj.uuid;
      outlinePass.selectedObjects = [mesObj];
      if (router.currentRoute.value.path == '/configMenu') {
        moveModule.setObject3D(mesObj);
      }
      else if (router.currentRoute.value.path == '/digital-test-design/digital-test-design-index') {
        const twoId = layoutStore.selectedKey.split("-")[1]
        selectScene({
          id: twoId,
          sceneId: sceneInfoDom.value.sceneInfo.id,
          stationId: mesObj.serverId
        }).then(res => {
          Message.success("选择工位成功")
        })
      }
    }
  });
}

onMounted(() => {
  threedom.value.style.height = `${prop.height}px`;
  icy = new Icytree(threedom.value);
  scene = icy.scene;
  renderer = icy.renderer;
  camera = icy.camera;
  controls = icy.controls;
  outlinePass = icy.outlinePass;
  threedom.value.appendChild(renderer.domElement);

  {
    const sun = new THREE.DirectionalLight(0xf0f8ff, 0.5);
    sun.position.set(3000, 3000, -3000);
    sun.castShadow = true;
    sun.shadow.camera.near = 0.01;
    sun.shadow.camera.far = 6000;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.radius = 1;
  }

  renderer3D();
  moveModule = new MoveModule(scene, camera, renderer, controls, (obj, event) => {
  });

  scene.add(meshArrGroup);

  css2dRenderer = new CSS2DRenderer();
  css2dRenderer.setSize(
    renderer.domElement.offsetWidth,
    renderer.domElement.offsetHeight
  );
  css2dRenderer.domElement.style.position = 'absolute';
  css2dRenderer.domElement.style.top = '0';
  css2dRenderer.domElement.style.pointerEvents = 'none';
  threedom.value.appendChild(css2dRenderer.domElement);

  camera.position.set(435.559700440279, 993.9100773183509, -1601.5197496145254);
  camera.lookAt(0, 0, 0);
  const size = 10000;
  const divisions = 10;
  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);

  eventList();
  mitter.on("selectScene", handleScne)
  scene.add(changfang_Group)
  scene.add(gongwei_Group)
  mitter.on("saveScene", saveScene)
  createdCaster();

  if (router.currentRoute.value.path == '/digital-test-design/digital-test-design-index') {
    getAllTestWorkConditionInfoApi({ id: layoutStore.getInfoList.testWorkCondition?.id, }).then(res => {
      handleScne(res.sceneInfo)
      sceneInfoDom.value.setSceneInfo(res.sceneInfo)
      setTimeout(() => {
        if (res.stationId) initSelectMesh(res.stationId)
      }, 3*1000);
    })
  }
});

function renderer3D() {
  requestAnimationFrame(renderer3D);
  if (moveModule) moveModule.render();
  icy.animate();
  if (css2dRenderer && scene) {
    css2dRenderer.render(scene, camera);
  }
}

const eventList = () => {
  window.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'w':
        moveModule.transformControls.setMode('translate');
        break;
      case 'e':
        moveModule.transformControls.setMode('rotate');
        break;
      case 'r':
        moveModule.transformControls.setMode('scale');
        break;
      case '+':
      case '=':
        moveModule.transformControls.setSize(
          moveModule.transformControls.size + 0.1
        );
        break;
      case '-':
      case '_':
        moveModule.transformControls.setSize(
          Math.max(moveModule.transformControls.size - 0.1, 0.1)
        );
        break;
      case 'x':
        moveModule.transformControls.showX =
          !moveModule.transformControls.showX;
        break;
      case 'y':
        moveModule.transformControls.showY =
          !moveModule.transformControls.showY;
        break;
      case 'z':
        moveModule.transformControls.showZ =
          !moveModule.transformControls.showZ;
        break;
    }
  });
  window.addEventListener('click', (e) => {
    caster?.onMouseDown(e);
  });
}

const clickModule = (data) => {
  let { modelType = '', id: modelId } = data;
  let url;
  if (modelType == 0) {
    url = data.origin
  }
  else if (modelType == 3) {
    url = data.threeModel
  }
  const name = createdGongWeiName();
  url = window.config.three.urlPrefix + url;
  new LoadFBX(url, (module) => {
    const mesh = module.children[0];
    mesh.position.set(0, 0, 0);
    mesh.url = url;
    mesh.modelId = modelId;
    if (modelType == 0) {
      changfang_Group.children = []
      changfang_Group.add(mesh)
    }
    else if (modelType == 3) {
      mesh.numberId = mesh.uuid;
      moveModule.setObject3D(mesh);
      selectMeshid = mesh.uuid;
      outlinePass.selectedObjects = [mesh];
      mesh.serverId = data.id
      mesh.numberId = mesh.uuid
      mesh.traverse(item => {
        item.name = name;
        item.serverId = mesh.uuid
      })
      sceneInfoDom.value.setSelectMoudleInfo(mesh)
      gongwei_Group.add(mesh)
    }
  });
}

const handleFBX = (mesh) => {
  if (!mesh.isMesh) return;
  if (
    mesh.material instanceof THREE.MeshStandardMaterial ||
    mesh.material instanceof THREE.MeshPhongMaterial ||
    mesh.material instanceof THREE.MeshLambertMaterial
  ) {
  } else {
    const newMaterial = new THREE.MeshStandardMaterial({
      color: mesh.material.color,
      transparent: mesh.material.transparent,
      opacity: mesh.material.opacity,
    });
    mesh.material = newMaterial;
  }
};

let initOk = false;
const handleScne = (data) => {
  if (initOk) {
    if (router.currentRoute.value.path == '/digital-test-design/digital-test-design-index') {
      const twoId = layoutStore.selectedKey.split("-")[1]
      selectScene({ id: twoId, sceneId: data.id }).then(res => {
        Message.success("场景保存成功")
      })
    }
  }
  clearScene()
  initOk = true;
  if (!data || !data.sceneJson) return ;
  if (!data.sceneJson) data.sceneJson = {};
  let {changfang=undefined ,gongwei=[],cameraView={}} = data.sceneJson;
  if(changfang){
    loadMesh(changfang,0);
  }
  gongwei.map(gw=>{
    if(data.stationInfos){
      const serverdata = data.stationInfos.find(item=>item.number == gw.numberId)
      gw.serverId = serverdata.id
    }
    loadMesh(gw,3);
  })
}

const clearScene = ()=>{
  changfang_Group.children = []
  gongwei_Group.children = []
  unselectModule();
}

const saveScene = (data) => {
  let changfang = changfang_Group.children[0]
  if (!data.sceneJson) data.sceneJson={};
  if (!data.stationInfoParams) data.stationInfoParams=[];

  if(changfang){
    let {position,scale,rotation,url} = changfang
    data.sceneJson.changfang = {position,scale,rotation,url}
  }
  let gongweiArr = [];
  const stationInfoParams = []
  gongwei_Group.children.map(gongwei=>{
    let {position,scale,rotation,url,modelId,numberId,serverId} = gongwei
    if(!numberId) numberId = gongwei.uuid
    gongweiArr.push({position,scale,rotation,url,modelId,numberId,id:serverId});
    stationInfoParams.push({modelId,numberId:numberId})
  })
  data.sceneJson.gongwei = gongweiArr;

  stationInfoParams.map(item=>{
    let {modelId,number} = item;
    let ok = data.stationInfoParams.find(data_server=>data_server.number == number)
    if(!ok)data.stationInfoParams.push(item)
  })
  SceneUpdate(data).then(res=>{
    Message.success("更新成功");
    mitter.emit('updateTableData')
  });
}

const loadMesh = (data,modelType)=>{
  let {position,scale,rotation,url,modelId,numberId} = data;
  new LoadFBX(url, (module) => {
    const mesh = module.children[0];
    mesh.position.copy( new THREE.Vector3(position.x,position.y,position.z) );
    mesh.scale.copy( new THREE.Vector3(scale.x,scale.y,scale.z) );
    mesh.rotation.copy( new THREE.Euler(rotation._x,rotation.y,rotation.z, rotation._order) );
    mesh.url = url;
    if(modelType==0){
      changfang_Group.children = []
      changfang_Group.add(mesh)
    }
    else if(modelType==3){
      mesh.modelId = modelId
      mesh.numberId = numberId
      mesh.serverId = data.serverId
      mesh.traverse(obj=>{
        obj.modelId = modelId
        obj.number = numberId
        obj.serverId = data.serverId
      })
      gongwei_Group.add(mesh)
    }
  });
}

const initSelectMesh = (id)=>{
  let mesh = gongwei_Group.children.find(item=>item.serverId == id)
  if(mesh) {
    outlinePass.selectedObjects = [mesh];
    selectMeshid = mesh.uuid;
  }
}

const createdGongWeiName = ()=>{
  let name = "工位"
  let size = gongwei_Group.children.length;
  name = name + size;
  return name
}

const unselectModule = ()=>{
  outlinePass.selectedObjects = [];
  moveModule.unselect();
  selectMeshid = '';
}

const deleteModule = ()=>{
  gongwei_Group.children = gongwei_Group.children.filter( item=> item.uuid != selectMeshid )
  unselectModule()
}

onBeforeUnmount(() => {
  icy.clear();
  renderer = undefined;
  scene = undefined;
  camera = undefined;
  controls = undefined;
  mitter.off("selectScene", handleScne)
  mitter.off("saveScene", saveScene)
});
</script>

<style lang="less" scoped>
body {
  margin: 0;
  padding: 0;
}
.three {
  width: 100%;
  border: 1px solid;
  position: relative;
}
</style>