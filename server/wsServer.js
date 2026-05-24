const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// 模拟测点数据（包含位置信息）
// 修改 mockMeasurePoints，添加温度测点3，移除压力测点1
const mockMeasurePoints = {
  '温度测点1': { channelName: '温度', unitCode: '°C', x: 10, y: 5, z: 0 },
  '温度测点2': { channelName: '温度', unitCode: '°C', x: 15, y: 5, z: 0 },
  '温度测点3': { channelName: '温度', unitCode: '°C', x: -10, y: 15, z: 3 },  // 📌 添加这个
};

// JWT 密钥（应该与你的应用保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

let wsServer;

function initWebSocket(server) {
  wsServer = new WebSocket.Server({ 
    server,
    verifyClient: (info, cb) => {
      const params = new URLSearchParams(info.req.url.slice(1));
      const token = params.get('token');
      
      console.log('🔐 WebSocket 握手验证:', token ? '有 Token' : '无 Token');
      
      // 开发环境跳过验证（方便测试）
      // if (process.env.NODE_ENV === 'development') {
        cb(true);
        return;
      // }
      
      // 生产环境验证
      if (!token) {
        console.log('❌ 缺少 Token，连接被拒绝');
        cb(false, 401, 'Unauthorized: Missing token');
        return;
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token 验证通过，用户:', decoded.username);
        info.req.user = decoded;
        cb(true);
      } catch (error) {
        console.log('❌ Token 无效:', error.message);
        cb(false, 401, 'Unauthorized: Invalid token');
      }
    }
  });

  wsServer.on('connection', (ws, req) => {
    console.log('✅ WebSocket 客户端已连接');

    // 定时发送模拟数据（每2秒）
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const data = generateMockData();
        ws.send(JSON.stringify({ type: 32, data }));
      }
    }, 995);

    ws.on('message', (message) => {
      console.log('📥 收到消息:', message.toString());
      try {
        const data = JSON.parse(message.toString());
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          default:
            console.log('未知消息类型:', data.type);
        }
      } catch (error) {
        console.log('消息解析失败:', error.message);
      }
    });

    ws.on('close', (code, reason) => {
      console.log('❌ WebSocket 客户端已断开连接');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      clearInterval(interval);
    });
  });

  console.log('🚀 WebSocket 服务器已启动');
}

function generateMockData() {
  const result = {};
  Object.keys(mockMeasurePoints).forEach((name) => {
    const config = mockMeasurePoints[name];
    // 生成随机数据（模拟实时变化）
    const value = (Math.random() * 100).toFixed(2);
    result[name] = {
      ...config, // 包含 x, y, z, channelName, unitCode
      data: value, // 实时数据值
    };
  });
  return result;
}

module.exports = { initWebSocket };