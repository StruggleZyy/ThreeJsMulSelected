// src/router/dynamicRoutes.js
import axios from 'axios'
import Layout from '@/layout/index.vue'

// 使用 require.context 来动态导入组件
const viewModules = import.meta.glob('@/views/**/*.vue')

export async function initDynamicRoutes(router) {
  // console.log('🚀 开始加载动态路由...')
  
  try {
    const token = localStorage.getItem('token')
    console.log('🔑 token:', token ? '存在' : '不存在')
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    
    const res = await axios.get('http://localhost:3000/api/menu/list')
    const menuList = res.data.data
    // console.log('📋 获取到菜单数据:', JSON.stringify(menuList, null, 2))

    let count = 0
    menuList.forEach(group => {
      group.children.forEach(child => {
        if (child.path === '/') return

        // 路由路径（移除开头的 /）
        const routePath = child.path.startsWith('/') ? child.path.slice(1) : child.path
        // console.log('🛤️ 路由路径:', routePath)

        // 组件路径
        const componentPath = `/src/views${child.path}.vue`
        
        // 注册路由 - 使用 require.context 获取组件
        router.addRoute('HomeLayout', {
          path: routePath,
          name: routePath.replace(/\//g, '-'),
          component: viewModules[componentPath] || (() => import('@/views/Home.vue')),
          meta: child.meta
        })

        count++
        // console.log(`✅ 已注册路由 ${count}:`, routePath)
      })
    })

    const allRoutes = router.getRoutes()
    // console.log('📊 所有注册的路由:', allRoutes.map(r => ({ path: r.path, name: r.name, parentName: r.parentName })))
    // console.log('✅ 所有动态路由加载完成，共注册', count, '个路由')
    
  } catch (err) {
    console.error('❌ 路由加载失败', err.message || err)
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
}