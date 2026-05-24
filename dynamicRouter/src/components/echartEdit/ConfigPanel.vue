<template>
  <div class="config-panel">
    <h3>组件配置</h3>
    <div v-if="selectedComponent" class="config-content">
      <div class="config-item">
        <label>组件名称</label>
        <input v-model="selectedComponent.name" />
      </div>

      <div class="config-item">
        <label>位置 X</label>
        <input v-model="selectedComponent.x" />
      </div>

      <div class="config-item">
        <label>位置 Y</label>
        <input v-model="selectedComponent.y" />
      </div>

      <div class="config-item">
        <label>宽度</label>
        <input v-model="selectedComponent.width" />
      </div>

      <div class="config-item">
        <label>高度</label>
        <input v-model="selectedComponent.height" />
      </div>

      <button class="delete-btn" @click="deleteSelected">删除组件</button>
    </div>
    <div v-else class="empty-config">
      <p>请选择一个组件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChartStore } from "../../store/chartStore";
import { computed } from "vue";
const chartStore = useChartStore();
const selectedComponent = computed(() => {
  return chartStore.components.find(component=>component.id === chartStore.selectedId )

});

const deleteSelected=()=>{
  if(selectedComponent.value){
    chartStore.deleteComponent(selectedComponent.value.id)
  }
}
</script>

<style scoped>
.config-panel {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  width: 280px;
}

.config-panel h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.config-content {
  display: flex;
  flex-direction: column;
}

.config-item {
  margin-bottom: 15px;
}

.config-item label {
  display: block;
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

.config-item input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.delete-btn {
  margin-top: 20px;
  padding: 10px;
  background: #e74c3c;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: background 0.3s;
}

.delete-btn:hover {
  background: #c0392b;
}

.empty-config {
  color: #666;
  text-align: center;
  padding: 40px 0;
}
</style>
