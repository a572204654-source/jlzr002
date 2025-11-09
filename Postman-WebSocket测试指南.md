# Postman WebSocket 测试指南

本指南介绍如何使用 Postman 测试云托管环境的 WebSocket 连接。

---

## 📋 测试前准备

### 1. 确认 Postman 版本

WebSocket 功能需要 **Postman v10.0** 或更高版本。

检查版本：
- 打开 Postman
- 点击右上角 Help → About Postman
- 确认版本号 ≥ 10.0

### 2. 测试地址

| 环境 | WebSocket 地址 |
|------|---------------|
| 自定义域名 | `wss://api.yimengpl.com/test-ws` |
| 默认域名 (ap-shanghai) | `wss://jlzr1101-5g9kplxza13a780d-1302271970.ap-shanghai.app.tcloudbase.com/test-ws` |
| 默认域名 (tcloudbaseapp) | `wss://jlzr1101-5g9kplxza13a780d-1302271970.tcloudbaseapp.com/test-ws` |

**推荐使用**：`wss://api.yimengpl.com/test-ws`

---

## 🚀 测试步骤

### 步骤 1：创建 WebSocket 请求

1. 打开 Postman
2. 点击左上角 **New** 按钮
3. 选择 **WebSocket Request**（或 **WebSocket**）
4. 输入 WebSocket 地址：
   ```
   wss://api.yimengpl.com/test-ws
   ```

### 步骤 2：配置连接参数（可选）

点击 **Headers** 标签，可以添加自定义请求头：

| Key | Value | 说明 |
|-----|-------|------|
| User-Agent | Postman-WebSocket-Test | 用户代理 |
| Origin | https://api.yimengpl.com | 来源（可选） |

### 步骤 3：连接 WebSocket

1. 点击 **Connect** 按钮
2. 等待连接建立

**预期结果**：

✅ **连接成功**：
```
Status: Connected
```

并且会收到服务器的欢迎消息：
```json
{
  "type": "connected",
  "message": "WebSocket 工作正常",
  "timestamp": 1699200000000
}
```

❌ **连接失败**：
```
Status: Disconnected
Error: Unexpected server response: 404
```

说明服务器不支持 WebSocket，需要重新部署为 `container-websocket` 类型。

### 步骤 4：发送测试消息

在 **Message** 输入框中输入：

```json
{
  "type": "ping",
  "message": "测试消息",
  "timestamp": 1699200000000
}
```

点击 **Send** 按钮。

**预期响应**：

服务器会回显消息：
```json
{
  "type": "echo",
  "data": "{\"type\":\"ping\",\"message\":\"测试消息\",\"timestamp\":1699200000000}",
  "timestamp": 1699200001000
}
```

### 步骤 5：测试不同消息类型

#### 测试 1：Ping 消息

```json
{
  "type": "ping"
}
```

#### 测试 2：文本消息

```json
{
  "type": "text",
  "content": "你好，WebSocket！"
}
```

#### 测试 3：JSON 数据

```json
{
  "type": "data",
  "userId": 123,
  "action": "test"
}
```

### 步骤 6：断开连接

点击 **Disconnect** 按钮断开连接。

---

## 📊 测试结果分析

### 成功的连接

如果看到以下内容，说明 WebSocket 工作正常：

```
✅ Status: Connected
✅ Received: {"type":"connected","message":"WebSocket 工作正常",...}
✅ Sent: {"type":"ping",...}
✅ Received: {"type":"echo","data":"...",...}
```

### 失败的连接

#### 错误 1：404 Not Found

```
❌ Error: Unexpected server response: 404
```

**原因**：服务器不支持 WebSocket 协议

**解决方案**：重新部署为 `container-websocket` 类型

```bash
tcb run:deprecated deploy \
  --envId jlzr1101-5g9kplxza13a780d \
  --serviceName node-backend \
  --type container-websocket
```

#### 错误 2：Connection Timeout

```
❌ Error: Connection timeout
```

**原因**：
- 网络问题
- 服务器未响应
- 防火墙阻止

**解决方案**：
1. 检查网络连接
2. 检查服务器状态
3. 尝试使用其他域名

#### 错误 3：SSL/TLS Error

```
❌ Error: SSL handshake failed
```

**原因**：SSL 证书问题

**解决方案**：
1. 确认使用 `wss://`（不是 `ws://`）
2. 检查域名 SSL 证书是否有效

---

## 🧪 完整测试流程

### 测试清单

- [ ] 1. 连接 `wss://api.yimengpl.com/test-ws`
- [ ] 2. 确认收到欢迎消息
- [ ] 3. 发送 ping 消息
- [ ] 4. 确认收到 echo 响应
- [ ] 5. 发送自定义 JSON 消息
- [ ] 6. 确认服务器正确响应
- [ ] 7. 保持连接 30 秒
- [ ] 8. 正常断开连接

### 测试脚本（可导入 Postman）

创建 `postman-websocket-test.json`：

```json
{
  "info": {
    "name": "WebSocket 测试",
    "description": "云托管 WebSocket 连接测试"
  },
  "item": [
    {
      "name": "测试连接 - 自定义域名",
      "request": {
        "method": "WS",
        "url": "wss://api.yimengpl.com/test-ws",
        "header": [
          {
            "key": "User-Agent",
            "value": "Postman-WebSocket-Test"
          }
        ]
      }
    },
    {
      "name": "测试连接 - 默认域名",
      "request": {
        "method": "WS",
        "url": "wss://jlzr1101-5g9kplxza13a780d-1302271970.ap-shanghai.app.tcloudbase.com/test-ws"
      }
    }
  ]
}
```

---

## 🎯 实时语音识别测试

### 测试地址

```
wss://api.yimengpl.com/api/realtime-voice/stream
```

### 测试步骤

1. **连接 WebSocket**
   ```
   wss://api.yimengpl.com/api/realtime-voice/stream
   ```

2. **发送配置消息**
   ```json
   {
     "type": "config",
     "config": {
       "engineModelType": "16k_zh",
       "voiceFormat": 1
     }
   }
   ```

3. **发送音频数据**
   ```json
   {
     "type": "audio",
     "data": "base64编码的音频数据"
   }
   ```

4. **发送结束标记**
   ```json
   {
     "type": "end"
   }
   ```

5. **接收识别结果**
   ```json
   {
     "type": "result",
     "result": "识别的文本内容",
     "isFinal": true
   }
   ```

---

## 📱 小程序测试

### 小程序代码示例

```javascript
// 连接 WebSocket
const socketTask = wx.connectSocket({
  url: 'wss://api.yimengpl.com/test-ws',
  success: () => {
    console.log('WebSocket 连接成功')
  },
  fail: (error) => {
    console.error('WebSocket 连接失败', error)
  }
})

// 监听连接打开
socketTask.onOpen(() => {
  console.log('✅ WebSocket 已连接')
  
  // 发送测试消息
  socketTask.send({
    data: JSON.stringify({
      type: 'ping',
      message: '来自小程序的测试'
    })
  })
})

// 监听消息
socketTask.onMessage((res) => {
  console.log('📥 收到消息:', res.data)
  const message = JSON.parse(res.data)
  console.log('解析后:', message)
})

// 监听错误
socketTask.onError((error) => {
  console.error('❌ WebSocket 错误:', error)
})

// 监听关闭
socketTask.onClose(() => {
  console.log('🔌 WebSocket 已关闭')
})
```

---

## 🔧 故障排查

### 问题 1：无法连接

**检查清单**：
- [ ] 确认使用 `wss://`（不是 `ws://`）
- [ ] 确认域名正确
- [ ] 确认路径包含 `/test-ws`
- [ ] 检查网络连接
- [ ] 检查服务器状态

### 问题 2：连接后立即断开

**可能原因**：
- 服务器不支持 WebSocket
- 需要重新部署为 `container-websocket` 类型

### 问题 3：无法发送消息

**可能原因**：
- 连接未建立
- 消息格式错误
- 服务器未响应

---

## 📚 相关文档

- **WebSocket测试报告-2025-11-08.md** - 详细测试报告
- **腾讯云托管WebSocket部署指南.md** - 部署文档
- **【立即部署】WebSocket服务.md** - 快速部署指南

---

## 💡 提示

### Postman 快捷键

- `Ctrl/Cmd + Enter` - 发送消息
- `Ctrl/Cmd + K` - 清空消息历史
- `Esc` - 断开连接

### 测试建议

1. **先测试简单路径**：`/test-ws`
2. **再测试业务路径**：`/api/realtime-voice/stream`
3. **逐步增加复杂度**：从简单消息到音频数据
4. **记录测试结果**：保存成功的配置

---

**文档版本**：v1.0  
**更新时间**：2025-11-08  
**适用环境**：jlzr1101-5g9kplxza13a780d

