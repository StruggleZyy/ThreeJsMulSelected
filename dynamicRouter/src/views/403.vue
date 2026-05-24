<template>
  <div class="forbidden-container">
    <div class="forbidden-content">
      <div class="icon">⛔</div>
      <h1>403</h1>
      <p>您没有权限访问此页面</p>
      <el-button type="primary" @click="goBack">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.forbidden-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.forbidden-content {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 64px;
  margin-bottom: 16px;
}

h1 {
  font-size: 48px;
  color: #f56c6c;
  margin: 0 0 12px 0;
}

p {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
}
</style>