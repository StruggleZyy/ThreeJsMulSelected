// src/store/modules/websocket/index.ts
import { defineStore } from 'pinia';

const useWebsocketStore = defineStore('websocket', {
  state: () => ({
    ceDianNowData: [],
    JLtableData: null,
    selectOption: null,
    warningData: [],
    lineChartData: null,
    pointData: [],
    testStatus: null,
    conditionData: null,
    time: '',
    shuqiaoData: 0,
    tongdaoData: null,
    backTime: 0,
  }),
  getters: {
    getCeDianNowData(state) {
      return state.ceDianNowData;
    },
  },
  actions: {
    setCeDianNowData(data: any[]) {
      this.ceDianNowData = data;
    },
    setJLTableData(data: object) {
      this.JLtableData = data;
    },
    setSelectOption(data: object) {
      this.selectOption = data;
    },
    setWarningData(data: []) {
      this.warningData = data;
    },
    setLineChartData(data: object) {
      this.lineChartData = data;
    },
    setPointData(data: []) {
      this.pointData = data;
    },
    setTestStatus(data: object) {
      this.testStatus = data;
    },
    setConditionData(data: object) {
      this.conditionData = data;
    },
    setTime(data: string) {
      this.time = data;
    },
    setShuqiaoData(data: number) {
      this.shuqiaoData = data;
    },
    setTongdaoData(data: object) {
      this.tongdaoData = data;
    },
    setBackTime(data: number) {
      this.backTime = data;
    },
  },
});

export default useWebsocketStore;