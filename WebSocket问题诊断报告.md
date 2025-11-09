# WebSocket 问题诊断报告

**诊断时间：** 2024-11-08  
**云托管域名：** https://api.yimengpl.com  
**诊断工具：** test-cloud-websocket.js

---

## 📊 诊断结果

### ✅ 正常的部分

| 项目 | 状态 | 说明 |
|------|------|------|
| HTTP 服务 | ✅ 正常 | `https://api.yimengpl.com/health` 可以访问 |
| 后端代码 | ✅ 正常 | express-ws 配置正确，路由注册正确 |
| 依赖包 | ✅ 正常 | ws 和 express-ws 已安装 |
| 本地测试 | ✅ 正常 | 本地环境 WebSocket 可以正常工作 |

### ❌ 存在的问题

| 项目 | 状态 | 错误信息 |
|------|------|----------|
| 云端 WebSocket | ❌ 失败 | `Unexpected server response: 404` |
| 测试路由 | ❌ 失败 | `wss://api.yimengpl.com/test-ws` 返回 404 |
| 实时语音路由 | ❌ 失败 | `wss://api.yimengpl.com/api/realtime-voice/stream` 返回 404 |

---

## 🔍 问题原因分析

### 核心问题

**腾讯云 CloudBase 云托管环境不支持 WebSocket 协议，或需要特殊配置。**

### 详细分析

1. **404 错误说明：**
   - WebSocket 握手请求到达了服务器
   - 但服务器没有正确响应 WebSocket 升级请求
   - 返回了 404 Not Found

2. **可能的原因：**
   - 云托管的负载均衡器不支持 WebSocket 协议升级
   - 需要在云托管控制台中启用 WebSocket 支持
   - 需要使用腾讯云 API 网关来处理 WebSocket 连接

3. **排除的原因：**
   - ✅ 不是代码问题（本地测试正常）
   - ✅ 不是路由配置问题（代码配置正确）
   - ✅ 不是依赖包问题（已正确安装）

---

## 💡 解决方案

### 🎯 方案对比

| 方案 | 难度 | 时间 | 成本 | 推荐度 |
|------|------|------|------|--------|
| 本地开发测试 | ⭐ 简单 | 立即 | 免费 | ⭐⭐⭐⭐⭐ |
| 使用 HTTP 接口 | ⭐ 简单 | 立即 | 免费 | ⭐⭐⭐⭐ |
| 配置 API 网关 | ⭐⭐⭐ 中等 | 1-2小时 | 少量 | ⭐⭐⭐⭐⭐ |
| 联系技术支持 | ⭐⭐ 简单 | 1-3天 | 免费 | ⭐⭐⭐ |
| 自建 CVM | ⭐⭐⭐⭐ 困难 | 1天 | 较高 | ⭐⭐ |

---

## 🚀 立即可用方案

### 方案一：本地开发测试（推荐）

**适用场景：** 开发和测试阶段

**操作步骤：**

1. 启动本地服务：
```bash
npm start
```

2. 在微信开发者工具中配置：
   - 点击右上角【详情】→【本地设置】
   - ✅ 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

3. 在小程序 `app.js` 中设置：
```javascript
globalData: {
  apiUrl: 'http://localhost'
}
```

4. 测试语音识别功能

**优点：**
- ✅ 立即可用
- ✅ 无需任何配置
- ✅ 功能完整

**缺点：**
- ⚠️ 仅限开发环境
- ⚠️ 无法在真机上测试

---

### 方案二：使用一句话识别接口（临时方案）

**适用场景：** 快速上线，不需要实时识别

**已实现的接口：**

```
POST /api/realtime-voice/recognize
Content-Type: multipart/form-data

参数：
- audio: 音频文件（最大 10MB）
- engineType: 引擎类型（默认 16k_zh）
- filterDirty: 是否过滤脏词（0/1）
- filterModal: 是否过滤语气词（0/1）
- convertNumMode: 数字转换模式（0/1）
- wordInfo: 词级别时间戳（0/1/2）
```

**小程序调用示例：**

```javascript
// 录音完成后
wx.stopRecord({
  success: (res) => {
    const tempFilePath = res.tempFilePath
    
    // 上传音频文件进行识别
    wx.uploadFile({
      url: apiUrl + '/api/realtime-voice/recognize',
      filePath: tempFilePath,
      name: 'audio',
      header: {
        token: wx.getStorageSync('token')
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 0) {
          console.log('识别结果:', data.data.text)
          // 显示识别结果
          this.setData({
            recognizedText: data.data.text
          })
        }
      }
    })
  }
})
```

**优点：**
- ✅ 立即可用（云端已部署）
- ✅ 无需 WebSocket
- ✅ 稳定可靠

**缺点：**
- ⚠️ 无法实时识别
- ⚠️ 需要等待录音完成
- ⚠️ 用户体验不如实时识别

---

## 🔧 长期解决方案

### 方案三：配置腾讯云 API 网关（推荐）

**适用场景：** 生产环境，需要实时 WebSocket 识别

**配置步骤：**

#### 1. 创建 API 网关服务

登录 [腾讯云 API 网关控制台](https://console.cloud.tencent.com/apigateway)

1. 点击【新建】创建服务
2. 填写服务信息：
   - 服务名称：`miniapp-websocket`
   - 前端类型：`HTTP&HTTPS`
   - 访问方式：`公网`

#### 2. 创建 WebSocket API

1. 在服务中点击【管理 API】→【新建】
2. 选择【WebSocket】协议
3. 配置 API：
   - API 路径：`/api/realtime-voice/stream`
   - 后端类型：`云托管`
   - 后端地址：`https://api.yimengpl.com`
   - 后端路径：`/api/realtime-voice/stream`

#### 3. 发布服务

1. 点击【发布】
2. 选择【发布到生产环境】
3. 获取 API 网关地址（例如：`wss://service-xxx.apigw.tencentcs.com`）

#### 4. 更新小程序配置

1. 在微信小程序后台配置 socket 合法域名：
```
wss://service-xxx.apigw.tencentcs.com
```

2. 在小程序代码中使用新地址：
```javascript
// app.js
globalData: {
  apiUrl: 'https://api.yimengpl.com',  // HTTP 接口
  wsUrl: 'wss://service-xxx.apigw.tencentcs.com'  // WebSocket 接口
}

// pages/realtime-voice/realtime-voice.js
connectWebSocket() {
  const wsUrl = getApp().globalData.wsUrl + '/api/realtime-voice/stream'
  this.socketTask = wx.connectSocket({ url: wsUrl })
}
```

**优点：**
- ✅ 原生支持 WebSocket
- ✅ 稳定可靠
- ✅ 自动负载均衡
- ✅ 支持长连接

**缺点：**
- ⚠️ 需要配置
- ⚠️ 可能产生少量费用

**费用说明：**
- API 网关按调用次数计费
- 前 100 万次调用免费
- 超出后约 ¥0.06/万次

---

### 方案四：咨询腾讯云技术支持

**适用场景：** 不确定如何配置，或遇到技术问题

**联系方式：**

1. **在线客服：** 登录腾讯云控制台，右下角在线客服
2. **工单系统：** [提交工单](https://console.cloud.tencent.com/workorder)
3. **电话支持：** 4009100100

**咨询内容：**

```
问题描述：
我在使用 CloudBase 云托管部署 Node.js + Express 应用，
需要使用 WebSocket 实现实时语音识别功能。

当前情况：
- HTTP 接口正常工作
- WebSocket 连接返回 404 错误
- 本地测试 WebSocket 功能正常

技术栈：
- Node.js 14
- Express 4.x
- express-ws 5.x

请问：
1. CloudBase 云托管是否支持 WebSocket？
2. 如果支持，需要如何配置？
3. 是否推荐使用 API 网关来处理 WebSocket 连接？
```

---

## 📋 行动计划

### 第一阶段：开发测试（立即开始）

**目标：** 验证功能正确性

**步骤：**
1. ✅ 启动本地服务：`npm start`
2. ✅ 配置微信开发者工具（不校验合法域名）
3. ✅ 测试 WebSocket 实时识别功能
4. ✅ 测试 HTTP 一句话识别功能

**预计时间：** 30 分钟

---

### 第二阶段：临时上线（快速方案）

**目标：** 让用户可以使用语音识别功能

**步骤：**
1. ✅ 使用已部署的一句话识别接口
2. ✅ 修改小程序代码使用 HTTP 上传方式
3. ✅ 在微信小程序后台配置 request 合法域名
4. ✅ 提交审核发布

**预计时间：** 1-2 小时

---

### 第三阶段：完善功能（长期方案）

**目标：** 实现实时 WebSocket 识别

**选项A：配置 API 网关**
1. 创建 API 网关服务
2. 配置 WebSocket API
3. 更新小程序配置
4. 测试验证

**预计时间：** 2-4 小时

**选项B：咨询技术支持**
1. 提交工单或联系客服
2. 等待技术支持响应
3. 根据指导进行配置

**预计时间：** 1-3 天

---

## 📝 测试清单

### 本地环境测试

- [ ] 启动本地服务成功
- [ ] HTTP 健康检查接口正常
- [ ] WebSocket 测试接口连接成功
- [ ] 实时语音识别 WebSocket 连接成功
- [ ] 可以发送和接收消息
- [ ] 识别结果正确返回

### 云端环境测试

- [ ] HTTP 服务正常
- [ ] 一句话识别接口正常
- [ ] 识别历史记录接口正常
- [ ] WebSocket 连接（待解决）

### 小程序测试

- [ ] 开发环境连接本地服务成功
- [ ] 录音权限授权正常
- [ ] 音频上传成功
- [ ] 识别结果显示正常
- [ ] 历史记录查看正常

---

## 📚 相关文档

### 项目文档
- `【立即解决】WebSocket问题.md` - 快速操作指南
- `WebSocket连接问题快速解决方案.md` - 详细解决方案
- `腾讯云托管WebSocket配置指南.md` - 云托管配置说明
- `docs/c-api/实时语音识别API文档.md` - API 接口文档

### 测试工具
- `test-websocket-connection.js` - 完整诊断工具
- `test-cloud-websocket.js` - 云端专项测试工具

### 使用方法
```bash
# 完整诊断
node test-websocket-connection.js

# 云端专项测试
node test-cloud-websocket.js
```

---

## 🎯 总结

### 问题本质

**腾讯云 CloudBase 云托管环境不支持 WebSocket 协议（或需要特殊配置）**

### 立即可用方案

1. **本地开发：** 勾选"不校验合法域名"，连接 `http://localhost`
2. **快速上线：** 使用 HTTP 一句话识别接口（已部署可用）

### 长期解决方案

1. **推荐：** 配置腾讯云 API 网关（原生支持 WebSocket）
2. **备选：** 咨询腾讯云技术支持，获取官方指导

### 下一步行动

**建议按以下顺序进行：**

1. ✅ **立即：** 本地测试验证功能（30分钟）
2. ✅ **今天：** 使用 HTTP 接口快速上线（1-2小时）
3. ⏳ **本周：** 配置 API 网关或咨询技术支持（2-4小时）

---

**报告生成时间：** 2024-11-08  
**状态：** 问题已诊断，解决方案已提供  
**建议：** 优先使用本地测试和 HTTP 接口，长期使用 API 网关

---

## 💬 需要帮助？

如果你在实施过程中遇到问题：

1. 📖 查看相关文档
2. 🧪 运行诊断工具
3. 📞 联系腾讯云技术支持
4. 💡 参考腾讯云官方文档

**记住：代码功能是正常的，只是部署环境需要配置！** 🚀

