/*
 * @Description: file content
 * @Version: Do not edit
 * @Autor: Hansy
 * @Date: 2025-05-23 11:26:28
 * @LastEditors: fyy
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class LoadGLB {
  static GLTFLoader = new GLTFLoader();

  static {}

  constructor(url: string, func = () => {}) {
    LoadGLB.GLTFLoader.load(url, (model) => {
      func(model);
    });
  }
}

export default LoadGLB;