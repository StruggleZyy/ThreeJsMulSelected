<template>
  <div class="layout">
    <!-- 左侧图标栏 -->
    <div class="icon-sidebar">
      <div 
        v-for="item in IconMenus" 
        :key="item.key" 
        class="icon-item"
        :class="{ active: activeMenu === item.key }"
        @click="handleClick(item)"
      >
        <div class="icon-emoji">{{ item.icon }}</div>
        <div class="icon-text">{{ item.key }}</div>
      </div>
    </div>

    <!-- 中间二级菜单栏 -->
    <div class="sub-sidebar">
      <div class="sub-header" v-if="currentFirstMenu.key">
        <h3>{{ currentFirstMenu.key }}</h3>
      </div>
      <el-menu
        mode="vertical"
        router    
        :default-active="currentSecondMenu?.path"
        background-color="#fff"
        text-color="#5a5e66"
        active-text-color="#409eff"
        class="sub-menu"
      >
        <el-menu-item 
          v-for="item in currentSubMenus" 
          :key="item.path"  
          :index="item.path"
          @click="currentSecondMenu = item"
        >
          <span>{{ item.name }}</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧内容区域 -->
    <div class="main">
      <div class="page-top">
        <div class="page-top-title">系统管理控制台</div>
        <div class="header-actions">
          <el-button type="text" class="logout-btn" @click="handleLogout">退出登录</el-button>
        </div>
      </div>

      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-if="currentFirstMenu.key">
            {{ currentFirstMenu.key }}
          </el-breadcrumb-item>
          <el-breadcrumb-item v-if="currentSecondMenu">
            {{ currentSecondMenu.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from '@/store/index.js'

const IconMenus = ref([]);
const allMenus = ref([]);
const activeMenu = ref("首页");
const currentFirstMenu = ref({});
const route = useRoute();
const currentSecondMenu = ref(null);
const router = useRouter();
const userStore = useUserStore();

onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:3000/api/menu/list");
    allMenus.value = res.data.data;
    IconMenus.value = allMenus.value.map((item) => ({
      key: item.key,
      icon: item.icon,
    }));
    
    if (IconMenus.value.length > 0) {
      handleClick(IconMenus.value[0]);
    }
  } catch (error) {
    console.log("获取菜单失败", error);
    // 如果获取菜单失败，可能是token过期，跳转到登录页
    if (error.response?.status === 401) {
      userStore.logout()
      router.push('/login')
    }
  }
});

const currentSubMenus = computed(() => {
  const menu = allMenus.value.find((m) => m.key === activeMenu.value);
  return menu ? menu.children : [];
});

function handleClick(item) {
  activeMenu.value = item.key;
  currentFirstMenu.value = allMenus.value.find((m) => m.key === item.key);
  currentSecondMenu.value = null;
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  background: #f0f2f5;
}

/* 左侧图标栏 */
.icon-sidebar {
  width: 80px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.icon-item {
  width: 56px;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.icon-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.icon-emoji {
  font-size: 24px;
  margin-bottom: 6px;
}

.icon-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.icon-item.active .icon-text {
  color: #fff;
}

/* 中间二级菜单 */
.sub-sidebar {
  width: 200px;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.sub-header {
  padding: 20px 16px;
  border-bottom: 1px solid #eee;
}

.sub-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.sub-menu {
  border-right: none !important;
  flex: 1;
}

:deep(.sub-menu .el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin: 4px 12px;
  border-radius: 8px;
}

:deep(.sub-menu .el-menu-item:hover) {
  background: #ecf5ff !important;
}

:deep(.sub-menu .el-menu-item.is-active) {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

/* 右侧内容 */
.main {
  flex: 1;
  padding: 0 16px 16px;
  overflow-y: auto;
}

.page-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* width: 100%; */
  padding: 14px 12px;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.page-top-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
}

.logout-btn {
  color: #409eff;
  font-weight: 600;
}

.logout-btn:hover {
  color: #006bb8;
}

.breadcrumb {
  height: 40px;
  background: #fff;
  margin-bottom: 16px;
  line-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
}

.content {
  background: #fff;
  /* padding: 20px; */
  border-radius: 8px;
  min-height: calc(100% - 56px);
  height: 100%;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 隐藏 Firefox 滚动条 */
* {
  scrollbar-width: none;
}

/* 隐藏 IE/Edge 滚动条 */
* {
  -ms-overflow-style: none;
}
</style>