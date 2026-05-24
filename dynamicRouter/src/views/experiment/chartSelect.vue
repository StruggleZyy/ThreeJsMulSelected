<template>
  <div class="editor">
    <div class="header">
      <h1>图表编辑器</h1>
      <p>拖拽组件到画布进行编辑</p>
    </div>
    
    <div class="main-content">
      <ComponentList />
      
      <div class="canvas-wrapper">
        <Canvas />
      </div>
      
      <ConfigPanel />
    </div>
  </div>
</template>

<script setup>
import ConfigPanel from '@/components/echartEdit/ConfigPanel.vue'
import Canvas from '@/components/echartEdit/Canvas.vue'
import ComponentList from '@/components/echartEdit/ComponentList.vue'
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.header {
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  color: #fff;
  font-size: 24px;
  margin: 0 0 8px 0;
}

.header p {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  padding: 20px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>