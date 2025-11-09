# Socket.IO 云托管版本 - 快速开始

## 🎯 概述

本项目提供了一套完整的 **微信小程序 + Socket.IO + 微信云托管** 解决方案，让你能够在**无需备案域名**的情况下实现实时双向通信。

## ✨ 特性

- ✅ **无需备案域名** - 使用 `wx.cloud.connectContainer` 连接云托管容器
- ✅ **手动实现 Socket.IO 协议** - 完整支持 Engine.IO 和 Socket.IO v5
- ✅ **实时语音识别示例** - 完整的流式语音识别实现
- ✅ **自动重连** - 内置断线重连机制
- ✅ **心跳保活** - 自动处理心跳包
- ✅ **事件驱动** - 支持自定义事件发送和接收

## 📦 项目结构

```
.
├── bin/www                                    # 启动脚本（含 Socket.IO 初始化）
├── routes/
│   └── realtime-voice-socketio.js             # Socket.IO 路由处理
├── miniapp-example/
│   ├── utils/
│   │   └── cloudbase-socketio-client.js       # Socket.IO 客户端类
│   └── pages/
│       └── realtime-voice-cloudbase/          # 完整示例页面
│           ├── realtime-voice-cloudbase.js
│           ├── realtime-voice-cloudbase.wxml
│           ├── realtime-voice-cloudbase.wxss
│           └── realtime-voice-cloudbase.json
└── docs/
    └── Socket.IO云托管集成指南.md            # 完整使用文档
```

## 🚀 快速开始

### 1. 后端部署

#### 安装依赖

```bash
npm install socket.io
```

#### 部署到微信云托管

```bash
# 按照微信云托管文档构建和部署 Docker 镜像
```

### 2. 小程序集成

#### 复制文件

将以下文件复制到你的小程序项目：

1. `miniapp-example/utils/cloudbase-socketio-client.js` - Socket.IO 客户端类
2. `miniapp-example/pages/realtime-voice-cloudbase/` - 示例页面（可选）

#### 配置云开发

在 `app.js` 中初始化云开发：

```javascript
App({
  onLaunch() {
    wx.cloud.init({
      traceUser: true
    })
  }
})
```

#### 使用客户端

```javascript
const CloudBaseSocketIOClient = require('../../utils/cloudbase-socketio-client')

Page({
  async onLoad() {
    // 创建客户端
    this.client = new CloudBaseSocketIOClient({
      service: 'your-service-name', // 云托管服务名称
      namespace: '/realtime-voice',
      debug: true
    })

    // 监听连接事件
    this.client.onInternal('connect', () => {
      console.log('已连接')
    })

    // 监听服务器事件
    this.client.on('message', (data) => {
      console.log('收到消息:', data)
    })

    // 连接
    await this.client.connect()
  },

  // 发送事件
  sendMessage() {
    this.client.emit('message', { text: 'Hello' })
  },

  // 断开连接
  onUnload() {
    this.client.disconnect()
  }
})
```

### 3. 配置服务名称

将代码中的 `your-service-name` 替换为你的云托管服务名称：

```javascript
service: 'your-actual-service-name'
```

## 📚 完整文档

详细的使用说明请查看：[Socket.IO 云托管集成指南](docs/Socket.IO云托管集成指南.md)

文档包含：
- 详细的协议说明
- 架构图解
- 完整的 API 参考
- 常见问题解答
- 部署步骤

## 🎬 示例应用

本项目包含一个完整的实时语音识别示例，展示了如何使用 Socket.IO 实现：

- ✅ 实时音频流传输
- ✅ 双向消息通信
- ✅ 事件订阅和发布
- ✅ 连接状态管理
- ✅ 自动重连

示例页面路径：`miniapp-example/pages/realtime-voice-cloudbase/`

## 🔧 API 概览

### CloudBaseSocketIOClient

```javascript
// 创建客户端
const client = new CloudBaseSocketIOClient({
  service: 'service-name',
  namespace: '/namespace',
  debug: true
})

// 连接
await client.connect()

// 发送事件
client.emit('eventName', data)

// 监听事件
client.on('eventName', (data) => {
  console.log(data)
})

// 监听内部事件（connect, disconnect 等）
client.onInternal('connect', () => {
  console.log('已连接')
})

// 断开连接
client.disconnect()

// 检查连接状态
const connected = client.isConnected()
```

## 📊 协议说明

### 数据包格式

Socket.IO 数据包由两部分组成：

```
[Engine.IO 类型][Socket.IO 类型][数据]
```

示例：
- `40` - Engine.IO MESSAGE + Socket.IO CONNECT
- `42["event",{"data":"value"}]` - Engine.IO MESSAGE + Socket.IO EVENT + 事件数据
- `2` - Engine.IO PING
- `3` - Engine.IO PONG

客户端已经自动处理这些协议细节，你只需要关注业务逻辑。

## ❓ 常见问题

### Q: 为什么需要这个方案？

A: 因为微信小程序的 WebSocket 连接需要合法的 wss 域名，必须经过备案。使用云托管的 `wx.cloud.connectContainer` API 可以绕过这个限制。

### Q: 与传统 WebSocket 有什么区别？

A: 
- 传统方式：需要备案域名 + 使用 `wx.connectSocket`
- 本方案：不需要域名 + 使用 `wx.cloud.connectContainer`
- 需要手动实现 Socket.IO 协议（客户端已封装）

### Q: 能在开发工具中测试吗？

A: 开发工具对云托管容器连接的支持有限，建议在真机上测试。

### Q: 如何调试？

A: 创建客户端时设置 `debug: true`，会输出详细的协议交互日志。

## 🔗 参考资料

- [原文博客](https://blog.csdn.net/z329600208z/article/details/153698728) - 感谢原作者的分享
- [Socket.IO 官方文档](https://socket.io/docs/v4/)
- [微信云托管文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/container/)

## 📝 更新日志

### v1.0.0 (2025-11-09)

- ✨ 初始版本发布
- ✅ 完整的 Socket.IO 客户端实现
- ✅ 后端 Socket.IO 路由处理
- ✅ 实时语音识别示例
- 📖 详细的使用文档

## 📄 许可证

MIT License

## 💬 支持

如有问题或建议，欢迎提交 Issue。

---

**祝你开发顺利！🎉**

