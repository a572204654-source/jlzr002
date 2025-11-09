# 微信云托管 Socket.IO 集成指南

## 📖 概述

本指南介绍如何在微信小程序中使用 `wx.cloud.connectContainer` API 连接腾讯云托管的 Socket.IO 服务，实现实时双向通信，**无需备案域名**。

### 核心优势

✅ **无需备案域名** - 使用微信云托管提供的容器连接能力  
✅ **完整的 Socket.IO 支持** - 手动实现 Engine.IO 和 Socket.IO 协议  
✅ **实时双向通信** - 支持事件发送、接收、房间管理等  
✅ **自动重连** - 内置断线重连机制  
✅ **心跳保活** - 自动处理心跳包维持连接  

### 技术背景

**问题：**
- 微信云托管提供的测试 WSS 地址无法用于正式发布
- 小程序端 `weapp.socketio` 库同样仅限测试环境
- 在缺乏备案域名的情况下，无法直接使用 WebSocket 连接

**解决方案：**
利用微信云托管的 `wx.cloud.connectContainer` API 建立与后端容器的 WebSocket 连接。由于该 API 提供的是标准的 WebSocket 连接，我们需要在客户端手动实现 Engine.IO 和 Socket.IO 协议。

### 协议基础

#### Engine.IO (v4) - 底层传输协议

负责建立连接、心跳、消息分帧等。数据包类型：

- `0`: OPEN - 连接初始化
- `1`: CLOSE - 关闭连接
- `2`: PING - 心跳请求
- `3`: PONG - 心跳响应
- `4`: MESSAGE - 上层消息
- `5`: UPGRADE - 协议升级
- `6`: NOOP - 空操作

#### Socket.IO (v5) - 高层协议

构建在 Engine.IO 之上，提供命名空间、房间、事件广播等功能。数据包类型：

- `0`: CONNECT - 连接到命名空间
- `1`: DISCONNECT - 从命名空间断开
- `2`: EVENT - 事件
- `3`: ACK - 事件确认
- `4`: CONNECT_ERROR - 命名空间连接错误
- `5`: BINARY_EVENT - 二进制事件
- `6`: BINARY_ACK - 二进制确认

**关键理解：** 一个 Socket.IO 通信包通常由两个数字开头。第一个数字是 Engine.IO 类型，第二个数字是 Socket.IO 类型。例如，`40` 表示 Engine.IO 的 MESSAGE 包，其内容是 Socket.IO 的 CONNECT 包。

---

## 🏗️ 架构说明

```
┌─────────────────┐         wx.cloud.connectContainer         ┌─────────────────┐
│   微信小程序    │ ◄──────────────────────────────────────► │  腾讯云托管容器  │
│                 │                                            │                 │
│  CloudBase      │         手动实现 Socket.IO 协议           │   Socket.IO     │
│  SocketIO       │                                            │   Server        │
│  Client         │                                            │                 │
└─────────────────┘                                            └─────────────────┘
       │                                                              │
       │ 1. 发送 Engine.IO OPEN                                      │
       │ ────────────────────────────────────────────────────────►   │
       │                                                              │
       │ 2. 接收 Engine.IO OPEN 响应（包含 pingInterval）              │
       │ ◄────────────────────────────────────────────────────────   │
       │                                                              │
       │ 3. 发送 Socket.IO CONNECT (40)                              │
       │ ────────────────────────────────────────────────────────►   │
       │                                                              │
       │ 4. 接收 Socket.IO CONNECT 响应 (40)                         │
       │ ◄────────────────────────────────────────────────────────   │
       │                                                              │
       │ 5. 发送 Socket.IO EVENT (42["event", data])                │
       │ ────────────────────────────────────────────────────────►   │
       │                                                              │
       │ 6. 接收 Socket.IO EVENT (42["event", data])                │
       │ ◄────────────────────────────────────────────────────────   │
       │                                                              │
       │ 7. 定时发送 Engine.IO PING (2)                              │
       │ ────────────────────────────────────────────────────────►   │
       │                                                              │
       │ 8. 接收 Engine.IO PONG (3)                                  │
       │ ◄────────────────────────────────────────────────────────   │
```

---

## 🔧 后端配置

### 1. 安装依赖

```bash
npm install socket.io
```

### 2. 修改 `bin/www`

```javascript
#!/usr/bin/env node

var app = require('../app');
var debug = require('debug')('express:server');
var http = require('http');

var port = normalizePort(process.env.PORT || '80');
app.set('port', port);

// 创建 HTTP 服务器
var server = http.createServer(app);

// 初始化 Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// 将 io 实例挂载到 app 上
app.set('io', io);

console.log('Socket.IO 服务器已初始化');

// 初始化 Socket.IO 路由处理
if (app.initSocketIO) {
  app.initSocketIO();
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// ... 其他代码 ...
```

### 3. 创建 Socket.IO 路由处理

在 `routes/realtime-voice-socketio.js` 中：

```javascript
const express = require('express')
const router = express.Router()
const { verifyToken } = require('../utils/jwt')

/**
 * 初始化 Socket.IO 实时语音识别
 */
function initSocketIO(io) {
  console.log('正在初始化 Socket.IO 实时语音识别服务...')

  // 创建命名空间
  const voiceNamespace = io.of('/realtime-voice')

  voiceNamespace.on('connection', (socket) => {
    console.log('Socket.IO 客户端已连接:', socket.id)

    // 监听客户端的 'start' 事件
    socket.on('start', async (data) => {
      try {
        // 验证 token
        const token = data.token
        if (!token) {
          socket.emit('error', { message: '缺少认证信息' })
          socket.disconnect()
          return
        }

        const decoded = verifyToken(token)
        const userId = decoded.userId

        console.log('开始实时识别，用户ID:', userId)

        // 发送就绪消息
        socket.emit('ready', {
          message: '识别服务已就绪'
        })

      } catch (error) {
        console.error('处理 start 事件错误:', error)
        socket.emit('error', {
          message: error.message || '初始化失败'
        })
      }
    })

    // 监听客户端的 'audio' 事件
    socket.on('audio', (data) => {
      // 处理音频数据
      console.log('收到音频数据:', data)
      
      // 发送识别结果
      socket.emit('result', {
        text: '这是识别结果',
        isFinal: false
      })
    })

    // 监听客户端的 'stop' 事件
    socket.on('stop', () => {
      socket.emit('stopped', {
        message: '识别已停止'
      })
    })

    // 监听断开连接
    socket.on('disconnect', () => {
      console.log('Socket.IO 客户端已断开:', socket.id)
    })
  })

  console.log('Socket.IO 实时语音识别服务初始化完成')
}

module.exports = {
  router,
  initSocketIO
}
```

### 4. 在 `app.js` 中注册路由

```javascript
// 实时语音识别路由（Socket.IO版本）
const { router: realtimeVoiceSocketIORouter, initSocketIO } = require('./routes/realtime-voice-socketio');

// 注册路由
app.use('/api/realtime-voice-socketio', realtimeVoiceSocketIORouter);

// 初始化 Socket.IO
app.initSocketIO = function() {
  const io = app.get('io');
  if (io) {
    initSocketIO(io);
    console.log('Socket.IO 实时语音识别已初始化');
  }
};
```

---

## 📱 前端集成

### 1. 复制客户端类

将 `miniapp-example/utils/cloudbase-socketio-client.js` 复制到你的小程序项目中。

### 2. 使用客户端

```javascript
const CloudBaseSocketIOClient = require('../../utils/cloudbase-socketio-client')

Page({
  data: {
    isConnected: false,
    service: 'your-service-name' // 替换为你的云托管服务名称
  },

  onLoad() {
    this.initSocketIO()
  },

  async initSocketIO() {
    // 创建客户端实例
    this.socketClient = new CloudBaseSocketIOClient({
      service: this.data.service,
      namespace: '/realtime-voice', // Socket.IO 命名空间
      debug: true // 开启调试日志
    })

    // 监听连接成功事件
    this.socketClient.onInternal('connect', () => {
      console.log('Socket.IO 连接成功')
      this.setData({ isConnected: true })

      // 发送 start 事件
      this.socketClient.emit('start', {
        token: wx.getStorageSync('token'),
        userId: wx.getStorageSync('userInfo').id
      })
    })

    // 监听断开连接事件
    this.socketClient.onInternal('disconnect', () => {
      console.log('Socket.IO 断开连接')
      this.setData({ isConnected: false })
    })

    // 监听服务端事件
    this.socketClient.on('ready', (data) => {
      console.log('服务就绪:', data)
    })

    this.socketClient.on('result', (data) => {
      console.log('识别结果:', data)
    })

    this.socketClient.on('error', (data) => {
      console.error('错误:', data)
    })

    // 连接到云托管容器
    await this.socketClient.connect()
  },

  // 发送事件到服务端
  sendAudio() {
    this.socketClient.emit('audio', {
      data: 'base64_audio_data',
      isEnd: false
    })
  },

  // 断开连接
  onUnload() {
    if (this.socketClient) {
      this.socketClient.disconnect()
    }
  }
})
```

### 3. 配置云托管服务名称

在小程序中，将 `service` 参数替换为你的云托管服务名称。你可以在腾讯云控制台的云托管服务列表中找到。

---

## 🚀 部署步骤

### 1. 部署后端到微信云托管

```bash
# 构建 Docker 镜像
docker build -t your-image-name .

# 推送到云托管
# 参考微信云托管文档
```

### 2. 配置小程序

在小程序的 `app.json` 或页面配置中添加云开发配置：

```json
{
  "cloud": true
}
```

在 `app.js` 中初始化云开发：

```javascript
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true
      })
    }
  }
})
```

### 3. 测试连接

在小程序开发工具中测试 Socket.IO 连接是否正常。

---

## 📋 完整示例

### 后端完整示例

请参考 `routes/realtime-voice-socketio.js` 文件。

### 前端完整示例

请参考 `miniapp-example/pages/realtime-voice-cloudbase/` 目录。

---

## 🔍 API 参考

### CloudBaseSocketIOClient

#### 构造函数

```javascript
new CloudBaseSocketIOClient(options)
```

**参数：**
- `options.service` (string) - 云托管服务名称（必需）
- `options.namespace` (string) - Socket.IO 命名空间，默认 '/'
- `options.debug` (boolean) - 是否开启调试日志，默认 false
- `options.reconnectDelay` (number) - 重连延迟（毫秒），默认 3000

#### 方法

##### `connect(service)`

连接到云托管容器。

```javascript
await client.connect('your-service-name')
```

##### `emit(eventName, ...args)`

发送 Socket.IO 事件到服务器。

```javascript
client.emit('start', { token: 'xxx', userId: 123 })
```

##### `on(eventName, handler)`

监听服务器发送的事件。

```javascript
client.on('result', (data) => {
  console.log('收到结果:', data)
})
```

##### `off(eventName, handler)`

移除事件监听器。

```javascript
client.off('result', handler)
```

##### `onInternal(eventName, handler)`

监听内部事件（connect, disconnect, ws_close, ws_error）。

```javascript
client.onInternal('connect', () => {
  console.log('已连接')
})
```

##### `disconnect()`

断开连接。

```javascript
client.disconnect()
```

##### `isConnected()`

获取连接状态。

```javascript
const connected = client.isConnected()
```

---

## ❓ 常见问题

### Q1: 连接失败，显示"连接云托管容器失败"

**A:** 请检查：
1. 是否正确初始化了云开发（`wx.cloud.init()`）
2. `service` 参数是否正确（需要与云托管服务名称一致）
3. 小程序是否开启了云开发能力
4. 是否在真机上测试（开发工具可能不支持）

### Q2: 连接成功但收不到消息

**A:** 请检查：
1. 后端 Socket.IO 命名空间是否正确
2. 前端监听的事件名称是否与后端发送的一致
3. 开启 `debug: true` 查看详细日志

### Q3: 心跳超时断开连接

**A:** 这是正常的心跳保活机制。客户端会自动重连。如果频繁断开，可能是：
1. 网络不稳定
2. 后端配置的心跳间隔过短
3. 服务器资源不足导致响应慢

### Q4: 如何处理重连

**A:** 客户端内置了自动重连机制。你可以监听连接状态：

```javascript
client.onInternal('connect', () => {
  console.log('连接成功')
})

client.onInternal('disconnect', () => {
  console.log('连接断开，将自动重连')
})
```

### Q5: 能否在开发工具中测试

**A:** 微信开发工具对云托管容器连接的支持有限，建议在真机上测试。

### Q6: 与传统 WebSocket 有什么区别

**A:** 
- 传统 WebSocket 需要备案域名，本方案不需要
- 本方案使用 `wx.cloud.connectContainer` API，只能连接云托管容器
- 需要手动实现 Socket.IO 协议，但客户端已经封装好了

---

## 🔗 参考资料

1. [无自有域名实现微信云托管 Socket.IO WebSocket](https://blog.csdn.net/z329600208z/article/details/153698728)
2. [Socket.IO 官方文档](https://socket.io/docs/v4/)
3. [Engine.IO 协议文档](https://socket.io/docs/v4/engine-io-protocol/)
4. [微信云托管文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/container/)
5. [wx.cloud.connectContainer API](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/utils/Cloud.connectContainer.html)

---

## 📝 更新日志

### v1.0.0 (2025-11-09)

- ✨ 初始版本
- ✅ 实现 CloudBaseSocketIOClient 客户端类
- ✅ 实现后端 Socket.IO 路由处理
- ✅ 提供完整示例代码
- 📖 编写详细的使用文档

---

## 📄 许可证

MIT License

---

## 💬 反馈与支持

如有问题或建议，请提交 Issue 或 Pull Request。

---

**Happy Coding! 🎉**

