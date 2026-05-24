import axios from 'axios';

const service = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res.data;  // 直接返回data
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default service;