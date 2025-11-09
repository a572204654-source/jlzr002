# 🚨 WebSocket 连接问题 - 立即解决

## 问题
```
WebSocket connection to 'wss://api.yimengpl.com/api/realtime-voice/stream' failed
errMsg: "未完成的操作"
```

---

## ✅ 后端代码已修复

我已经修复了后端的 express-ws 配置问题：
- ✅ 移除了 `routes/realtime-voice.js` 中重复的 `expressWs(router)` 调用
- ✅ WebSocket 路由配置正确

---

## ⚡ 立即解决方案（3分钟搞定）

### 🎯 方案一：本地开发测试（推荐，最快）

#### 第1步：在微信开发者工具设置

1. 打开微信开发者工具
2. 点击右上角 **【详情】**
3. 点击 **【本地设置】**
4. ✅ **勾选**：不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书

![勾选这个选项](https://developers.weixin.qq.com/miniprogram/dev/devtools/img/debug-1.png)

#### 第2步：启动本地服务

```bash
npm start
```

服务会在 `http://localhost` 启动

#### 第3步：测试

在小程序中测试语音识别功能，WebSocket 会自动连接到 `ws://localhost/api/realtime-voice/stream`

**✨ 完成！现在应该可以正常连接了！**

---

### 🌐 方案二：生产环境配置

如果要在真机上测试或正式发布，需要配置微信小程序后台：

#### 第1步：登录微信小程序后台

1. 打开 https://mp.weixin.qq.com/
2. 登录你的小程序账号

#### 第2步：配置 socket 合法域名

1. 进入 **开发** → **开发管理** → **开发设置**
2. 找到 **服务器域名** 部分
3. 点击 **socket 合法域名** 后面的 **【修改】**
4. 添加：
```
wss://api.yimengpl.com
```

5. 同时确保 **request 合法域名** 中有：
```
https://api.yimengpl.com
```

#### 第3步：等待生效

配置保存后，等待 2-5 分钟生效

#### 第4步：测试

在小程序中测试，WebSocket 会连接到 `wss://api.yimengpl.com/api/realtime-voice/stream`

---

## 🔍 验证方法

### 验证本地服务是否正常

```bash
# 1. 启动服务
npm start

# 2. 在另一个终端运行诊断
node test-websocket-connection.js
```

### 在小程序控制台查看

打开微信开发者工具的控制台，应该看到：

```javascript
✅ WebSocket连接请求已发送 {socketTaskId: 1, errMsg: "connectSocket:ok"}
✅ WebSocket已打开
📩 收到服务端消息: {"type":"ready","message":"识别服务已就绪"}
```

如果还看到错误，说明是小程序域名配置问题，请使用**方案一**（勾选不校验合法域名）。

---

## ❓ 常见问题

### Q1: 勾选"不校验合法域名"后还是失败？

**A:** 检查是否启动了本地服务：
```bash
npm start
```
确保看到：`Server is running on port 80`

---

### Q2: 生产环境配置后还是失败？

**A:** 检查配置是否正确：

✅ **正确配置：**
```
socket合法域名: wss://api.yimengpl.com
```

❌ **错误配置：**
```
wss://api.yimengpl.com/api/realtime-voice/stream  ← 不要包含路径！
ws://api.yimengpl.com                               ← 必须用 wss，不是 ws
```

---

### Q3: 本地可以，但真机不行？

**A:** 真机测试需要：
1. 配置小程序后台的 socket 合法域名（见方案二）
2. 或者开启真机调试模式（在微信开发者工具中点击"真机调试"）

---

### Q4: 提示"不在以下 socket 合法域名列表中"？

**A:** 说明小程序后台没有配置 socket 合法域名，请按照**方案二**进行配置。

---

## 📊 问题诊断流程

```
WebSocket 连接失败
      ↓
是否在微信开发者工具中测试？
      ↓
    【是】→ 勾选"不校验合法域名" → 问题解决 ✅
      ↓
    【否】→ 是否在真机上测试？
      ↓
    【是】→ 配置 socket 合法域名 → 问题解决 ✅
             或使用"真机调试"
```

---

## 🎉 总结

### 开发环境（本地测试）
1. ✅ 勾选"不校验合法域名"
2. 启动服务：`npm start`
3. 测试功能

### 生产环境（真机/发布）
1. 配置 socket 合法域名：`wss://api.yimengpl.com`
2. 等待 2-5 分钟生效
3. 测试功能

---

**💡 提示：** 建议先使用**方案一**在本地测试，确认功能正常后，再配置生产环境！

**📞 如有问题，查看详细文档：** `WebSocket连接问题快速解决方案.md`

---

**最后更新：** 2024-11-08 | **状态：** ✅ 后端已修复，只需配置小程序

