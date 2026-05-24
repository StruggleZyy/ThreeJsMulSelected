// src/utils/threeapi/SelectArea3D.js
import * as THREE from "three";

/**
 * 3D框选核心类（纯Three.js实现，无DOM）
 * 用于在Three.js场景中实现框选功能
 * 1. 监听鼠标拖拽，画出一个选择框
 * 2. 自动计算哪些 3D 物体在框选范围内
 * 3. 返回被选中的物体数组
 * 4. 框选时自动禁用相机拖动，避免干扰
 */
export class SelectArea3D {
  /**
   * 构造函数
   * @param {THREE.Camera} camera - 相机对象
   * @param {THREE.OrbitControls} controls - 轨道控制器
   * @param {THREE.WebGLRenderer} renderer - 渲染器
   * @param {Array} objects - 需要参与框选的对象数组
   */
  constructor(camera, controls, renderer, objects) {
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;
    this.objects = objects || [];
    this.start = new THREE.Vector2();
    this.end = new THREE.Vector2();
    this.drawing = false;
  }

  /**
   * 更新参与框选的对象数组
   * @param {Array} objects - 新的对象数组
   */
  setObjects(objects) {
    this.objects = objects;
  }

  /**
   * 开始框选
   * @param {MouseEvent} e - 鼠标事件
   */
  startSelect(e) {
    console.log("🔴 startSelect 被调用");
    this.drawing = true;
    this.controls.enabled = false; //禁用相机轨道控制器，防止在框选过程中误操作导致相机移动。
    this.start.set(e.clientX, e.clientY);
    this.end.copy(this.start);
    // 当用户刚按下鼠标开始框选时：

    // 起点 this.start 被设置为当前鼠标位置
    // 终点 this.end 需要初始化为和起点相同的位置
    // 这样做的原因：

    // 框选刚开始时，起点和终点重合（框选区域为一个点）
    // 随着鼠标移动，this.end 会不断更新为新的鼠标位置
    // 最终形成一个从起点到终点的矩形区域
  }

  /**
   * 框选移动
   * @param {MouseEvent} e - 鼠标事件
   */
  move(e) {
    if (!this.drawing) return; //为 false（没有在框选），就直接返回
    this.end.set(e.clientX, e.clientY); //鼠标当前移动到的位置
  }

  /**
   * 结束框选
   * @returns {Array} - 选中的对象数组
   */
  endSelect() {
    this.drawing = false;
    this.controls.enabled = true;
    // 打印框选坐标信息
    // console.group('框选结束')
    // console.log('起点:', { x: this.start.x, y: this.start.y })
    // console.log('终点:', { x: this.end.x, y: this.end.y })
    // console.log('区域:', {
    //     width: Math.abs(this.end.x - this.start.x),
    //     height: Math.abs(this.end.y - this.start.y)
    // })
    // console.groupEnd()
    return this.getSelectedObjects();
  }

  /**
   * 找出所有位于框选区域内的 3D 对象
   * @returns {Array} - 选中的对象数组
   */
  getSelectedObjects() {
    const selected = [];
    const rect = this.renderer.domElement.getBoundingClientRect();
    const minX = Math.min(this.start.x, this.end.x); // 框选区域最左边
    const maxX = Math.max(this.start.x, this.end.x); // 框选区域最右边
    const minY = Math.min(this.start.y, this.end.y); // 框选区域最上边
    const maxY = Math.max(this.start.y, this.end.y); // 框选区域最下边

//     为什么用 Math.min 和 Math.max？
// 因为用户可能从右向左或从下向上框选，起点坐标可能大于终点坐标。
    this.objects.forEach((obj) => {
      const screenPos = obj.position.clone().project(this.camera);
      const sx = ((screenPos.x + 1) / 2) * rect.width + rect.left;
      const sy = ((-screenPos.y + 1) / 2) * rect.height + rect.top;

      if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
        selected.push(obj);
      }
    });
    return selected;
  }

  /**
   * 判断是否正在框选
   * @returns {boolean}
   */
  isDrawing() {
    return this.drawing;
  }

  /**
   * 获取框选区域的起点
   * @returns {THREE.Vector2}
   */
  getStartPoint() {
    return this.start.clone();
  }

  /**
   * 获取框选区域的终点
   * @returns {THREE.Vector2}
   */
  getEndPoint() {
    return this.end.clone();
  }
}

export default SelectArea3D;
