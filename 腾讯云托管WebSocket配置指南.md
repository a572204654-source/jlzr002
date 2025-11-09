# 腾讯云托管 WebSocket 配置指南

## 🔍 问题诊断结果

通过测试工具 `test-cloud-websocket.js` 的诊断，我们发现：

✅ **HTTP 服务正常** - `https://api.yimengpl.com/health` 可以访问  
❌ **WebSocket 连接失败** - 返回 404 错误

**结论：腾讯云托管环境需要特殊配置才能支持 WebSocket**

---

## 📋 问题原因

腾讯云 CloudBase 云托管默认情况下可能不支持 WebSocket，或者需要特殊配置。常见原因包括：

1. **负载均衡器配置** - 云托管的负载均衡器可能不支持 WebSocket 协议
2. **超时设置** - WebSocket 长连接可能被提前断开
3. **协议升级** - HTTP 到 WebSocket 的协议升级可能被阻止
4. **路由问题** - WebSocket 路由没有正确注册到云端

---

## ✅ 解决方案

### 方案一：使用容器型 WebSocket 部署（官方推荐）⭐

**这是腾讯云官方提供的 WebSocket 部署方案！**

腾讯云托管支持 WebSocket，但需要在部署时指定特殊类型：`container-websocket`

#### 快速部署步骤

1. **安装 CloudBase CLI**
```bash
npm install -g @cloudbase/cli
```

2. **登录 CloudBase**
```bash
tcb login
```

3. **部署 WebSocket 服务（关键命令）**
```bash
tcb cloudrun deploy miniapp-backend --type container-websocket
```

**重要：** 必须加上 `--type container-websocket` 参数！

4. **配置环境变量**

在 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) 配置环境变量。

5. **测试连接**
```bash
node test-cloud-websocket.js
```

**优点：**
- ✅ 官方支持的方案
- ✅ 部署简单
- ✅ 稳定可靠
- ✅ 无需额外配置
- ✅ 支持自定义域名

**详细步骤请查看：** `【立即部署】WebSocket服务.md` 或 `腾讯云托管WebSocket部署指南.md`

---

### 方案二：使用腾讯云 API 网关（备选方案）

腾讯云 API 网关原生支持 WebSocket，也是可靠的方案。

#### 步骤1：创建 API 网关

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 **API 网关** 服务
3. 创建新的 API 服务
4. 选择 **WebSocket 协议**

#### 步骤2：配置后端对接

1. 后端类型选择：**云托管**
2. 填写云托管服务地址
3. 配置路径映射：
   - 前端路径：`/api/realtime-voice/stream`
   - 后端路径：`/api/realtime-voice/stream`

#### 步骤3：发布 API

1. 发布到生产环境
2. 获取 API 网关的 WebSocket 地址
3. 在小程序中使用新的 WebSocket 地址

**优点：**
- ✅ 原生支持 WebSocket
- ✅ 稳定可靠
- ✅ 支持长连接
- ✅ 自动负载均衡

**缺点：**
- ⚠️ 需要额外配置
- ⚠️ 可能产生额外费用

---

### 方案二：配置云托管支持 WebSocket

某些云托管环境支持 WebSocket，但需要特殊配置。

#### 步骤1：检查云托管文档

查看腾讯云托管的官方文档，确认是否支持 WebSocket。

#### 步骤2：配置 Dockerfile

确保 Dockerfile 正确暴露端口：

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 80

CMD ["npm", "start"]
```

#### 步骤3：配置云托管服务

在云托管控制台中：

1. 进入服务配置
2. 查找 **网络配置** 或 **高级配置**
3. 启用 WebSocket 支持（如果有此选项）
4. 配置超时时间（建议 300 秒以上）

#### 步骤4：配置负载均衡

如果云托管使用了负载均衡器：

1. 确保负载均衡器支持 WebSocket
2. 配置会话保持（Session Sticky）
3. 增加连接超时时间

---

### 方案三：使用轮询替代 WebSocket（临时方案）

如果 WebSocket 无法使用，可以临时使用 HTTP 轮询。

#### 后端实现

已经实现了一句话识别接口：

```javascript
POST /api/realtime-voice/recognize
```

这个接口支持上传完整的音频文件进行识别。

#### 小程序实现

修改小程序代码，使用 HTTP 请求替代 WebSocket：

```javascript
// 录音完成后上传
wx.uploadFile({
  url: apiUrl + '/api/realtime-voice/recognize',
  filePath: tempFilePath,
  name: 'audio',
  header: { token: wx.getStorageSync('token') },
  success: (res) => {
    const data = JSON.parse(res.data)
    console.log('识别结果:', data.data.text)
  }
})
```

**优点：**
- ✅ 无需 WebSocket 支持
- ✅ 实现简单
- ✅ 兼容性好

**缺点：**
- ❌ 无法实时识别
- ❌ 需要等待录音完成
- ❌ 用户体验较差

---

### 方案四：使用腾讯云 CVM 自建服务（完全控制）

如果云托管无法满足需求，可以考虑使用 CVM 自建服务。

#### 优点：
- ✅ 完全控制服务器配置
- ✅ 支持任何协议
- ✅ 性能可控

#### 缺点：
- ❌ 需要自己运维
- ❌ 成本较高
- ❌ 需要配置 Nginx、SSL 等

---

## 🧪 测试验证

### 测试本地环境

```bash
# 1. 启动本地服务
npm start

# 2. 运行测试工具
node test-websocket-connection.js
```

应该看到：
```
✅ 本地服务运行正常
✅ 本地 WebSocket 连接成功
```

### 测试云端环境

```bash
node test-cloud-websocket.js
```

如果配置成功，应该看到：
```
✅ 云端服务运行正常
✅ 简单 WebSocket 连接成功
✅ 实时语音 WebSocket 连接成功
```

---

## 📞 联系腾讯云支持

如果以上方案都无法解决，建议联系腾讯云技术支持：

### 需要咨询的问题：

1. **CloudBase 云托管是否支持 WebSocket？**
   - 如果支持，需要如何配置？
   - 是否需要特殊的端口或协议？

2. **负载均衡器配置**
   - 负载均衡器是否支持 WebSocket 协议升级？
   - 如何配置会话保持？
   - 超时时间如何设置？

3. **推荐方案**
   - 对于 WebSocket 应用，腾讯云推荐使用哪种部署方式？
   - API 网关 vs 云托管，哪个更适合？

### 提供的信息：

```
项目类型：微信小程序后端
技术栈：Node.js + Express + express-ws
需求：实时语音识别（需要 WebSocket 长连接）
当前问题：云托管环境 WebSocket 返回 404
测试结果：HTTP 服务正常，WebSocket 连接失败
```

---

## 🎯 推荐方案总结

根据你的情况，我推荐以下顺序尝试：

### 第一步：本地测试（立即可做，5分钟）

```bash
# 1. 启动本地服务
npm start

# 2. 在微信开发者工具中：
#    - 勾选"不校验合法域名"
#    - 设置 apiUrl: 'http://localhost'
#    - 测试语音识别功能
```

**目的：** 确认代码功能正常

---

### 第二步：部署 WebSocket 服务（官方方案，15分钟）⭐ 推荐

**这是腾讯云官方支持的 WebSocket 部署方案！**

```bash
# 1. 安装 CLI
npm install -g @cloudbase/cli

# 2. 登录
tcb login

# 3. 部署（关键命令）
tcb cloudrun deploy miniapp-backend --type container-websocket
```

**优点：** 
- ✅ 官方方案，稳定可靠
- ✅ 部署简单，一条命令搞定
- ✅ 支持自定义域名
- ✅ 无需额外配置

**详细步骤：** 查看 `【立即部署】WebSocket服务.md`

---

### 第三步：使用临时方案（如果需要快速上线）

使用已实现的一句话识别接口：

```javascript
POST /api/realtime-voice/recognize
```

在小程序中使用 `wx.uploadFile` 上传音频文件。

**优点：** 无需 WebSocket，可以立即使用  
**缺点：** 无法实时识别

---

### 备选方案：配置 API 网关（如果容器型方案不可用）

1. 创建腾讯云 API 网关
2. 配置 WebSocket 支持
3. 对接云托管服务
4. 更新小程序 WebSocket 地址

**优点：** 原生支持 WebSocket，稳定可靠  
**缺点：** 配置相对复杂

---

## 📚 相关文档

### 项目文档
- `【立即解决】WebSocket问题.md` - 快速解决指南
- `WebSocket连接问题快速解决方案.md` - 详细说明
- `docs/c-api/实时语音识别API文档.md` - API 文档

### 测试工具
- `test-websocket-connection.js` - 完整诊断工具
- `test-cloud-websocket.js` - 云端专项测试

### 腾讯云文档
- [CloudBase 云托管文档](https://cloud.tencent.com/document/product/1243)
- [API 网关 WebSocket 文档](https://cloud.tencent.com/document/product/628/48777)
- [实时语音识别文档](https://cloud.tencent.com/document/product/1093/37138)

---

## ✅ 当前状态

### 已完成 ✅
1. ✅ 后端代码已修复（移除重复的 expressWs 初始化）
2. ✅ 本地环境配置正确
3. ✅ 添加了 WebSocket 测试接口
4. ✅ 创建了诊断工具
5. ✅ 实现了一句话识别接口（HTTP 方式）

### 待解决 ⚠️
1. ⚠️ 云托管环境 WebSocket 配置
2. ⚠️ 需要选择合适的部署方案

### 建议操作 📋
1. **立即可做：** 在本地测试 WebSocket 功能
2. **快速上线：** 使用一句话识别接口（HTTP）
3. **长期方案：** 配置 API 网关或咨询技术支持

---

## 💡 小技巧

### 开发环境测试

在微信开发者工具中测试时：
1. ✅ 勾选"不校验合法域名"
2. 设置 `apiUrl: 'http://localhost'`
3. 启动本地服务：`npm start`
4. 测试所有功能

### 生产环境部署

部署到云端后：
1. 先测试 HTTP 接口是否正常
2. 再测试 WebSocket 连接
3. 查看云托管日志
4. 根据日志信息排查问题

---

**最后更新：** 2024-11-08  
**状态：** 等待云托管 WebSocket 配置或选择替代方案

---

## 🆘 需要帮助？

如果你在配置过程中遇到问题，可以：

1. 查看云托管控制台的实时日志
2. 运行诊断工具查看详细错误
3. 联系腾讯云技术支持
4. 参考腾讯云官方文档

**记住：本地测试可以立即进行，无需等待云端配置！** 🚀

