# 【立即部署】WebSocket 服务

## 🎯 核心发现

**腾讯云托管支持 WebSocket！** 但需要使用特殊的部署类型：`container-websocket`

---

## 🚀 5 步完成部署

### 步骤 1：安装 CloudBase CLI（2分钟）

```bash
npm install -g @cloudbase/cli
```

---

### 步骤 2：登录（1分钟）

```bash
tcb login
```

浏览器会自动打开，扫码登录即可。

---

### 步骤 3：部署 WebSocket 服务（5分钟）

**关键命令：**

```bash
# 进入项目目录
cd "C:\Users\admin\Desktop\cloudrun-express - 副本 (2) - 副本"

# 部署 WebSocket 服务（注意 --type 参数）
tcb cloudrun deploy miniapp-backend --type container-websocket
```

**重要：** 必须加上 `--type container-websocket` 参数！

---

### 步骤 4：配置环境变量（3分钟）

部署完成后，在 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) 配置环境变量：

1. 进入【云托管】→【服务列表】
2. 找到 `miniapp-backend` 服务
3. 点击【服务配置】→【环境变量】
4. 添加以下变量：

```
DB_HOST=你的数据库内网地址
DB_PORT=3306
DB_USER=数据库用户名
DB_PASSWORD=数据库密码
DB_NAME=数据库名称
WECHAT_APPID=微信小程序AppID
WECHAT_APPSECRET=微信小程序AppSecret
JWT_SECRET=你的JWT密钥
TENCENT_SECRET_ID=腾讯云SecretId
TENCENT_SECRET_KEY=腾讯云SecretKey
```

---

### 步骤 5：测试连接（2分钟）

获取服务域名后，修改 `test-cloud-websocket.js`：

```javascript
const CLOUD_URL = 'https://你的服务域名.service.tcloudbase.com'
```

运行测试：

```bash
node test-cloud-websocket.js
```

应该看到：

```
✅ 云端服务运行正常
✅ 简单 WebSocket 连接成功
✅ 实时语音 WebSocket 连接成功
```

---

## 🎉 完成！

如果测试通过，你的 WebSocket 服务就部署成功了！

---

## 📱 配置小程序

### 1. 配置合法域名

登录 [微信公众平台](https://mp.weixin.qq.com/)：

**request 合法域名：**
```
https://api.yimengpl.com
```

**socket 合法域名：**
```
wss://api.yimengpl.com
```

### 2. 更新小程序代码

确认 `app.js` 中的配置：

```javascript
App({
  globalData: {
    apiUrl: 'https://api.yimengpl.com'
  }
})
```

WebSocket 连接时会自动转换为 `wss://api.yimengpl.com`

---

## ❓ 常见问题

### Q1: 如果之前已经部署过普通服务怎么办？

**A:** 需要删除旧服务，重新部署为 WebSocket 类型：

```bash
# 删除旧服务
tcb cloudrun delete miniapp-backend

# 创建 WebSocket 服务
tcb cloudrun create miniapp-backend --type container-websocket

# 部署
tcb cloudrun deploy miniapp-backend --type container-websocket
```

---

### Q2: 如何查看服务日志？

```bash
tcb cloudrun logs miniapp-backend
```

或在控制台查看实时日志。

---

### Q3: 如何绑定自定义域名？

1. 在【云托管】→【服务详情】→【域名管理】
2. 添加域名 `api.yimengpl.com`
3. 按提示配置 DNS CNAME 记录
4. 等待 SSL 证书自动申请

---

## 📋 检查清单

部署前：
- [ ] 已安装 CloudBase CLI
- [ ] 已登录 CloudBase
- [ ] 项目代码已准备好

部署时：
- [ ] 使用了 `--type container-websocket` 参数
- [ ] 部署成功无错误

部署后：
- [ ] 环境变量已配置
- [ ] HTTP 接口可访问
- [ ] WebSocket 可连接
- [ ] 小程序合法域名已配置

---

## 🎯 核心命令

```bash
# 安装 CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署 WebSocket 服务（关键命令）
tcb cloudrun deploy miniapp-backend --type container-websocket

# 查看日志
tcb cloudrun logs miniapp-backend

# 测试连接
node test-cloud-websocket.js
```

---

## 💡 重要提示

### ⚠️ 必须指定类型

**普通容器型不支持 WebSocket！**

部署时必须加上：
```bash
--type container-websocket
```

### ⚠️ 端口必须是 80

确保 `app.js` 中：

```javascript
const port = process.env.PORT || 80
app.listen(port)
```

### ⚠️ 协议转换

- HTTP: `https://api.yimengpl.com`
- WebSocket: `wss://api.yimengpl.com`

---

## 📞 需要帮助？

如果遇到问题：

1. 查看服务日志：`tcb cloudrun logs miniapp-backend`
2. 运行测试工具：`node test-cloud-websocket.js`
3. 查看详细文档：`腾讯云托管WebSocket部署指南.md`
4. 联系腾讯云技术支持

---

**预计总时间：** 15-20 分钟  
**难度：** ⭐⭐ 简单

🚀 **开始部署吧！**

