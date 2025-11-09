# WebSocket 连接测试报告

**测试时间：** 2025-11-08 23:58  
**测试环境：** jlzr1101-5g9kplxza13a780d  
**测试域名：** https://api.yimengpl.com  
**服务名称：** node-backend  
**当前版本：** node-backend-030

---

## 📊 测试结果总结

### ❌ 所有 WebSocket 连接测试失败

| 测试项 | URL | 结果 | 错误信息 |
|--------|-----|------|----------|
| 自定义域名 WSS | `wss://api.yimengpl.com/test-ws` | ❌ 失败 | Unexpected server response: 404 |
| 自定义域名 WS | `ws://api.yimengpl.com/test-ws` | ❌ 失败 | Unexpected server response: 307 |
| 默认域名 WSS (ap-shanghai) | `wss://jlzr1101-5g9kplxza13a780d-1302271970.ap-shanghai.app.tcloudbase.com/test-ws` | ❌ 失败 | Unexpected server response: 404 |
| 默认域名 WSS (tcloudbaseapp) | `wss://jlzr1101-5g9kplxza13a780d-1302271970.tcloudbaseapp.com/test-ws` | ❌ 失败 | Unexpected server response: 404 |
| 根路径 WSS | `wss://api.yimengpl.com` | ❌ 失败 | Unexpected server response: 200 |

### ✅ HTTP 服务正常

| 测试项 | URL | 结果 |
|--------|-----|------|
| 健康检查 | `https://api.yimengpl.com/health` | ✅ 正常 |
| 服务状态 | node-backend | ✅ 运行中 |
| 流量分配 | 100% | ✅ 正常 |

---

## 🔍 问题分析

### 核心问题

**当前部署的云托管服务不支持 WebSocket 协议！**

### 错误分析

1. **404 错误 (Unexpected server response: 404)**
   - WebSocket 握手请求到达了云托管网关
   - 但网关不支持 WebSocket 协议升级
   - 返回了 HTTP 404 响应

2. **307 错误 (Unexpected server response: 307)**
   - HTTP 重定向响应
   - 说明 WS 协议被重定向到 WSS
   - 但最终仍然无法建立 WebSocket 连接

3. **200 错误 (Unexpected server response: 200)**
   - 返回了正常的 HTTP 响应
   - 说明路由存在，但不支持 WebSocket 升级

### 根本原因

根据腾讯云文档和项目中的解决方案文档：

**普通的云托管容器不支持 WebSocket！**

需要使用特殊的部署类型：`container-websocket`

---

## ✅ 解决方案

### 🎯 官方推荐方案：重新部署为 WebSocket 容器

腾讯云托管提供了专门的 WebSocket 容器类型，只需要在部署时指定类型即可。

#### 部署步骤

**1. 确认已登录正确的环境**

```bash
tcb login --key
```

确认登录的是 jlzr1101 环境。

**2. 重新部署服务（关键步骤）**

```bash
tcb run:deprecated deploy --envId jlzr1101-5g9kplxza13a780d --serviceName node-backend --type container-websocket
```

**重要：** 必须加上 `--type container-websocket` 参数！

**3. 等待部署完成**

部署过程大约需要 5-10 分钟。

**4. 测试 WebSocket 连接**

```bash
node test-websocket.js
```

#### 预期结果

部署完成后，WebSocket 连接应该能够正常建立：

```
✅ 连接成功!
📥 收到消息: {"type":"connected","message":"WebSocket 工作正常","timestamp":...}
```

---

## 📋 详细部署命令

### 方法一：使用 tcb run:deprecated deploy（推荐）

```bash
# 完整命令
tcb run:deprecated deploy \
  --envId jlzr1101-5g9kplxza13a780d \
  --serviceName node-backend \
  --type container-websocket \
  --localPath ./ \
  --dockerfilePath ./Dockerfile \
  --cpu 0.5 \
  --mem 1
```

### 方法二：使用配置文件

创建 `cloudbaserc.json`：

```json
{
  "envId": "jlzr1101-5g9kplxza13a780d",
  "framework": {
    "name": "node-backend",
    "plugins": {
      "container": {
        "use": "@cloudbase/framework-plugin-container",
        "inputs": {
          "serviceName": "node-backend",
          "serviceType": "container-websocket",
          "dockerfilePath": "./Dockerfile",
          "containerPort": 80,
          "cpu": 0.5,
          "mem": 1
        }
      }
    }
  }
}
```

然后运行：

```bash
tcb framework:deploy
```

---

## 🧪 测试方法

### 1. 使用测试脚本

```bash
node test-websocket.js
```

### 2. 使用 Postman

1. 打开 Postman
2. 新建 WebSocket Request
3. 输入地址：`wss://api.yimengpl.com/test-ws`
4. 点击 Connect
5. 发送测试消息：
   ```json
   {
     "type": "ping",
     "message": "测试消息"
   }
   ```

### 3. 使用浏览器控制台

```javascript
const ws = new WebSocket('wss://api.yimengpl.com/test-ws');

ws.onopen = () => {
  console.log('✅ WebSocket 连接成功');
  ws.send(JSON.stringify({ type: 'ping', message: '测试' }));
};

ws.onmessage = (event) => {
  console.log('📥 收到消息:', event.data);
};

ws.onerror = (error) => {
  console.error('❌ 连接错误:', error);
};
```

---

## 📚 相关文档

项目中已有详细的 WebSocket 部署文档：

1. **【立即部署】WebSocket服务.md** - 快速部署指南
2. **腾讯云托管WebSocket部署指南.md** - 详细部署文档
3. **腾讯云托管WebSocket配置指南.md** - 配置说明
4. **WebSocket问题已解决.md** - 问题解决方案

---

## 🎯 下一步行动

### 立即执行

1. ✅ **已完成**：测试当前部署的 WebSocket 连接
2. ⏳ **待执行**：重新部署为 WebSocket 容器类型
3. ⏳ **待执行**：测试 WebSocket 连接是否正常
4. ⏳ **待执行**：在小程序中测试实时语音识别功能

### 部署命令（复制即用）

```bash
# 1. 确认登录
tcb login --key

# 2. 重新部署（关键步骤）
tcb run:deprecated deploy \
  --envId jlzr1101-5g9kplxza13a780d \
  --serviceName node-backend \
  --type container-websocket

# 3. 测试连接
node test-websocket.js
```

---

## 💡 重要提示

### ⚠️ 注意事项

1. **不要删除现有服务**：直接重新部署即可，会自动更新
2. **保留环境变量**：重新部署不会丢失环境变量配置
3. **流量切换**：新版本部署后需要手动切换流量到新版本
4. **测试充分**：切换流量前先测试新版本是否正常

### 📊 预期效果

部署完成后：

- ✅ HTTP 接口继续正常工作
- ✅ WebSocket 连接能够正常建立
- ✅ 实时语音识别功能可用
- ✅ 自定义域名 `wss://api.yimengpl.com` 可用

---

## 📞 技术支持

如果部署过程中遇到问题：

1. **查看部署日志**：
   ```bash
   tcb run:deprecated version list --envId jlzr1101-5g9kplxza13a780d --serviceName node-backend
   ```

2. **查看服务日志**：
   - 登录腾讯云控制台
   - 进入云托管 → node-backend 服务
   - 查看实时日志

3. **联系腾讯云技术支持**：
   - 提工单说明需要启用 WebSocket 支持
   - 提供环境 ID：jlzr1101-5g9kplxza13a780d
   - 提供服务名称：node-backend

---

**测试完成时间：** 2025-11-08 23:58  
**报告生成：** 自动生成  
**测试工具：** test-websocket.js

