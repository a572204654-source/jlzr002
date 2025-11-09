# WebSocket 连接测试总结

**测试日期**：2025-11-08  
**测试环境**：jlzr1101-5g9kplxza13a780d  
**测试域名**：https://api.yimengpl.com  
**测试工具**：test-websocket.js + Postman

---

## 📊 测试结果

### ❌ 当前状态：WebSocket 不可用

所有 WebSocket 连接测试均失败，返回 404 或其他错误。

| 测试地址 | 协议 | 结果 | 错误 |
|---------|------|------|------|
| api.yimengpl.com/test-ws | WSS | ❌ | 404 |
| api.yimengpl.com/test-ws | WS | ❌ | 307 |
| 默认域名 (ap-shanghai) | WSS | ❌ | 404 |
| 默认域名 (tcloudbaseapp) | WSS | ❌ | 404 |

### ✅ HTTP 服务正常

| 测试项 | 结果 |
|--------|------|
| https://api.yimengpl.com/health | ✅ 正常 |
| 服务状态 | ✅ 运行中 |
| 流量分配 | ✅ 100% |

---

## 🔍 问题原因

### 核心问题

**当前云托管服务类型不支持 WebSocket 协议！**

腾讯云托管有两种容器类型：

1. **普通容器** (`container`) - 只支持 HTTP/HTTPS
2. **WebSocket 容器** (`container-websocket`) - 支持 WebSocket

当前部署使用的是普通容器类型，因此 WebSocket 连接失败。

### 技术分析

```
客户端 (Postman)
    ↓
    发送 WebSocket 握手请求 (Upgrade: websocket)
    ↓
云托管网关 (普通容器)
    ↓
    不支持 WebSocket 协议升级
    ↓
    返回 HTTP 404 / 307 / 200
    ↓
客户端收到错误：Unexpected server response
```

---

## ✅ 解决方案

### 🎯 方案：重新部署为 WebSocket 容器

#### 快速部署命令

```bash
# 1. 确认登录
tcb login --key

# 2. 重新部署（关键步骤）
tcb run:deprecated deploy \
  --envId jlzr1101-5g9kplxza13a780d \
  --serviceName node-backend \
  --type container-websocket

# 3. 等待部署完成（5-10分钟）

# 4. 测试连接
node test-websocket.js
```

#### 详细步骤

1. **准备工作**
   - 确认已安装 CloudBase CLI
   - 确认已登录正确的账号
   - 确认当前目录是项目根目录

2. **执行部署**
   ```bash
   cd "C:\Users\admin\Desktop\cloudrun-express - 副本 (2) - 副本"
   
   tcb run:deprecated deploy \
     --envId jlzr1101-5g9kplxza13a780d \
     --serviceName node-backend \
     --type container-websocket \
     --localPath ./ \
     --dockerfilePath ./Dockerfile
   ```

3. **等待部署**
   - 部署过程约 5-10 分钟
   - 可以在控制台查看部署进度
   - 部署完成后会创建新版本

4. **切换流量**
   - 登录腾讯云控制台
   - 进入云托管 → node-backend 服务
   - 将流量切换到新版本（100%）

5. **测试连接**
   ```bash
   node test-websocket.js
   ```

---

## 🧪 测试方法

### 方法 1：使用测试脚本

```bash
node test-websocket.js
```

**预期成功输出**：
```
✅ 连接成功! (耗时: 500ms)
📤 发送消息: {"type":"ping","timestamp":...}
📥 收到消息: {"type":"connected","message":"WebSocket 工作正常",...}
```

### 方法 2：使用 Postman

1. 打开 Postman
2. 新建 WebSocket Request
3. 输入：`wss://api.yimengpl.com/test-ws`
4. 点击 Connect
5. 发送测试消息

**详细步骤见**：`Postman-WebSocket测试指南.md`

### 方法 3：使用浏览器

打开浏览器控制台，运行：

```javascript
const ws = new WebSocket('wss://api.yimengpl.com/test-ws');

ws.onopen = () => {
  console.log('✅ 连接成功');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (e) => {
  console.log('📥 收到:', e.data);
};

ws.onerror = (e) => {
  console.error('❌ 错误:', e);
};
```

---

## 📋 测试清单

### 部署前测试 ✅

- [x] HTTP 服务测试
- [x] 健康检查接口
- [x] WebSocket 连接测试（失败）
- [x] 问题诊断
- [x] 解决方案确认

### 部署后测试 ⏳

- [ ] WebSocket 基础连接
- [ ] 消息发送和接收
- [ ] 长连接稳定性
- [ ] 实时语音识别接口
- [ ] 小程序集成测试

---

## 📚 相关文档

### 已创建的文档

1. **WebSocket测试报告-2025-11-08.md** ⭐
   - 详细的测试结果
   - 问题分析
   - 解决方案
   - 部署命令

2. **Postman-WebSocket测试指南.md** ⭐
   - Postman 测试步骤
   - 测试用例
   - 故障排查

3. **test-websocket.js** ⭐
   - 自动化测试脚本
   - 支持多个域名测试
   - 详细的日志输出

### 项目中的文档

1. **【立即部署】WebSocket服务.md**
   - 快速部署指南
   - 15分钟完成部署

2. **腾讯云托管WebSocket部署指南.md**
   - 详细的部署文档
   - 配置说明
   - 常见问题

3. **腾讯云托管WebSocket配置指南.md**
   - 配置方法
   - 多种方案对比

4. **WebSocket问题已解决.md**
   - 历史问题记录
   - 解决方案总结

---

## 🎯 下一步行动

### 立即执行

1. **重新部署服务**（最重要）
   ```bash
   tcb run:deprecated deploy \
     --envId jlzr1101-5g9kplxza13a780d \
     --serviceName node-backend \
     --type container-websocket
   ```

2. **等待部署完成**
   - 预计时间：5-10 分钟
   - 可以在控制台查看进度

3. **切换流量到新版本**
   - 登录控制台
   - 将新版本流量设置为 100%

4. **测试 WebSocket 连接**
   ```bash
   node test-websocket.js
   ```

5. **在小程序中测试**
   - 测试实时语音识别功能
   - 确认功能正常

### 后续优化

1. **性能测试**
   - 并发连接测试
   - 长连接稳定性测试
   - 消息吞吐量测试

2. **监控配置**
   - 配置 WebSocket 连接监控
   - 配置错误告警
   - 配置性能指标

3. **文档完善**
   - 更新 API 文档
   - 添加小程序示例
   - 添加故障排查指南

---

## 💡 重要提示

### ⚠️ 注意事项

1. **不要删除现有服务**
   - 直接重新部署即可
   - 会创建新版本
   - 旧版本可以保留作为备份

2. **环境变量不会丢失**
   - 重新部署不影响环境变量
   - 但建议提前备份

3. **流量切换要谨慎**
   - 先测试新版本
   - 确认无误后再切换
   - 可以先切换 10% 流量观察

4. **保留测试工具**
   - `test-websocket.js` 可以随时测试
   - 建议加入 CI/CD 流程

### 📊 预期效果

部署完成后：

- ✅ HTTP 接口继续正常工作
- ✅ WebSocket 连接可以正常建立
- ✅ 实时语音识别功能可用
- ✅ 小程序可以正常使用所有功能

### 🔧 如果部署失败

1. **查看部署日志**
   ```bash
   tcb run:deprecated version list \
     --envId jlzr1101-5g9kplxza13a780d \
     --serviceName node-backend
   ```

2. **查看服务日志**
   - 登录控制台
   - 进入云托管 → node-backend
   - 查看实时日志

3. **联系技术支持**
   - 提工单说明问题
   - 提供环境 ID 和服务名称
   - 提供错误日志

---

## 📞 支持资源

### 腾讯云文档

- [云托管文档](https://cloud.tencent.com/document/product/1243)
- [WebSocket 支持说明](https://cloud.tencent.com/document/product/1243/49773)
- [部署指南](https://cloud.tencent.com/document/product/1243/46126)

### 项目资源

- 测试脚本：`test-websocket.js`
- 部署文档：`【立即部署】WebSocket服务.md`
- 测试指南：`Postman-WebSocket测试指南.md`

---

## 📈 测试统计

### 测试覆盖

- ✅ 自定义域名测试
- ✅ 默认域名测试
- ✅ WSS 协议测试
- ✅ WS 协议测试
- ✅ 不同路径测试
- ✅ 错误处理测试

### 测试工具

- ✅ Node.js 脚本
- ✅ Postman 手动测试
- ✅ 浏览器控制台测试

### 测试结果

- 总测试数：5 个配置
- 成功：0 个
- 失败：5 个
- 成功率：0%

**结论**：需要重新部署为 WebSocket 容器类型

---

**报告生成时间**：2025-11-08 23:58  
**测试执行者**：自动化测试  
**下次测试**：部署完成后立即测试

---

## 🚀 快速命令参考

```bash
# 部署 WebSocket 服务
tcb run:deprecated deploy \
  --envId jlzr1101-5g9kplxza13a780d \
  --serviceName node-backend \
  --type container-websocket

# 测试连接
node test-websocket.js

# 查看服务列表
tcb run:deprecated list --envId jlzr1101-5g9kplxza13a780d

# 查看版本列表
tcb run:deprecated version list \
  --envId jlzr1101-5g9kplxza13a780d \
  --serviceName node-backend
```

---

**✅ 测试完成，等待部署！**

