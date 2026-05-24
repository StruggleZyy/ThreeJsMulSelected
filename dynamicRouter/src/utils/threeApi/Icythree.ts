import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import Stats from 'three/examples/jsm/libs/stats.module';

class Icythree {
  public scene;
  public renderer;
  public dom: Document;
  public camera: THREE.PerspectiveCamera;
  public controls: any;
  public outlinePass;
  public composer;
  public effectFXAA;
  public stats; // 帧率展示

  constructor(dom: Document) {
    this.dom = dom;
    this.createdScene();
    this.createdCamera();
    this.createdRenderer();
    this.createdLight();
    this.createdControls();
    this.createdOutlinePass();
    this.createdStats();
  }

  createdScene() {
    const scene = new THREE.Scene();
    this.scene = scene;
  }

  createdCamera() {
    console.log("相机大小", this.dom.clientWidth, this.dom.clientHeight);
    const camera = new THREE.PerspectiveCamera(
      75,
      this.dom.clientWidth / this.dom.clientHeight,
      0.009,
      99999
    );
    this.camera = camera;
  }

  createdControls() {
    // const controls = new OrbitControls(this.camera, this.renderer.domElement);
    const controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls = controls;
  }

  createdLight() {
    const Ambient = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(Ambient);

    const Sun = new THREE.DirectionalLight(0xffffff, 0.8);
    Sun.position.set(10, 10, 10);
    this.scene.add(Sun);
  }

  createdOutlinePass() {
    const composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);

    const outlinePass = new OutlinePass(
      new THREE.Vector2(this.dom.clientWidth, this.dom.clientHeight),
      this.scene,
      this.camera
    );
    outlinePass.edgeStrength = 3;
    outlinePass.edgeGlow = 0.1;
    outlinePass.edgeThickness = 1;
    outlinePass.pulsePeriod = 2;
    outlinePass.visibleEdgeColor.set(0xff0000);
    outlinePass.hiddenEdgeColor.set(0xff0000);
    composer.addPass(outlinePass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(
      1 / this.dom.clientWidth,
      1 / this.dom.clientHeight
    );
    effectFXAA.renderToScreen = true;
    composer.addPass(effectFXAA);

    this.effectFXAA = effectFXAA;
    this.outlinePass = outlinePass;
    this.composer = composer;
  }

  createdRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(this.dom.clientWidth, this.dom.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer = renderer;
  }

  updateRender() {
    const width = this.dom.clientWidth - 1;
    const height = this.dom.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.outlinePass.setSize(width, height);
    this.effectFXAA.uniforms.resolution.value.set(1 / width, 1 / height);
    this.effectFXAA.renderToScreen = true;

    this.animate();
  }

  createdStats() {
    this.stats = new Stats();
    this.stats.dom.style.right = 0;
    this.stats.dom.style.left = 'auto';
    this.stats.dom.style.position = 'absolute';
    this.dom.appendChild(this.stats.dom);
  }

  animate() {
    this.renderer.render(this.scene, this.camera);
    if (this.composer) this.composer.render();
    if (this.stats) this.stats.update();
  }

  clear() {}
}

export default Icythree;