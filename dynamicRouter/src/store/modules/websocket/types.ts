/*
 * @Description: file content
 * @Version: Do not edit
 * @Autor: Hansy
 * @Date: 2023-11-29 16:47:54
 * @LastEditors: fyy
 * @LastEditTime: 2025-06-23 14:08:27
 * @FilePath: \src\store\modules\websocket\types.ts
 */

export interface WebsocketState {
  ceDianNowData: any;
  tongdaoData: [];
  tableData: object;
  JLtableData: object;
  conditionData: object;
  selectOption: object;
  lineChartData: object;
  warningData: [];
  pointData: [];
  testStatus: object;
  time: string;
  shuqiaoData: number;
  backTime: any;
}