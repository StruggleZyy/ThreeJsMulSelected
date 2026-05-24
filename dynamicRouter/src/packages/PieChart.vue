<template>
  <div class="chart-item">
    <!-- 航天主题标题 -->
    <div class="chart-header">
      <span>🛰️</span>
      <span>航天器类型占比统计</span>
    </div>

    <div class="chart-body">
      <div class="pie-wrapper">
        <!-- 饼图 -->
        <div class="pie-chart"></div>
        <!-- 图例 -->
        <div class="legend">
          <div class="legend-item" v-for="(item, index) in legendData" :key="index">
            <div class="dot" :style="{ background: item.color }"></div>
            <span>{{ item.name }}</span>
            <span>{{ item.value }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const legendData = [
  { name: '载人飞船', value: 35, color: '#00d9ff' },
  { name: '卫星', value: 40, color: '#008cff' },
  { name: '探测器', value: 15, color: '#409eff' },
  // { name: '空间站', value: 10, color: '#69b1ff' },
]
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

.chart-body {
  flex: 1;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* 科技感饼图 */
.pie-chart {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(
    #00d9ff 0% 35%,
    #008cff 35% 75%,
    #409eff 75% 90%,
    #69b1ff 90% 100%
  );
  box-shadow: 0 0 20px rgba(0, 140, 255, 0.4);
  position: relative;
}
.pie-chart::after {
  content: '';
  position: absolute;
  width: 70px;
  height: 70px;
  background: #1a1a1a;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* 图例 */
.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 12px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-item span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}
</style>