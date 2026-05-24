import BarChart from "./BarChart.vue";
import LineChart from "./LineChart.vue";
import PieChart from "./PieChart.vue";

//导出所有图表组件
export const chartTypes = [
  {
    id: "bar",
    name: "柱状图",
    icon: "📊",
    component: BarChart,
  },
  {
    id: "line",
    name: "折线图",
    icon: "📈",
    component: LineChart,
  },
  {
    id: "pie",
    name: "饼图",
    icon: "🥧",
    component: PieChart,
  },
];

export const getSelectedChartType = (id: string) => {
  return chartTypes.find((chart) => chart.id === id)?.component;
};
