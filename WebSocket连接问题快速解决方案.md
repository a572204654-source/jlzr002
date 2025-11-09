# WebSocket 连接问题快速解决方案

## 问题现象

```
WebSocket connection to 'wss://api.yimengpl.com/api/realtime-voice/stream' failed
errMsg: "未完成的操作"
code: 1006 (abnormal closure)
```

## 问题原因

微信小程序的 WebSocket 连接失败通常由以下原因导致：

### ✅ 已修复的问题
1. **express-ws 重复初始化** - 已修复
   - 移除了 `routes/realtime-voice.js` 中的 `expressWs(router)` 调用
   - 现在只在 `app.js` 中初始化一次

### ⚠️ 需要配置的问题

2. **微信小程序 socket 合法域名未配置** ⭐ 这是主要原因

---

## 立即解决方案

### 方案一：开发环境（推荐，最快）

**在微信开发者工具中设置：**

1. 点击右上角 **详情**
2. 找到 **本地设置**
3. ✅ 勾选：**不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**

![开发者工具设置](https://res.wx.qq.com/wxdoc/dist/assets/img/setting.5c2d7f5d.png)

**立即生效，无需等待审核！**

---

### 方案二：生产环境（正式发布）

**在微信小程序后台配置：**

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入你的小程序管理后台
3. 点击 **开发** → **开发管理** → **开发设置**
4. 找到 **服务器域名** 部分
5. 配置以下域名：

```
request合法域名：
https://api.yimengpl.com

socket合法域名：  ⭐ 关键配置
wss://api.yimengpl.com
```

**注意事项：**
- 域名必须通过 ICP 备案
- 必须使用 HTTPS/WSS 协议（不能用 HTTP/WS）
- 需要有效的 SSL 证书
- 配置后可能需要等待几分钟生效
- 一个月只能修改 5 次

---

## 测试验证

### 1. 测试本地环境

```bash
# 运行诊断工具
node test-websocket-connection.js
```

### 2. 在小程序中测试

**方法A：使用开发环境（推荐）**

1. 确保已勾选"不校验合法域名"
2. 在 `app.js` 中设置：
```javascript
globalData: {
  apiUrl: 'http://localhost'  // 本地开发
}
```
3. 启动本地服务：`npm start`
4. 在小程序中测试语音识别功能

**方法B：使用线上环境**

1. 配置了 socket 合法域名后
2. 在 `app.js` 中设置：
```javascript
globalData: {
  apiUrl: 'https://api.yimengpl.com'  // 线上环境
}
```
3. 在小程序中测试语音识别功能

---

## 完整的 WebSocket 连接流程

### 1. 小程序代码（已正确实现）

```javascript
// miniapp-example/pages/realtime-voice/realtime-voice.js
connectWebSocket() {
  const apiUrl = getApp().globalData.apiUrl
  const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://') 
              + '/api/realtime-voice/stream'
  
  this.socketTask = wx.connectSocket({
    url: wsUrl,  // wss://api.yimengpl.com/api/realtime-voice/stream
    success: () => {
      console.log('WebSocket连接请求已发送')
    },
    fail: (err) => {
      console.error('WebSocket连接失败', err)
    }
  })
  
  this.socketTask.onOpen(() => {
    console.log('✅ WebSocket已连接')
    // 发送初始化消息...
  })
  
  this.socketTask.onError((err) => {
    console.error('❌ WebSocket错误:', err)
  })
}
```

### 2. 后端路由（已正确配置）

```javascript
// app.js
const expressWs = require('express-ws')
const app = express()

// ✅ 只在这里初始化一次
expressWs(app)

// 注册路由
app.use('/api/realtime-voice', realtimeVoiceRouter)
```

```javascript
// routes/realtime-voice.js
const express = require('express')
const router = express.Router()

// ✅ 不需要再次调用 expressWs(router)

// WebSocket 路由
router.ws('/stream', (ws, req) => {
  console.log('✅ WebSocket客户端已连接')
  
  ws.on('message', async (msg) => {
    // 处理消息...
  })
  
  ws.on('close', () => {
    console.log('WebSocket客户端已断开')
  })
})

module.exports = router
```

---

## 常见错误及解决

### 错误 1: "未完成的操作"

**原因：** 微信小程序 socket 合法域名未配置

**解决：**
- 开发环境：勾选"不校验合法域名"
- 生产环境：在小程序后台配置 socket 合法域名

### 错误 2: "不在以下合法域名列表中"

**原因：** socket 合法域名配置不正确

**解决：**
```
确保配置的是：wss://api.yimengpl.com
而不是：wss://api.yimengpl.com/api/realtime-voice/stream
```
只需要配置域名根路径，不需要包含完整路径！

### 错误 3: Connection closed code 1006

**原因：** 连接异常关闭

**可能的原因：**
1. 服务器 WebSocket 配置错误（已修复）
2. SSL 证书问题
3. 防火墙或负载均衡器阻止连接
4. 服务器未正确响应 WebSocket 握手

**解决：**
1. 确保域名有有效的 SSL 证书
2. 检查云托管的 WebSocket 支持配置
3. 运行诊断工具验证连接

---

## 验证清单

在测试前，请确认：

### 后端配置（已完成 ✅）
- [x] `app.js` 中启用了 `expressWs(app)`
- [x] 路由正确注册：`app.use('/api/realtime-voice', realtimeVoiceRouter)`
- [x] `routes/realtime-voice.js` 中移除了重复的 `expressWs(router)`
- [x] WebSocket 路由正确定义：`router.ws('/stream', ...)`
- [x] 服务器正常运行（检查：`curl http://localhost/health`）

### 小程序配置（需要你操作）
- [ ] **开发环境**：已勾选"不校验合法域名"
- [ ] **或** **生产环境**：已在小程序后台配置 socket 合法域名
- [ ] `app.js` 中 `apiUrl` 配置正确
- [ ] 已授权录音权限

### 网络配置（生产环境）
- [ ] 域名已备案
- [ ] SSL 证书有效
- [ ] 云托管支持 WebSocket
- [ ] 防火墙允许 WebSocket 连接

---

## 推荐的开发流程

### 第一步：本地开发（最快）

1. 启动本地服务：
```bash
npm start
```

2. 在微信开发者工具中：
   - ✅ 勾选"不校验合法域名"
   - 设置 `apiUrl: 'http://localhost'`

3. 测试功能

### 第二步：部署到云端

1. 部署代码到腾讯云托管

2. 在微信小程序后台配置：
   - request 合法域名：`https://api.yimengpl.com`
   - socket 合法域名：`wss://api.yimengpl.com`

3. 在小程序中设置 `apiUrl: 'https://api.yimengpl.com'`

4. 测试功能

---

## 技术支持

如果按照以上步骤操作后仍然无法连接，请检查：

1. **运行诊断工具：**
```bash
node test-websocket-connection.js
```

2. **查看服务器日志：**
```bash
# 本地
npm start

# 云端
# 在腾讯云托管控制台查看日志
```

3. **查看小程序控制台：**
   - 打开微信开发者工具
   - 点击"控制台"
   - 查看 WebSocket 相关的错误信息

4. **测试 HTTP 接口（不使用 WebSocket）：**
```javascript
// 先测试普通的 HTTP 接口是否正常
wx.request({
  url: apiUrl + '/api/realtime-voice/history',
  header: { token: wx.getStorageSync('token') },
  success: (res) => {
    console.log('HTTP 接口正常:', res)
  }
})
```

---

## 相关文档

- 📄 [WebSocket连接问题解决方案.md](docs/WebSocket连接问题解决方案.md)
- 📄 [实时语音识别API文档.md](docs/c-api/实时语音识别API文档.md)
- 🔧 [test-websocket-connection.js](test-websocket-connection.js) - 诊断工具
- 💡 [微信官方文档 - wx.connectSocket](https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.connectSocket.html)
- 💡 [微信官方文档 - 服务器域名配置](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)

---

**最后更新：** 2024-11-08

## 总结

✅ **后端配置已完成**，代码已修复 express-ws 重复初始化的问题。

⚠️ **你需要做的：**

**开发环境（推荐，最快）：**
1. 在微信开发者工具中勾选"不校验合法域名"
2. 设置 `apiUrl: 'http://localhost'`
3. 启动本地服务：`npm start`
4. 测试功能

**生产环境（正式发布）：**
1. 在微信小程序后台配置 socket 合法域名：`wss://api.yimengpl.com`
2. 设置 `apiUrl: 'https://api.yimengpl.com'`
3. 测试功能

**立即可以使用开发环境进行测试！** 🚀

