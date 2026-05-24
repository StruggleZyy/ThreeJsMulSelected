// server/routes/virtualReal.js
const Router = require('koa-router');
const router = new Router({ prefix: '/api/virtual-real' });

// 模拟测点数据
const mockMeasurePoints = {
  '温度测点1': { channelName: '温度', data: '82.93', unitCode: '°C' },
  '温度测点2': { channelName: '温度', data: '75.45', unitCode: '°C' },
  '温度测点3': { channelName: '温度', data: '68.21', unitCode: '°C' },
};
// 📌 新增：测点配置数据（包含位置信息）
const mockMeasurePointsConfig = {
  '温度测点1': { 
    id: 'point1',
    name: '温度测点1',
    x: 10, 
    y: 13, 
    z: 0, 
    channelName: '温度', 
    data: '82.93',
    unitCode: '°C' 
  },
  '温度测点2': { 
    id: 'point2',
    name: '温度测点2',
    x: 5, 
    y: 10, 
    z: -1, 
    channelName: '温度', 
    data: '75.45',
    unitCode: '°C' 
  },
  '温度测点3': { 
    id: 'point3',
    name: '温度测点3',
    x: -10, 
    y: 15, 
    z: 3, 
    channelName: '温度', 
    data: '68.21',
    unitCode: '°C' 
  }
};
// 测点选择接口
router.post('/selected-measure-points', (ctx) => {
  const { names } = ctx.request.body;
  console.log('📋 收到测点选择请求:', names);
  
  const result = {};
  names.forEach((name) => {
    if (mockMeasurePoints[name]) {
      result[name] = mockMeasurePoints[name];
    }
  });
  
  ctx.body = result;
});
// 📌 新增：获取测点配置接口
router.get('/measure-points/config', (ctx) => {
  console.log('📡 收到测点配置请求');
  ctx.body = {
    code: 200,
    message: 'success',
    data: mockMeasurePointsConfig
  };
});

module.exports = { router };