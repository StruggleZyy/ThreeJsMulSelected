<template>
  <div class="chart-item">
    <!-- 航天主题标题 -->
    <div class="chart-header">
      <span>🚀</span>
      <span>航天运载能力统计</span>
    </div>

    <div class="chart-body">
      <!-- 外层容器：相对定位，用于放置坐标轴 -->
      <div class="chart-wrapper">
        <!-- Y轴刻度线 -->
        <div class="y-axis">
          <div class="y-tick" v-for="i in 5" :key="i">
            <span>{{ i * 20 }}</span>
          </div>
        </div>

        <!-- 柱状图区域 -->
        <div class="simple-bar-chart">
          <div class="bar-item" v-for="(item, index) in chartData" :key="index">
            <!-- 柱子数值 -->
            <div class="bar-value">{{ item.value }}</div>
            <!-- 柱子 -->
            <div class="bar" :style="{ height: item.value + '%' }"></div>
            <!-- X轴标签 -->
            <div class="bar-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 航天数据
const chartData = ref([
  { label: '长征5号', value: 60 },
  { label: '长征7号', value: 12 },
  { label: '长征2F', value: 45 },
  { label: '天问一号', value: 20 },
  { label: '神舟飞船', value: 33 }
])
</script>

<style scoped>
.chart-item {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

/* 标题 */
.chart-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-header span:first-child {
  margin-right: 8px;
}

.chart-header span:last-child {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

/* 图表主体 */
.chart-body {
  flex: 1;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图表容器（包含坐标轴 + 柱子） */
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 160px;
  display: flex;
  padding-left: 35px; /* 给Y轴留空间 */
}

/* Y轴刻度 */
.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.y-tick {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  text-align: right;
  padding-right: 4px;
}

/* 柱状图区域 */
.simple-bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  gap: 10px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0 5px;
}

/* 单个柱子组 */
.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

/* 柱子数值 */
.bar-value {
  color: #00d9ff;
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 3px;
  text-shadow: 0 0 6px #00d9ff;
}

/* 柱子 */
.bar {
  width: 22px;
  background: linear-gradient(to top, #008cff, #00d9ff);
  border-radius: 3px 3px 0 0;
  box-shadow: 0 0 10px rgba(0, 140, 255, 0.6);
}

/* X轴标签 */
.bar-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  margin-top: 4px;
  white-space: nowrap;
}
</style>