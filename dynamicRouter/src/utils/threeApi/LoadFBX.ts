/*
 * @Description: file content
 * @Version: Do not edit
 * @Autor: Hansy
 * @Date: 2025-05-23 11:26:28
 * @LastEditors: fyy
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

class LoadFBX {
  static fbxLoader = new FBXLoader();
  static FBXList = [];

  // 初始化方法（延迟调用，确保 window.config 已定义）
  static init() {
    console.log('🔄 初始化 LoadFBX...');
    
    // 检查 window.config.three 是否存在
    if (!window.config?.three?.cedianModule) {
      console.warn('⚠️ window.config.three.cedianModule 未定义，跳过模型预加载');
      return;
    }

    console.log('📦 开始预加载模型...');
    for (const key in window.config.three.cedianModule) {
      const value = window.config.three.cedianModule[key];
      if (value) {
        new LoadFBX(value, (module) => {
          const mesh = module.children[0];
          mesh.name = key;
          LoadFBX.FBXList.push(mesh);
        });
      }
    }
  }

  constructor(url: string, func = () => {}) {
    LoadFBX.fbxLoader.load(url, (model) => {
      func(model);
    });
  }
}

export default LoadFBX;