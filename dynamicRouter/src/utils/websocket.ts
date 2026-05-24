import { useWebsocketStore } from '@/store';

class WebSocketService {
  private ws: WebSocket | null = null;
  private store = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    // 延迟获取 store（确保 Pinia 已安装）
    if (!this.store) {
      import('@/store').then(({ useWebsocketStore }) => {
        this.store = useWebsocketStore();
        this._connect();
      }).catch((error) => {
        console.error('❌ 动态导入 store 失败:', error);
      });
    } else {
      this._connect();
    }
  }

  private _connect() {
    // 断开已有连接
    if (this.ws) {
      this.ws.close();
    }

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 建立新连接
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // 在 URL 中携带 token
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ 未找到 Token，WebSocket 连接可能失败');
    }
    
    const url = token ? `${protocol}//localhost:3000?token=${encodeURIComponent(token)}` : `${protocol}//localhost:3000`;
    
    console.log('🔌 正在连接 WebSocket...', url.replace(token, 'token=***')); // 隐藏 token 避免日志泄露
    
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('✅ WebSocket 连接已建立');
      this.reconnectAttempts = 0; // 重置重连次数
      
      // 可选：发送心跳包
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('❌ WebSocket 消息解析失败:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket 错误:', error);
    };

    this.ws.onclose = (event) => {
      console.log(`❌ WebSocket 连接已断开，代码: ${event.code}，原因: ${event.reason}`);
      
      // 如果是认证失败（401），不进行重连
      if (event.code === 1008 || event.reason?.includes('Unauthorized')) {
        console.error('🔒 认证失败，请检查 token 是否有效');
        return;
      }
      
      // 自动重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(3000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
        console.log(`🔄 ${delay/1000}秒后进行第 ${this.reconnectAttempts} 次重连...`);
        
        this.reconnectTimer = setTimeout(() => {
          this._connect();
        }, delay);
      } else {
        console.error('❌ 已达到最大重连次数，停止重连');
      }
    };
  }

  private startHeartbeat() {
    // 每30秒发送一次心跳
    const heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
  }

  private handleMessage(data: { type: number; data: any }) {
    switch (data.type) {
      case 32: // 测点数据
        this.handleMeasurePointData(data.data);
        break;
      case 'pong': // 心跳响应
        //  console.log('💓 心跳响应:', data.timestamp);
        break;
      default:
        console.log('📤 收到未知类型消息:', data);
    }
  }

  private handleMeasurePointData(data: any) {
  const formattedData = Object.entries(data).map(([measuringPointName, value]: [string, any]) => {
    const { channelName, data: valueData, unitCode = '' } = value;
    return [channelName, valueData, measuringPointName, unitCode];
  });

  if (this.store) {
    this.store.setCeDianNowData(formattedData);
  }
  
  // 📌 添加这行代码！
  import('@/utils/EventBus').then(({ default: mitter }) => {
  mitter.emit('wsType32', data);
}).catch((error) => {
  console.error('❌ 动态导入 EventBus 失败:', error); // 添加错误日志
});
}

  sendMessage(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket 未连接，无法发送消息');
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const websocketService = new WebSocketService();