/*
 * @Autor: Hansy
 * @Date: 2025-05-23 11:26:28
 * @LastEditors: fyy
 */

import * as THREE from 'three';

class LoadSTP {
  constructor(url: string, func = () => {}) {
    octimptjs().then(async (occt) => {
      const fileUrl = url;
      let response;
      try {
        response = await fetch(fileUrl);
      } catch (error) {
        throw new Error(`模型地址出错，出错地址为${fileUrl}`);
      }
      const buffer = await response.arrayBuffer();
      const fileBuffer = new Uint8Array(buffer);
      const result = occt.ReadStepFile(fileBuffer, null);
      result.meshes.forEach((meshData) => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(meshData.attributes.position.array);
        const indices = new Uint32Array(meshData.index.array);
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions, 3)
        );
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        const material = new THREE.MeshStandardMaterial({
          color: meshData.color
            ? new THREE.Color(
                meshData.color[0],
                meshData.color[1],
                meshData.color[2]
              )
            : new THREE.Color(1, 1, 1),
        });
        const mesh = new THREE.Mesh(geometry, material);
        func(mesh);
      });
    });
  }
}

export default LoadSTP;