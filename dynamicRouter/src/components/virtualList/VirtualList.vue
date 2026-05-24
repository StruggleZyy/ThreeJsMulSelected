<template>
  <div class="virtual-list-wrapper">
    <!-- 👇 固定显示在上方的隐藏区域（历史记录） -->
    <div v-if="hiddenHistoryItems.length" class="hidden-history-container">
      <div class="history-header">
        <span>📋 滚动隐藏记录 (最近 {{ hiddenHistoryItems.length }} 项)</span>
        <button class="clear-btn" @click="clearHistory">清空</button>
      </div>
      <div class="history-list">
        <div 
          class="history-item" 
          v-for="item in hiddenHistoryItems" 
          :key="item.index"
        >
          <span class="history-index">#{{ item.index }}</span>
          <span class="history-preview">{{ item.preview }}</span>
        </div>
      </div>
      <div class="history-split-line">
        ⬇ 以下为当前可视区域 ⬇
      </div>
    </div>

    <!-- 虚拟列表滚动容器 -->
    <div ref="list" @scroll="scrollEvent" :style="{ height }" class="infinite-list-container">
      <div ref="phantom" class="infinite-list-phantom"></div>
      <div ref="content" class="infinite-list">
        <div
          class="infinite-list-item"
          ref="items"
          :id="item._index"
          :key="item._index"
          v-for="item in visibleData"
        >
          <slot :item="item.item"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUpdated, watch, nextTick } from 'vue'

const props = defineProps({
  listData: {
    type: Array,
    default: () => []
  },
  estimatedItemSize: {
    type: Number,
    required: true
  },
  bufferScale: {
    type: Number,
    default: 1
  },
  height: {
    type: String,
    default: '400px'
  },
  maxHistoryItems: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:visibleCount'])

const list = ref(null)
const phantom = ref(null)
const content = ref(null)
const items = ref([])

const screenHeight = ref(0)
const start = ref(0)
const end = ref(0)
// 1. 位置信息存储 (positions 数组)
const positions = ref([]) // 存储每个item的 { index, height, top, bottom }

// 存储已经滚动隐藏掉的数据（历史记录）
const hiddenHistory = ref([])

const _listData = computed(() => {
  return props.listData.map((item, index) => ({
    _index: `_${index}`,
    item
  }))
})

const visibleCount = computed(() => {
  return Math.ceil(screenHeight.value / props.estimatedItemSize)
})

const aboveCount = computed(() => {
  return Math.min(start.value, props.bufferScale * visibleCount.value)
})

const belowCount = computed(() => {
  return Math.min(props.listData.length - end.value, props.bufferScale * visibleCount.value)
})

const visibleData = computed(() => {
  let startIdx = start.value - aboveCount.value
  let endIdx = end.value + belowCount.value
  return _listData.value.slice(startIdx, endIdx)
})

// 显示的历史记录（最新的几条）
const hiddenHistoryItems = computed(() => {
  return hiddenHistory.value.slice(-props.maxHistoryItems)
})

// 获取内容预览
const getPreview = (item, index) => {
  const text = item.value || item.content || item.text || ''
  if (text) {
    return text.length > 40 ? text.substring(0, 40) + '...' : text
  }
  return `ID: ${item.id || index}`
}

// 更新历史记录：记录新滚出可视区域的数据
const updateHistory = (newStart, oldStart) => {
  if (newStart > oldStart) {
    // 向下滚动，记录新滚出去的数据
    for (let i = oldStart; i < newStart && i < props.listData.length; i++) {
      const item = props.listData[i]
      if (item && !hiddenHistory.value.some(h => h.index === i)) {
        hiddenHistory.value.push({
          index: i,
          id: item.id,
          preview: getPreview(item, i),
          timestamp: Date.now()
        })
      }
    }
  }
  
  // 限制历史记录数量
  if (hiddenHistory.value.length > props.maxHistoryItems * 2) {
    hiddenHistory.value = hiddenHistory.value.slice(-props.maxHistoryItems)
  }
}

// 清空历史记录
const clearHistory = () => {
  hiddenHistory.value = []
}
// 初始化位置信息：根据预估高度计算位置（使用预估高度）
const initPositions = () => {
  positions.value = props.listData.map((d, index) => ({
    index,
    height: props.estimatedItemSize,
    top: index * props.estimatedItemSize,
    bottom: (index + 1) * props.estimatedItemSize
  }))
}

const getStartIndex = (scrollTop = 0) => {
  return binarySearch(positions.value, scrollTop)
}

const binarySearch = (list, value) => {
  let start = 0
  let end = list.length - 1
  let tempIndex = null

  while (start <= end) {
    let midIndex = Math.floor((start + end) / 2)
    let midValue = list[midIndex].bottom
    if (midValue === value) {
      return midIndex + 1
    } else if (midValue < value) {
      start = midIndex + 1
    } else if (midValue > value) {
      if (tempIndex === null || tempIndex > midIndex) {
        tempIndex = midIndex
      }
      end = midIndex - 1
    }
  }
  return tempIndex
}
// 3. 动态更新实际高度（核心！）
const updateItemsSize = () => {
  let nodes = items.value
  nodes.forEach((node) => {
    let rect = node.getBoundingClientRect()  // 获取实际渲染后的元素尺寸
    let height = rect.height
    let index = +node.id.slice(1)
    let oldHeight = positions.value[index].height
    let dValue = oldHeight - height
    
    if (dValue !== 0) {
      // 更新当前item的高度和bottom
      positions.value[index].bottom = positions.value[index].bottom - dValue
      positions.value[index].height = height
      
      // 递归更新后续所有item的位置（关键！）
      for (let k = index + 1; k < positions.value.length; k++) {
        positions.value[k].top = positions.value[k - 1].bottom
        positions.value[k].bottom = positions.value[k].bottom - dValue
      }
    }
  })
}
const setStartOffset = () => {
  if (!content.value) return
  
  let startOffset
  if (start.value >= 1) {
    let size = positions.value[start.value].top -
      (positions.value[start.value - aboveCount.value]
        ? positions.value[start.value - aboveCount.value].top
        : 0)
    startOffset = positions.value[start.value - 1].bottom - size
  } else {
    startOffset = 0
  }
  content.value.style.transform = `translate3d(0,${startOffset}px,0)`
}

let oldStart = 0
const scrollEvent = () => {
  let scrollTop = list.value.scrollTop
  const newStart = getStartIndex(scrollTop)
  
  // 更新历史记录
  updateHistory(newStart, oldStart)
  oldStart = newStart
  
  start.value = newStart
  end.value = start.value + visibleCount.value
  setStartOffset()
  
  emit('update:visibleCount', visibleData.value.length)
}

onMounted(() => {
  screenHeight.value = list.value.clientHeight
  start.value = 0
  end.value = start.value + visibleCount.value
  oldStart = 0
  initPositions()
  
  let totalHeight = positions.value[positions.value.length - 1].bottom
  phantom.value.style.height = totalHeight + 'px'
})

onUpdated(() => {
  nextTick(() => {
    updateItemsSize()
    let totalHeight = positions.value[positions.value.length - 1].bottom
    phantom.value.style.height = totalHeight + 'px'
    setStartOffset()
  })
})

watch(() => props.listData, () => {
  initPositions()
  hiddenHistory.value = [] // 数据变化时清空历史
  oldStart = 0
  if (list.value) {
    list.value.scrollTop = 0
    scrollEvent()
  }
})
</script>

<style scoped>
.virtual-list-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 历史记录容器 - 固定在上方 */
.hidden-history-container {
  background: #f9f9f9;
  border-bottom: 2px solid #ff9800;
  max-height: 200px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #ececec;
  border-bottom: 1px solid #ddd;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.clear-btn {
  background: #ff9800;
  color: white;
  border: none;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.clear-btn:hover {
  background: #f57c00;
}

.history-list {
  overflow-y: auto;
  max-height: 150px;
}

.history-item {
  padding: 6px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  transition: background 0.2s;
}

.history-item:hover {
  background: #eeeeee;
}

.history-index {
  color: #ff9800;
  font-weight: 600;
  flex-shrink: 0;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.history-preview {
  color: #999;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-split-line {
  padding: 1px 1px;
  background: linear-gradient(90deg, #ff9800, #ffcc80);
  color: white;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  letter-spacing: 2px;
}

/* 虚拟列表容器 */
.infinite-list-container {
  overflow: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  flex: 1;
}

.infinite-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.infinite-list {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.infinite-list-item {
  padding: 12px;
  color: #555;
  box-sizing: border-box;
  border-bottom: 1px solid #eee;
  background: #fff;
}
</style>