import * as THREE from 'three';

class Caster {
  private func: (mesh: any) => void;
  private camera: THREE.Camera;
  private group: THREE.Group;
  private raycaster: THREE.Raycaster;
  private renderer: THREE.WebGLRenderer;

  constructor(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    group: THREE.Group,
    func: (mesh: any) => void
  ) {
    this.func = func;
    this.group = group;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
  }

  public onMouseDown(event: MouseEvent) {
    // 1. 每次点击都重新获取画布尺寸和位置，避免窗口/全屏变化导致偏移
    const dom = this.renderer.domElement;
    const rect = dom.getBoundingClientRect();
    const width = dom.clientWidth;
    const height = dom.clientHeight;

    console.log(
      "鼠标位置",
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    // 2. 正确计算鼠标的 NDC 坐标（-1 ~ 1）
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.camera);
    // 3. 注意：intersectObjects 的第二个参数 true 表示递归查找子物体
    const intersects = this.raycaster.intersectObjects(this.group.children, true);

    if (intersects.length > 0) {
      console.log('✅ 选中物体', intersects[0].object);
      this.func(intersects[0]);
    } else {
      console.log('❌ 未选中物体');
    }
  }

  public clear() {
    // 这里不需要在这里 removeEventListener，因为事件是在外部绑定的
    // 你只需要在外部组件销毁时移除即可
  }
}

export default Caster;