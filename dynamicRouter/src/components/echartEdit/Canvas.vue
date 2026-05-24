<template>
  <div
    class="canvas"
    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    @drop="handleDrop"
    @dragover.prevent
    @click="handleCanvasClick"
  >
   <!-- ✅ 渲染所有已添加的组件 -->
   <div v-for="component in chartStore.components" :key="component.id"  class="chart-item"  :style="{
        left: component.x + 'px',
        top: component.y + 'px',
        width: component.width + 'px',
        height: component.height + 'px'
      }">
   
    <div>
    
      <component :is="getSelectedChartType(component.type)" :id="component.id" />
    </div>
   </div>
 

     <!-- 提示文字（只有没有组件时显示） -->
    <div v-if="chartStore.components.length === 0" class="empty-state">
      <span class="icon">📊</span>
      <p>拖拽组件到此处</p>
    </div>
  </div>  
</template>

<script setup lang="ts">
import { useChartStore } from "../../store/chartStore";
import { onMounted } from "vue";
import { getSelectedChartType } from "../../packages/index";
const chartStore = useChartStore();
const { canvasWidth, canvasHeight } = chartStore;

const handleDrop = (e: DragEvent) => {
 e.preventDefault()  // 阻止默认行为（也就是浏览器默认的不能放置）。允许放置
  const typeSelect = e.dataTransfer.getData('chartType')
  console.log('使用从组件页ComponentList拖拽的chartType', typeSelect)

  //目前我已经获取到了拖拽组件的类型，下一步就是将获取的类型 添加到store
  if(typeSelect){
     // 计算放置位置（鼠标相对于画布的坐标）
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left - 150  // 居中放置，减去一半宽度
    const y = e.clientY - rect.top - 100   // 居中放置，减去一半高度

    // 调用 store 的方法添加组件
    chartStore.addComponent({
     
      type: typeSelect,  // 组件类型
      name: typeSelect,  // 先用类型名称作为显示名称
      icon: '📊',       // 默认图标
      x: Math.max(0, x),  // 确保不超出画布边界
      y: Math.max(0, y),
      width: 300,
      height: 200
    })
     const id = chartStore.selectedId
     console.log('id', id)
    // console.log('组件已添加到画布')
   console.log(`组件已添加到画布!组件类型: ${typeSelect}, 位置: (${x}, ${y})`)
  }
  
};

// onMounted(()=>{
//  handleDrop()
// })
</script>

<style scoped>
.canvas {
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  position: relative;  /* 关键：让子元素可以绝对定位 */
  display: flex;       /* 让提示文字居中 */
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 48px;
}

p {
  color: rgba(255, 255, 255, 0.4);
  margin: 10px 0 0 0;
}
.chart-item {
  position: absolute;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: move;
  transition: box-shadow 0.3s;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.empty-state .icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
}
</style>
