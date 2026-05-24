import { defineStore } from 'pinia'
import {ref} from 'vue'

import type{ChartComponent} from '@/types/index'

  export const useChartStore = defineStore('chart',()=>{
  // 状态
  const components = ref<ChartComponent[]>([])  // 画布上的所有组件
  const selectedId = ref<string | null>(null)    // 当前选中的组件ID
  const canvasWidth = ref(1200)                  // 画布宽度
  const canvasHeight = ref(600)                 // 画布高度
  //添加组件
  function addComponent(component: ChartComponent) {
    const newComponent: ChartComponent = {
      id: Date.now().toString(),
      type: component.type,
      name: component.name,
      icon: component.icon,
      x: component.x,
      y: component.y,
       width: 300,
      height: 200
    }
    components.value.push(newComponent)
    selectedId.value = newComponent.id
  }

   function selectComponent(id: string | null) {
    selectedId.value = id
  }

  function deleteComponent(id: string) {
    components.value = components.value.filter(component => component.id !== id)
    selectedId.value = null
  }
  return {
    components,
    selectedId,
    canvasWidth,
    canvasHeight,
    addComponent,
    deleteComponent,
    selectComponent,
   
  }
  })       