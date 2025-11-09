# WebSocket 连接超时问题修复说明

## 问题描述

在微信小程序开发者工具中，WebSocket 连接 `wss://api.yimengpl.com/api/realtime-voice/stream` 时出现超时错误：
- 错误信息：`WebSocket连接超时（15秒未建立连接）`
- 连接状态显示：`已连接: false`，但 `socketTask状态: "exists"`，`WebSocket状态: OPEN`
- 运行环境：开发者工具（Windows,mp,1.06.2504060）

## 问题原因

1. **服务器端问题**：服务器端的 `/stream` 路由在连接建立时没有立即发送欢迎消息，导致客户端无法确认连接是否真正建立成功。

2. **客户端问题**：小程序端的连接逻辑只检查了 `onOpen` 事件，但没有等待服务器端的确认消息。虽然 WebSocket 状态显示 OPEN，但实际连接可能还没有完全建立。

## 修复方案

### 1. 服务器端修复（`routes/realtime-voice.js`）

在连接建立时立即发送欢迎消息：

```javascript
router.ws('/stream', (ws, req) => {
  console.log('WebSocket客户端已连接:', req.url)

  // 连接建立时立即发送欢迎消息，让客户端确认连接成功
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'WebSocket连接成功！',
    timestamp: Date.now()
  }))

  // ... 其他代码
})
```

### 2. 客户端修复（`miniapp-example/pages/realtime-voice/realtime-voice.js`）

改进连接逻辑，添加欢迎消息处理和超时检测：

#### 主要改进：

1. **添加欢迎消息处理**：在 `onMessage` 中处理欢迎消息，确认连接成功后才设置 `isConnected = true`。

2. **改进超时检测**：在 `onOpen` 事件中设置15秒超时，如果15秒内没有收到欢迎消息，则认为连接失败。

3. **资源清理**：在连接失败、错误或关闭时，清除超时定时器，避免内存泄漏。

4. **连接状态管理**：使用页面对象属性 `receivedWelcome` 和 `connectStartTime` 来跟踪连接状态。

#### 关键代码：

```javascript
// 监听WebSocket连接打开
this.socketTask.onOpen(() => {
  console.log('WebSocket已打开，等待欢迎消息...')
  
  // 设置超时检测：15秒内必须收到欢迎消息
  that.connectTimeout = setTimeout(() => {
    if (!that.receivedWelcome) {
      // 连接超时处理
      console.error('❌ WebSocket连接超时（15秒未建立连接）')
      // ... 关闭连接
    }
  }, 15000)
})

// 监听WebSocket消息
this.socketTask.onMessage((res) => {
  const message = JSON.parse(res.data)
  
  // 处理欢迎消息，确认连接成功
  if (message.type === 'welcome') {
    that.receivedWelcome = true
    console.log('✅ 收到欢迎消息，连接已确认')
    
    // 清除超时定时器
    if (that.connectTimeout) {
      clearTimeout(that.connectTimeout)
      that.connectTimeout = null
    }
    
    // 设置连接状态
    that.setData({
      isConnected: true
    })
    
    // 发送初始化消息
    that.socketTask.send({
      data: JSON.stringify({
        type: 'start',
        // ... 其他参数
      })
    })
    
    return
  }
  
  // 处理其他消息
  that.handleWebSocketMessage(message)
})
```

## 测试验证

### 1. 服务器端测试

使用 Node.js 测试脚本测试连接：

```bash
node test-websocket-fix.js wss://api.yimengpl.com
```

**测试结果**：✅ 所有测试通过，WebSocket 连接正常。

### 2. 小程序端测试

在小程序开发者工具中测试：

1. 打开小程序项目
2. 进入实时语音识别页面
3. 点击开始录音
4. 观察控制台日志，应该看到：
   - `WebSocket已打开，等待欢迎消息...`
   - `✅ 收到欢迎消息，连接已确认`
   - `识别服务就绪`

## 注意事项

### 1. 开发者工具限制

微信小程序开发者工具对 WebSocket 连接有一些限制，如果仍然遇到连接问题：

1. 点击右上角"详情"
2. 勾选"不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书"
3. 重新编译项目

### 2. 真机测试

建议在真机上测试，真机环境更接近实际使用场景。

### 3. 域名配置

确保在小程序管理后台配置了合法域名：
- `wss://api.yimengpl.com`

### 4. 网络环境

如果使用云托管，确保：
- 网络连接正常
- 防火墙没有阻止连接
- 服务器正常运行

## 修改文件清单

1. `routes/realtime-voice.js` - 服务器端 WebSocket 路由
2. `miniapp-example/pages/realtime-voice/realtime-voice.js` - 小程序端连接逻辑

## 后续优化建议

1. **增加重连机制**：连接失败时自动重试
2. **优化超时时间**：根据实际网络情况调整超时时间
3. **添加心跳检测**：定期发送心跳消息，检测连接是否正常
4. **错误日志记录**：记录连接失败的详细信息，便于问题排查

## 总结

通过服务器端发送欢迎消息和客户端正确处理欢迎消息，解决了 WebSocket 连接超时的问题。现在连接流程更加可靠：

1. 客户端发起连接
2. WebSocket 状态变为 OPEN
3. 服务器端立即发送欢迎消息
4. 客户端收到欢迎消息后确认连接成功
5. 客户端发送初始化消息开始识别

这样可以确保连接真正建立成功，避免误判连接状态。

