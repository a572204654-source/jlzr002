# 添加 CLOUDBASE_ENV_ID 环境变量

## 🚨 当前问题

诊断接口显示 `CLOUDBASE_ENV_ID` 未设置，导致云存储功能无法使用。

## ✅ 解决步骤

### 步骤1：登录云托管控制台

1. 访问 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境（envId: `jlzr1101-5g9kplxza13a780d`）
3. 进入 **云托管** 服务
4. 找到你的服务（service: `express` 或你的服务名称）

### 步骤2：添加环境变量

1. 进入服务的 **配置管理** 或 **环境变量** 页面
2. 点击 **添加环境变量** 或 **编辑环境变量**
3. 添加以下环境变量：

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `CLOUDBASE_ENV_ID` | `jlzr1101-5g9kplxza13a780d` | CloudBase环境ID（必需） |

### 步骤3：保存并重启服务

1. 点击 **保存** 按钮
2. **重要**：必须重启服务使环境变量生效
   - 在服务页面找到 **重启** 或 **重新部署** 按钮
   - 点击重启服务

### 步骤4：验证配置

重启服务后，访问诊断接口验证：

```
https://api.yimengpl.com/diagnose
```

检查返回的 JSON 中：
- `environment.CLOUDBASE_ENV_ID` 应该显示为 `jlzr1101-5g9kplxza13a780d`（而不是"未设置"）

## 📋 完整环境变量列表

确保以下环境变量都已配置：

| 变量名 | 状态 | 说明 |
|--------|------|------|
| `CLOUDBASE_ENV_ID` | ❌ **需要添加** | CloudBase环境ID |
| `TENCENTCLOUD_SECRET_ID` | ✅ 已配置 | 腾讯云API密钥ID |
| `TENCENTCLOUD_SECRET_KEY` | ✅ 已配置 | 腾讯云API密钥Key |

## ⚠️ 注意事项

1. **变量名必须完全一致**：`CLOUDBASE_ENV_ID`（全大写，使用下划线）
2. **变量值不要有多余空格**：`jlzr1101-5g9kplxza13a780d`
3. **必须重启服务**：添加环境变量后必须重启服务才能生效
4. **验证配置**：使用诊断接口确认配置是否生效

## 🔍 如果仍然不生效

如果重启后诊断接口仍然显示"未设置"，请检查：

1. **变量名拼写**：确认是 `CLOUDBASE_ENV_ID`（不是 `CLOUDBASE_ENV`）
2. **服务是否重启**：确认服务已完全重启（查看服务状态）
3. **环境是否正确**：确认在正确的环境和服务中配置
4. **等待时间**：重启后可能需要等待1-2分钟才能生效

## 📞 测试文件上传

配置成功后，可以测试文件上传功能：

```bash
# 1. 登录获取token
curl -X POST https://api.yimengpl.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_wechat_code_test"}'

# 2. 创建会话（替换 {token} 为实际token）
curl -X POST https://api.yimengpl.com/api/v1/ai-chat/session \
  -H "Authorization: Bearer {token}"

# 3. 上传文件（替换 {token} 和 {sessionId}）
curl -X POST https://api.yimengpl.com/api/v1/ai-chat/upload-file \
  -H "Authorization: Bearer {token}" \
  -F "file=@你的文件路径" \
  -F "sessionId={sessionId}" \
  -F "message=请分析这个文件"
```

