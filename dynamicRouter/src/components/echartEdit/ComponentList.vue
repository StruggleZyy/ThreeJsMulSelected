<template>
  <div class="component-list"><h3>图表组件</h3>
  <div  draggable="true"  @dragstart="handleDragStart($event, item.id)" class="component-item" v-for="item in chartTypes" :key="item.id">
    <div class="component-icon">{{item.icon}}</div>
    <div class="component-name">{{item.name}}</div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { chartTypes } from '../../packages/index'
import {onMounted} from 'vue'

const handleDragStart = (e: DragEvent, type: string) => {
 
  console.log('存储在左侧的组件列表拖拽的chartType', type)
  
  if (e.dataTransfer) {
    e.dataTransfer.setData('chartType',type)
    e.dataTransfer.effectAllowed = 'copy'
  }
}
function logData() {
  console.log('chartTypes', chartTypes);
}
onMounted(() => {
  logData();
  // handleDragStart(e, type)
})
</script>

<style scoped>
.component-list {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
}
.component-list h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.component-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.3s;
}

.component-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.component-item:active {
  cursor: grabbing;
}

.icon {
  font-size: 24px;
  margin-right: 12px;
}

.name {
  color: #fff;
  font-size: 14px;
}
</style>
