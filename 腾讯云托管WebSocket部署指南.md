# 腾讯云托管 WebSocket 部署指南

**重要发现：** 腾讯云托管支持 WebSocket，但需要使用**容器型云托管**并指定 `--type container-websocket` 参数！

---

## 📋 前置条件

### 1. 确认云托管类型

腾讯云托管分为两种类型：

- **普通容器型** - 不支持 WebSocket
- **容器型 WebSocket** - 支持 WebSocket ✅

**如果你当前使用的是普通容器型，需要重新部署为 WebSocket 类型！**

### 2. 准备工作

- ✅ 腾讯云账号
- ✅ CloudBase 项目（已创建）
- ✅ 项目代码（已准备好）
- ✅ Dockerfile（已存在）

---

## 🚀 部署步骤

### 步骤 1：安装 CloudBase CLI

在本地安装腾讯云 CloudBase 命令行工具：

```bash
npm install -g @cloudbase/cli
```

验证安装：

```bash
cloudbase -v
```

或使用简写：

```bash
tcb -v
```

---

### 步骤 2：登录 CloudBase

```bash
# 方式一：使用 cloudbase 命令
cloudbase login

# 方式二：使用简写 tcb
tcb login

# 方式三：直接指定项目 ID
tcb login <your-project-id>
```

**获取项目 ID：**
1. 登录 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境
3. 在【概览】页面可以看到【环境 ID】

---

### 步骤 3：检查 Dockerfile

确保项目根目录有 `Dockerfile`，内容如下：

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 80

CMD ["npm", "start"]
```

**重要：** WebSocket 服务必须监听 `80` 端口（或通过环境变量 `PORT` 指定）

---

### 步骤 4：部署 WebSocket 服务

**关键命令：** 必须指定 `--type container-websocket` 参数！

```bash
# 进入项目目录
cd /path/to/your/project

# 部署 WebSocket 服务
tcb cloudrun deploy <your-service-name> --type container-websocket
```

**参数说明：**
- `<your-service-name>` - 服务名称，例如：`miniapp-backend`
- `--type container-websocket` - **必需参数**，指定为 WebSocket 类型

**完整示例：**

```bash
# 假设服务名称为 miniapp-backend
tcb cloudrun deploy miniapp-backend --type container-websocket
```

---

### 步骤 5：配置环境变量

部署时或部署后，需要配置环境变量：

**方式一：部署时指定**

创建 `cloudbaserc.json` 文件：

```json
{
  "envId": "your-env-id",
  "cloudrun": {
    "service": {
      "miniapp-backend": {
        "type": "container-websocket",
        "cpu": 0.5,
        "mem": 1,
        "minNum": 0,
        "maxNum": 5,
        "policyType": "cpu",
        "policyThreshold": 60,
        "envVariables": {
          "DB_HOST": "your-db-host",
          "DB_PORT": "3306",
          "DB_USER": "your-db-user",
          "DB_PASSWORD": "your-db-password",
          "DB_NAME": "your-db-name",
          "WECHAT_APPID": "your-appid",
          "WECHAT_APPSECRET": "your-appsecret",
          "JWT_SECRET": "your-jwt-secret",
          "TENCENT_SECRET_ID": "your-secret-id",
          "TENCENT_SECRET_KEY": "your-secret-key"
        }
      }
    }
  }
}
```

然后执行：

```bash
tcb cloudrun deploy miniapp-backend
```

**方式二：控制台配置**

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 进入【云托管】→【服务列表】
3. 找到你的服务，点击【服务配置】
4. 在【环境变量】中添加所需配置

---

### 步骤 6：获取服务域名

部署完成后：

1. 进入 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 左侧导航栏选择【云托管】
3. 在【服务列表】页面找到刚部署的服务
4. 点击进入【服务详情】页面
5. 找到【默认域名】，例如：`miniapp-backend-xxx.service.tcloudbase.com`

---

### 步骤 7：测试 WebSocket 连接

#### 方式一：使用项目测试工具

修改 `test-cloud-websocket.js` 中的域名：

```javascript
const CLOUD_URL = 'https://miniapp-backend-xxx.service.tcloudbase.com'
```

运行测试：

```bash
node test-cloud-websocket.js
```

#### 方式二：使用 Postman

1. 打开 Postman
2. 创建新的 WebSocket 请求
3. 输入地址：`wss://miniapp-backend-xxx.service.tcloudbase.com/api/realtime-voice/stream`
4. 点击【Connect】
5. 发送测试消息

#### 方式三：使用 Node.js 脚本

```javascript
const WebSocket = require('ws')

const ws = new WebSocket('wss://miniapp-backend-xxx.service.tcloudbase.com/api/realtime-voice/stream')

ws.on('open', () => {
  console.log('✅ WebSocket 连接成功')
  
  // 发送初始化消息
  ws.send(JSON.stringify({
    type: 'start',
    userId: 1,
    token: 'test_token',
    engineType: '16k_zh'
  }))
})

ws.on('message', (data) => {
  console.log('收到消息:', data.toString())
})

ws.on('error', (err) => {
  console.error('❌ 连接错误:', err.message)
})

ws.on('close', (code, reason) => {
  console.log('连接关闭:', code, reason.toString())
})
```

---

## 🔧 配置自定义域名

### 步骤 1：添加自定义域名

1. 在【服务详情】页面，找到【域名管理】
2. 点击【添加域名】
3. 输入你的域名：`api.yimengpl.com`
4. 按提示完成域名验证

### 步骤 2：配置 DNS

在你的域名服务商处添加 CNAME 记录：

```
记录类型: CNAME
主机记录: api
记录值: miniapp-backend-xxx.service.tcloudbase.com
```

### 步骤 3：配置 SSL 证书

CloudBase 会自动为自定义域名申请 SSL 证书，等待几分钟即可。

### 步骤 4：测试自定义域名

```bash
# HTTP 测试
curl https://api.yimengpl.com/health

# WebSocket 测试
node test-cloud-websocket.js
```

---

## 📱 更新小程序配置

### 步骤 1：配置合法域名

登录 [微信公众平台](https://mp.weixin.qq.com/)：

1. 进入【开发】→【开发管理】→【开发设置】
2. 在【服务器域名】中配置：

**request 合法域名：**
```
https://api.yimengpl.com
```

**socket 合法域名：**
```
wss://api.yimengpl.com
```

### 步骤 2：更新小程序代码

在 `app.js` 中确认配置：

```javascript
App({
  globalData: {
    apiUrl: 'https://api.yimengpl.com',
    // WebSocket 使用相同域名，只是协议不同
    // 在连接时会自动转换为 wss://
  }
})
```

在 `pages/realtime-voice/realtime-voice.js` 中：

```javascript
connectWebSocket() {
  const apiUrl = getApp().globalData.apiUrl
  // 将 https:// 替换为 wss://
  const wsUrl = apiUrl.replace('https://', 'wss://') + '/api/realtime-voice/stream'
  
  console.log('连接 WebSocket:', wsUrl)
  
  this.socketTask = wx.connectSocket({
    url: wsUrl,
    header: {
      'content-type': 'application/json'
    },
    success: () => {
      console.log('WebSocket 连接成功')
    },
    fail: (err) => {
      console.error('WebSocket 连接失败:', err)
    }
  })
  
  // ... 其他代码
}
```

---

## 🐛 常见问题

### 问题 1：部署时提示"服务不存在"

**原因：** 首次部署需要先创建服务

**解决：**

```bash
# 创建服务
tcb cloudrun create miniapp-backend --type container-websocket

# 然后部署
tcb cloudrun deploy miniapp-backend
```

---

### 问题 2：WebSocket 连接返回 404

**可能原因：**
1. 部署时没有指定 `--type container-websocket`
2. 服务类型不正确

**解决方案：**

```bash
# 删除旧服务
tcb cloudrun delete miniapp-backend

# 重新创建 WebSocket 类型服务
tcb cloudrun create miniapp-backend --type container-websocket

# 部署
tcb cloudrun deploy miniapp-backend
```

---

### 问题 3：WebSocket 连接超时

**可能原因：**
1. 服务未启动
2. 端口配置错误
3. 防火墙限制

**检查步骤：**

1. 查看服务日志：
```bash
tcb cloudrun logs miniapp-backend
```

2. 确认服务状态：
```bash
tcb cloudrun list
```

3. 确认端口配置：
   - 服务必须监听 `80` 端口
   - 或通过环境变量 `PORT` 指定

---

### 问题 4：本地测试正常，云端失败

**可能原因：**
1. 环境变量未配置
2. 数据库连接失败
3. 腾讯云 API 密钥未配置

**解决方案：**

1. 检查环境变量配置
2. 查看云托管日志
3. 确认数据库内网地址

---

## 📊 部署检查清单

### 部署前检查

- [ ] 已安装 CloudBase CLI
- [ ] 已登录 CloudBase
- [ ] Dockerfile 存在且正确
- [ ] package.json 配置正确
- [ ] 环境变量已准备

### 部署时检查

- [ ] 使用 `--type container-websocket` 参数
- [ ] 服务名称正确
- [ ] 部署成功无错误

### 部署后检查

- [ ] 服务状态正常
- [ ] HTTP 接口可访问
- [ ] WebSocket 可连接
- [ ] 日志无错误

### 小程序配置

- [ ] request 合法域名已配置
- [ ] socket 合法域名已配置
- [ ] 小程序代码已更新
- [ ] 真机测试通过

---

## 🎯 完整部署流程

### 1. 安装和登录

```bash
# 安装 CLI
npm install -g @cloudbase/cli

# 登录
tcb login
```

### 2. 创建 WebSocket 服务

```bash
# 创建服务（首次部署）
tcb cloudrun create miniapp-backend --type container-websocket
```

### 3. 部署服务

```bash
# 进入项目目录
cd /path/to/your/project

# 部署
tcb cloudrun deploy miniapp-backend --type container-websocket
```

### 4. 配置环境变量

在控制台或通过 `cloudbaserc.json` 配置环境变量。

### 5. 配置自定义域名

在控制台添加 `api.yimengpl.com` 并配置 DNS。

### 6. 测试连接

```bash
# 测试 HTTP
curl https://api.yimengpl.com/health

# 测试 WebSocket
node test-cloud-websocket.js
```

### 7. 配置小程序

在微信公众平台配置合法域名。

### 8. 发布上线

提交小程序审核并发布。

---

## 📝 重要提示

### ⚠️ 必须使用 WebSocket 类型

**普通容器型云托管不支持 WebSocket！**

部署时必须指定：
```bash
--type container-websocket
```

### ⚠️ 端口配置

WebSocket 服务必须监听 `80` 端口：

```javascript
// app.js
const port = process.env.PORT || 80
app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`)
})
```

### ⚠️ 协议转换

- HTTP 接口：`https://api.yimengpl.com`
- WebSocket 接口：`wss://api.yimengpl.com`

注意协议的转换（https → wss）

---

## 📚 相关文档

### 官方文档
- [CloudBase 云托管文档](https://cloud.tencent.com/document/product/1243)
- [CloudBase CLI 文档](https://docs.cloudbase.net/cli/intro.html)
- [容器型 WebSocket 配置](https://cloud.tencent.com/document/product/1243/49177)

### 项目文档
- `WebSocket问题诊断报告.md` - 问题诊断
- `腾讯云托管WebSocket配置指南.md` - 配置说明
- `test-cloud-websocket.js` - 测试工具

---

## ✅ 总结

### 关键点

1. **必须使用容器型 WebSocket** - 指定 `--type container-websocket`
2. **端口必须是 80** - CloudBase 要求
3. **协议转换** - https → wss
4. **域名配置** - request 和 socket 都要配置

### 部署命令

```bash
# 核心命令
tcb cloudrun deploy miniapp-backend --type container-websocket
```

### 测试验证

```bash
# HTTP 测试
curl https://api.yimengpl.com/health

# WebSocket 测试
node test-cloud-websocket.js
```

---

**最后更新：** 2024-11-08  
**状态：** 已找到官方 WebSocket 部署方案  
**下一步：** 重新部署为 WebSocket 类型服务

🚀 **现在你可以正式部署 WebSocket 服务了！**

