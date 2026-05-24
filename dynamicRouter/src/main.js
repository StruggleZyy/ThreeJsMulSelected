// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
// 👇 新增：引入 Arco Design
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import { websocketService } from './utils/websocket'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const { useUserStore } = await import('./store')
  const userStore = useUserStore()
  await userStore.initFromStorage()

  const { initDynamicRoutes } = await import('./router/dynamicRoutes')
  await initDynamicRoutes(router)

  app.use(router)
  app.use(ElementPlus)
  app.use(ArcoVue)

  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        const store = useUserStore()
        store.logout()
        router.push('/login')
      }
      return Promise.reject(error)
    }
  )

  app.mount('#app')

  // 启动 WebSocket 连接
  websocketService.connect()
}

bootstrap()