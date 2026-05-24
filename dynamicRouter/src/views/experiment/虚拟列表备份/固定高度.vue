<template>
  <div class="gravity-container">
    <!-- 统计信息 -->
    <div class="stats">
      <span>总数据量：{{ data.length.toLocaleString() }} 条</span>
      <span>当前显示：{{ visibleData.length }} 条</span>
    </div>

    <!-- 虚拟列表 -->
    <div
      ref="listContainer"
      class="virtual-list-container"
      @scroll="handleScroll"
    >
      <!-- 占位层：撑起滚动条高度 -->
      <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>

      <!-- 可视区域内容 -->
      <div class="virtual-list-content" :style="{ transform: `translateY(${offset}px)` }">
        <div
          v-for="item in visibleData"
          :key="item.id"
          class="list-item"
          :style="{ height: itemHeight + 'px', lineHeight: itemHeight + 'px' }"
        >
          {{ item.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
export default {
  name: "GravityView",
  setup() {
    // 配置
    const itemHeight = ref(50);
    const visibleExtra = ref(2);

    // DOM 引用
    const listContainer = ref(null);

    // 滚动状态
    const scrollTop = ref(0);
    const visibleHeight = ref(400);

    // 生成测试数据（10000条）
    const data = ref([]);
    for (let i = 0; i < 10000; i++) {
      data.value.push({ id: i, value: `数据项 ${i + 1}` });
    }

    // 计算总高度
    const totalHeight = computed(() => data.value.length * itemHeight.value);

    // 可视区域可显示的项数
    const visibleCount = computed(() => {
      return Math.ceil(visibleHeight.value / itemHeight.value) + visibleExtra.value * 2;
    });

    // 开始索引
    const startIndex = computed(() => {
      return Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - visibleExtra.value);
    });

    // 结束索引
    const endIndex = computed(() => {
      return Math.min(data.value.length, startIndex.value + visibleCount.value);
    });

    // 偏移量
    const offset = computed(() => {
      return startIndex.value * itemHeight.value;
    });

    // 可视数据
    const visibleData = computed(() => {
      return data.value.slice(startIndex.value, endIndex.value);
    });

    // ======================================
    // 滚动事件 + 自动打印所有关键参数
    // ======================================
    const handleScroll = () => {
      if (listContainer.value) {
        scrollTop.value = listContainer.value.scrollTop;

        // ========= 核心打印，让你秒懂 =========
    console.log('======================================');
    console.log('scrollTop      滚动距离：', scrollTop.value);
    console.log('startIndex    缓冲区起始索引：', startIndex.value);
    console.log('offset        偏移量（startOffset）：', offset.value);
    console.log('visibleCount  一屏渲染条数：', visibleCount.value);
    console.log('endIndex      结束索引：', endIndex.value);
    console.log('visibleData   实际渲染：', visibleData.length, '条');
    console.log('页面第一条数据：', visibleData[0]?.value, '（索引：', visibleData[0]?.id, '）');
    console.log('======================================\n');
      }
    };

    // 组件挂载
    onMounted(() => {
      if (listContainer.value) {
        visibleHeight.value = listContainer.value.clientHeight;
      }
    });

    return {
      listContainer,
      data,
      itemHeight,
      totalHeight,
      visibleData,
      offset,
      handleScroll
    };
  }
};
</script>

<style scoped>
.gravity-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 虚拟列表容器 */
.virtual-list-container {
  flex: 1;
  min-height: 400px;
  overflow-y: auto;
  position: relative;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}

/* 占位层 */
.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

/* 可视内容 */
.virtual-list-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

/* 列表项 */
.list-item {
  padding: 0 20px;
  border-bottom: 1px solid #eee;
  color: #333;
  font-size: 14px;
  box-sizing: border-box;
}

.list-item:hover {
  background: #f5f5f5;
}

/* 统计信息 */
.stats {
  margin-top: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
}

.stats span {
  color: #666;
  font-size: 14px;
}
</style>