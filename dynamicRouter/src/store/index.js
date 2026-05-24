import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

// 导入其他 store
import useLayoutStore from './modules/layout';
import useWebsocketStore from './modules/websocket';

export const useUserStore = defineStore("user", () => {
  // 用户基本信息
  const userInfo = ref({
    id: "",
    username: "",
    nickname: "",
    avatar: "",
    department: "",
    position: "",
  });

  // 认证信息
  const token = ref("");
  const refreshToken = ref("");

  // 权限信息
  const roles = ref([]);
  const permissions = ref([]);

  // 登录状态
  const isLoggedIn = ref(false);

  // 登录方法
  function login(loginData) {
    userInfo.value = loginData.user;
    token.value = loginData.token;
    roles.value = loginData.roles;
    permissions.value = loginData.permissions;
    isLoggedIn.value = true;

    localStorage.setItem("token", loginData.token);
    localStorage.setItem("userInfo", JSON.stringify(loginData.user));
    localStorage.setItem("roles", JSON.stringify(loginData.roles));
    localStorage.setItem("permissions", JSON.stringify(loginData.permissions));
  }

  // 登出方法
  function logout() {
    userInfo.value = {};
    token.value = "";
    roles.value = [];
    permissions.value = [];
    isLoggedIn.value = false;

    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
  }

  // 初始化方法（从localStorage恢复状态并验证token）
  async function initFromStorage() {
    const savedToken = localStorage.getItem("token");
    const savedUserInfo = localStorage.getItem("userInfo");
    const savedRoles = localStorage.getItem("roles");
    const savedPermissions = localStorage.getItem("permissions");

    if (savedToken && savedUserInfo) {
      try {
        // 向服务器验证 token 是否有效
        const response = await axios.get('http://localhost:3000/api/auth/validate');
        
        if (response.data.code === 200) {
          // token 有效，恢复状态
          token.value = savedToken;
          userInfo.value = JSON.parse(savedUserInfo);
          roles.value = savedRoles ? JSON.parse(savedRoles) : [];
          permissions.value = savedPermissions ? JSON.parse(savedPermissions) : [];
          isLoggedIn.value = true;
          
          axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
          console.log('✅ Token 验证成功，用户已登录');
        } else {
          // token 无效，清除状态
          logout();
          console.log('❌ Token 验证失败，已清除登录状态');
        }
      } catch (error) {
        // 请求失败（网络错误、401 等），清除状态
        logout();
        console.log('❌ Token 验证异常，已清除登录状态:', error.message);
      }
    } else {
      console.log('ℹ️ 未找到本地存储的登录信息');
    }
  }
// src/store/index.js
// async function initFromStorage() {
//   const savedToken = localStorage.getItem("token");
//   const savedUserInfo = localStorage.getItem("userInfo");
//   const savedRoles = localStorage.getItem("roles");
//   const savedPermissions = localStorage.getItem("permissions");

//   console.log('=== initFromStorage 调试 ===');
//   console.log('savedToken:', savedToken ? '存在' : '不存在');
//   console.log('savedUserInfo:', savedUserInfo ? '存在' : '不存在');

//   if (savedToken && savedUserInfo) {
//     try {
//       // ✅ 关键：先设置请求头
//       axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
//       console.log('已设置 Authorization 头');
      
//       // 然后发送验证请求
//       const response = await axios.get('http://localhost:3000/api/auth/validate');
//       console.log('validate 响应:', response.data);
      
//       if (response.data.code === 200) {
//         // token 有效，恢复状态
//         token.value = savedToken;
//         userInfo.value = JSON.parse(savedUserInfo);
//         roles.value = savedRoles ? JSON.parse(savedRoles) : [];
//         permissions.value = savedPermissions ? JSON.parse(savedPermissions) : [];
//         isLoggedIn.value = true;
        
//         console.log('✅ Token 验证成功，用户已登录');
//         console.log('用户角色:', roles.value);
//       } else {
//         console.log('❌ Token 验证失败');
//         logout();
//       }
//     } catch (error) {
//       console.error('❌ Token 验证异常:', error.response?.status, error.message);
//       logout();
//     }
//   } else {
//     console.log('ℹ️ 未找到本地存储的登录信息');
//   }
// }
  return {
    userInfo,
    token,
    refreshToken,
    roles,
    permissions,
    isLoggedIn,
    login,
    logout,
    initFromStorage,
  };
});

// 导出其他 store
export { useLayoutStore, useWebsocketStore };