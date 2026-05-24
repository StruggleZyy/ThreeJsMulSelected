/*
 * @Description: file content
 * @Version: Do not edit
 * @Autor: fyy
 * @Date: 2025-09-05 15:00:48
 * @LastEditors: fyy
 */

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

class LoadOBJ {
  static objLoader = new OBJLoader();
  static FBXList = [];

  static {}

  constructor(url: string, func = () => {}, progressfunc = () => {}) {
    LoadOBJ.objLoader.load(url, (model) => { func(model) }, progressfunc);
  }
}

export default LoadOBJ;