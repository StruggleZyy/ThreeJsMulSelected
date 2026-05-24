// 定义了图表组件的数据结构，包括位置、尺寸等属性。

// ChartComponent - 组件列表所需
// id、type、name、icon → 用于在列表中展示组件的基本信息
// x、y、width、height → 用于记录组件在画布上的位置和尺寸
export interface ChartComponent{
    id:string
    type:string
    name:string
    icon:string
    x:number
    y:number
    width:number
    height:number
}
// ChartConfig - 组件配置面板所需
// title → 图表标题配置
// color → 图表颜色配置
export interface ChartConfig{
    title:string
    color:string
}