<template>
  <div class="chart-item">
    <!-- 航天主题标题 -->
    <div class="chart-header">
      <span>🛰️</span>
      <span>航天任务月度趋势分析</span>
    </div>

    <div class="chart-body">
      <div class="chart-wrapper">
        <!-- Y轴刻度 -->
        <div class="y-axis">
          <div class="y-tick" v-for="i in 5" :key="i">
            <span>{{ i * 20 }}</span>
          </div>
        </div>

        <!-- 折线图区域 -->
        <div class="line-chart-box">
          <!-- 网格背景 -->
          <div class="grid-bg"></div>
          
          <!-- 折线 + 渐变晕染区域 -->
          <svg class="line-svg" viewBox="0 0 280 120">
            <!-- 底部渐变晕染 科技感 -->
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#00d9ff" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#008cff" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <!-- 填充晕染面积 -->
            <path 
              :d="linePath + ' L280 120 L0 120 Z'" 
              fill="url(#lineGradient)"
            />
            <!-- 折线主线 -->
            <path 
              :d="linePath" 
              fill="none" 
              stroke="#00d9ff" 
              stroke-width="2"
            />
          </svg>

          <!-- 拐点 + 数值 -->
          <div 
            class="point-item" 
            v-for="(item, index) in lineData" 
            :key="index"
            :style="{ left: index * 56 + 'px', bottom: item.value * 1.2 + 'px' }"
          >
            <div class="point"></div>
            <div class="point-value">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 折线图航天数据
const lineData = ref([
  { label: '1月', value: 60 },
  { label: '2月', value: 12 },
  { label: '3月', value: 45 },
  { label: '4月', value: 20 },
  { label: '5月', value: 33 }
])

// 生成折线路径
const linePath = computed(() => {
  return lineData.value.map((item, index) => {
    const x = index * 56
    const y = 120 - item.value * 1.2
    return index === 0 ? `M${x} ${y}` : `L${x} ${y}`
  }).join(' ')
})
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

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 160px;
  padding-left: 35px;
}

/* Y轴刻度 */
.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  height: 120px;
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

/* 折线图容器 */
.line-chart-box {
  position: relative;
  width: 280px;
  height: 120px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* 网格线 */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 100% 24px;
}

/* SVG 折线 */
.line-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 拐点 */
.point-item {
  position: absolute;
  transform: translateX(-50%);
}

.point {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00d9ff;
  box-shadow: 0 0 8px #00d9ff;
}

.point-value {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  color: #00d9ff;
  font-size: 10px;
  white-space: nowrap;
  text-shadow: 0 0 4px #00d9ff;
}
</style>