// src/router/index.js (主路由配置)
import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue' // 你的布局文件
import { useUserStore } from '@/store/index.js'
// 基础路由
const baseRoutes = [
   {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: Layout, // 👈 首页先加载布局
     name: 'HomeLayout', // 👈 添加 name，用于动态路由挂载
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
         meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/403.vue')
  }
  // {
  //   path: '/:pathMatch(.*)*',
  //   redirect: '/'
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes: baseRoutes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
//  console.log('=== 路由守卫调试 ===')
//   console.log('要去的位置:', to.path)
//   console.log('用户角色:', userStore.roles)
//   console.log('路由元信息:', to.meta)
  if (to.path === '/login') {
    next()
    return
  }

  // 检查是否登录
  if (!userStore.isLoggedIn) {
    next('/login') // 未登录用户强制跳转到登录页
    return
  }



  // 检查路由权限
  if (to.meta.requiresAuth) {
    // 如果路由需要特定角色
    if (to.meta.roles && to.meta.roles.length > 0) {
      const hasRole = to.meta.roles.some(role => userStore.roles.includes(role))
      if (!hasRole) {
        next('/403') // 或者跳转到无权限页面
        return
      }
    }
  }

  next()
})
export default router