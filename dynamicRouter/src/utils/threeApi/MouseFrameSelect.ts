import * as THREE from 'three';

class MouseFrameSelect {
  public domDiv;
  private startX = 0;
  private startY = 0;
  private renderer;
  private state = 0;

  constructor(renderer) {
    const raycaster = new THREE.Raycaster();
    const domDiv = document.createElement('div');
    domDiv.classList.add('frameselect');
    domDiv.setAttribute(
      'style',
      `
      border: 1px solid rgba(200,0,0,0.5);
      box-shadow:0 10px rgba(200,0,0,0.2);
      background:rgba(100,0,0,0.05);
      position: absolute;
      pointer-events:none;
    `
    );
    renderer.domElement.after(domDiv);
    this.domDiv = domDiv;
    this.renderer = renderer;
  }

  setStartPoint(x, y) {
    this.startX = x;
    this.startY = y;
    this.state = 1;
    this.domDiv.style.visibility = 'visible';
  }

  updateDomDiv(x, y) {
    if (this.startX == 0 && this.startY == 0) {
      return;
    }
    if (this.state == 0) {
      return;
    }
    this.domDiv.style.top = `${y <= this.startY ? y : this.startY}px`;
    this.domDiv.style.left = `${x <= this.startX ? x : this.startX}px`;
    this.domDiv.style.width = `${x <= this.startX ? this.startX - x : x - this.startX}px`;
    this.domDiv.style.height = `${y <= this.startY ? this.startY - y : y - this.startY}px`;
  }

  public selectMeshArr(group, camera) {
    this.domDiv.style.visibility = 'hidden';

    const domDivPosition = this.domDiv.getBoundingClientRect();
    const threePosition = this.renderer.domElement.getBoundingClientRect();
    const leftP = [domDivPosition.x, domDivPosition.y];
    const rightP = [
      domDivPosition.x + domDivPosition.width,
      domDivPosition.y + domDivPosition.height,
    ];
    const width = this.renderer.domElement.offsetWidth;
    const height = this.renderer.domElement.offsetHeight;
    const selectGroup = group.children.filter((item) => {
      const v3 = new THREE.Vector3().copy(item.position);
      const vector = v3.project(camera);
      let x = Math.round(vector.x * (width / 2) + width / 2);
      let y = Math.round(-vector.y * (height / 2) + height / 2);
      x += threePosition.x;
      y += threePosition.y;
      return x >= leftP[0] && x <= rightP[0] && y >= leftP[1] && y <= rightP[1];
    });

    return selectGroup;
  }

  public getWidth() {
    return this.domDiv.style.height;
  }

  public clear() {
    this.startX = 0;
    this.startY = 0;
    this.domDiv.style.top = `0`;
    this.domDiv.style.left = `0`;
    this.domDiv.style.width = `0`;
    this.domDiv.style.height = `0`;
    this.domDiv.style.visibility = 'hidden';
    this.state = 0;
  }
}

export default MouseFrameSelect;