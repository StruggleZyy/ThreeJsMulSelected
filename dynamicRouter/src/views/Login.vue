<template>
  <div class="login-container">
    <div class="login-form">
      <h2 class="login-title">航天管理系统</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="0px"
        class="login-form-content"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item prop="role">
          <el-select
            v-model="loginForm.role"
            placeholder="选择角色"
            size="large"
            style="width: 100%"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/index.js'
import { initDynamicRoutes } from '@/router/dynamicRoutes.js'
import axios from 'axios'
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  role: ''

  // username: 'admin',      // 🚀 开发模式：默认用户名
  // password: 'password',     // 🚀 开发模式：默认密码
  // role: 'admin'    
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 调用真实的登录API
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: loginForm.username,
      password: loginForm.password
    })
  // console.log('=== 登录返回数据 ===')
  //   console.log('完整响应:', response.data)
  //   console.log('用户数据:', response.data.data)
    if (response.data.code === 200) {
      // 登录成功，保存用户信息到store
      userStore.login(response.data.data)
      
      // 设置axios默认header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`
      // 关键：重新加载动态路由
  await initDynamicRoutes(router)
      ElMessage.success(response.data.message)
      router.push('/')
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    console.error('登录失败:', error)
    const message = error.response?.data?.message || '登录失败，请重试'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(8, 19, 47, 0.85), rgba(2, 12, 31, 0.65)), url('/images/1.jpeg') no-repeat center center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 24px;
}

.login-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 25%);
  z-index: 1;
}

.login-form {
  position: relative;
  z-index: 2;
  width: 360px;
  max-width: 100%;
  padding: 12px 38px 22px 38px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.22);
}

.login-title {
  text-align: center;
  margin-bottom: 23px;
  color: #1f2a3c;
  font-size: 26px;
  font-weight: 700;
}

.login-form-content {
  max-width: 100%;
}

.el-form-item {
  margin-bottom: 18px;
}

.el-input__inner,
.el-select .el-input__inner {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(31, 42, 60, 0.16);
  border-radius: 10px;
  box-shadow: inset 0 1px 2px rgba(31, 42, 60, 0.06);
}

.el-input__inner:focus,
.el-select .el-input__inner:focus {
  border-color: #409eff;
}

.el-input__inner:hover,
.el-select .el-input__inner:hover {
  border-color: rgba(31, 42, 60, 0.24);
}

.el-button {
  border-radius: 10px;
  font-weight: 600;
  background: #409eff;
  border-color: #409eff;
}

.el-button:hover {
  background: #3a8de0;
}
</style>