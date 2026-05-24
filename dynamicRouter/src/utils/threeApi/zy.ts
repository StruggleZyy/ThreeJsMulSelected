import * as THREE from 'three'

export class ZySelectArea3D{
    constructor(camera,controls,renderer,objects) {
       this.camera=camera
       this.controls=controls
       this.renderer=renderer
       this.objects=objects || []//用户传了物体我就用你的，没传我就用空数组兜底，保证代码永远不报错。
  
    this.start=new THREE.Vector2() // 框选起点（屏幕坐标）
    this.end=new THREE.Vector2()  // 框选终点（屏幕坐标）
    this.drawing=false  //是否正在框选

     // ======================================
    // 在这里加打印：刚创建时，初始的起点和终点
    // ======================================
    console.log("【初始】框选起点 start：", this.start.x, this.start.y);
    console.log("【初始】框选终点 end：", this.end.x, this.end.y);
    }
}