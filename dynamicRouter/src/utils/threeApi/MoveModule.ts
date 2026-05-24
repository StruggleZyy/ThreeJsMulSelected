import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

export default class MoveModule {
  private scene;
  private camera;
  private renderer;
  private orbitControls;
  private obj;
  private func;
  private mode;

  public transformControls;

  constructor(scene, camera, renderer, orbitControls, func) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.orbitControls = orbitControls;
    this.func = func;
    this.create();
  }

  create() {
    const transformControls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );
    transformControls.name = '鼠标拖拽控制器';
    transformControls.setMode('translate');
    transformControls.addEventListener(
      'dragging-changed',
      this.changedFunc.bind(this)
    );
    transformControls.addEventListener(
      'objectChange',
      this.changedFunc.bind(this)
    );
    this.scene.add(transformControls);
    this.transformControls = transformControls;
  }

  changedFunc(event) {
    const { value } = event;
    this.orbitControls.enabled = false;
    if (value === false) {
      this.orbitControls.enabled = true;
    }
  }

  setObject3D(obj) {
    this.transformControls.visible = true;
    this.transformControls.attach(obj);
    this.obj = obj;
  }

  unselect() {
    this.transformControls.visible = false;
  }

  moveFunc(event) {
    this.func(this.obj, event);
  }

  show(ok) {
    if (ok) {
      this.transformControls.domElement.style.display = 'none';
    } else {
      this.transformControls.domElement.style.display = 'block';
    }
  }

  render() {
    this.orbitControls.update();
  }
}