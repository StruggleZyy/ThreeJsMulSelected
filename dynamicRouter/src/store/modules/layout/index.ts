import { defineStore } from 'pinia';

// 类型定义（直接放在文件内部，避免接口导出问题）
interface dataObject {
  id: number;
  name: string;
}

interface infoListObject {
  test?: dataObject & { testCode: string };
  testWorkCondition?: dataObject;
  testMeasurement?: dataObject;
}

interface layoutState {
  selectedKey: string;
  infoList: infoListObject;
  breadcrumbEndStrArr: string[];
  reflash: boolean;
}

// 从 localStorage 中寻找存储的信息
const saveKey = localStorage.getItem('key') || '';
const saveInfoListString = localStorage.getItem('infoList');
let saveInfoList = {};
if (saveInfoListString) {
  saveInfoList = JSON.parse(saveInfoListString);
} else {
  saveInfoList = {};
}

const useLayoutStore = defineStore('layout', {
  state: (): layoutState => ({
    selectedKey: saveKey,
    infoList: saveInfoList,
    breadcrumbEndStrArr: [],
    reflash: false,
  }),
  getters: {
    getSelectedKey(state: layoutState): string {
      return state.selectedKey;
    },
    getInfoList(state: layoutState): infoListObject {
      return state.infoList;
    },
    getBreadcrumbEndStrArr(state: layoutState): string[] {
      return state.breadcrumbEndStrArr;
    },
    getReflash(state: layoutState): boolean {
      return state.reflash;
    },
  },
  actions: {
    setSelectedKey(data: string) {
      this.selectedKey = data;
    },
    setInfoList(data: infoListObject) {
      this.infoList = data;
    },
    setBreadcrumbEndStrArr(data: string[]) {
      this.breadcrumbEndStrArr = data;
    },
  },
});

export default useLayoutStore;