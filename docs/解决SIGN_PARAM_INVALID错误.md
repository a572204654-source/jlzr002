# 解决 SIGN_PARAM_INVALID 错误

## 错误说明

`SIGN_PARAM_INVALID` 是 CloudBase API 调用时的鉴权失败错误，表示签名参数无效。这通常发生在调用 `tcb:InvokeFunction` 或 `tcb:GetUploadMetadata` 等操作时。

## 错误原因

1. **缺少必要的权限**：Secret ID/Key 没有 CloudBase 相关权限
   - 缺少 `tcb:InvokeFunction` 权限
   - 缺少 `tcb:GetUploadMetadata` 权限
   - 缺少 `QcloudTCBFullAccess` 权限策略

2. **密钥类型不匹配**：使用了通用腾讯云 API 密钥，而不是 CloudBase 环境绑定的专用密钥

3. **环境ID和密钥不匹配**：密钥不属于当前 CloudBase 环境

## 解决方案

### 方案1：添加 CloudBase 权限（推荐）

**步骤**：

1. 登录腾讯云控制台：https://console.cloud.tencent.com/
2. 进入"访问管理 > API密钥管理"：https://console.cloud.tencent.com/cam/capi
3. 找到您使用的 Secret ID
4. 点击"授权"或"关联策略"
5. 添加以下权限策略之一：
   - **QcloudTCBFullAccess**（推荐）- CloudBase 全读写权限
   - 或自定义策略包含以下操作：
     - `tcb:InvokeFunction`
     - `tcb:GetUploadMetadata`
     - `tcb:UploadFile`
     - `cos:PutObject`
     - `cos:GetObject`
     - `cos:DeleteObject`

6. 保存后等待权限生效（通常立即生效）
7. 重新测试文件上传

**优点**：
- 使用 CloudBase SDK，功能完整
- 支持所有 CloudBase 功能

**缺点**：
- 需要修改权限配置
- 可能需要管理员权限

### 方案2：使用 CloudBase 环境密钥

**步骤**：

1. 登录 CloudBase 控制台：https://console.cloud.tencent.com/tcb
2. 进入您的环境（例如：`jlzr1101-5g9kplxza13a780d`）
3. 进入"环境设置 > 安全配置"
4. 获取环境绑定的专用密钥
5. 在 `.env` 文件中替换：
   ```env
   TENCENTCLOUD_SECRET_ID=环境绑定的SecretID
   TENCENTCLOUD_SECRET_KEY=环境绑定的SecretKey
   ```

**优点**：
- 密钥与环境匹配，权限正确
- 安全性更高

**缺点**：
- 需要从控制台获取密钥
- 可能需要在每个环境单独配置

### 方案3：使用 COS SDK 直接上传（无需 CloudBase 权限）

如果无法添加 CloudBase 权限，可以使用 COS SDK 直接上传到对象存储。

**步骤**：

1. 已安装 `cos-nodejs-sdk-v5`（已完成）

2. 修改上传路由，使用 COS SDK：
   ```javascript
   // 在 routes/v1/attachment.js 或其他上传路由中
   // 将
   const { uploadFile } = require('../../utils/cloudStorage')
   // 改为
   const { uploadFile } = require('../../utils/cloudStorageCOS')
   ```

3. 配置 COS 区域（如果需要）：
   ```env
   COS_REGION=ap-shanghai  # 根据您的 CloudBase 环境区域设置
   ```

4. 确保 Secret ID/Key 有 COS 权限：
   - 在腾讯云控制台添加 `QcloudCOSFullAccess` 权限
   - 或至少包含 `cos:PutObject`、`cos:GetObject`、`cos:DeleteObject` 权限

**优点**：
- 不需要 CloudBase 权限
- 直接操作 COS，性能更好
- 更灵活的控制

**缺点**：
- 需要 COS 权限
- 需要手动管理 Bucket 和路径
- 可能无法使用 CloudBase 的一些高级功能

### 方案4：使用临时密钥（STS）

如果不想使用永久密钥，可以通过 STS 服务获取临时密钥。

**步骤**：

1. 配置 STS 服务
2. 获取临时密钥（SecretId、SecretKey、SessionToken）
3. 使用临时密钥初始化 CloudBase SDK：
   ```javascript
   const app = cloudbase.init({
     env: envId,
     secretId: tempSecretId,
     secretKey: tempSecretKey,
     sessionToken: sessionToken  // 临时密钥需要
   })
   ```

**优点**：
- 安全性更高
- 密钥有时效性

**缺点**：
- 需要实现 STS 服务
- 需要定期刷新密钥
- 实现复杂度较高

## 推荐方案

根据您的具体情况选择：

1. **如果您有权限管理权限**：使用方案1（添加 CloudBase 权限）
2. **如果您可以获取环境密钥**：使用方案2（使用环境密钥）
3. **如果您只有 COS 权限**：使用方案3（使用 COS SDK）
4. **如果您需要高安全性**：使用方案4（使用临时密钥）

## 测试步骤

### 1. 检查权限配置

```bash
node test-permission-check.js
```

### 2. 测试 CloudBase SDK 上传

```bash
node test-upload-debug.js
```

### 3. 测试 COS SDK 上传（如果使用方案3）

创建测试脚本：
```javascript
const { uploadFile } = require('./utils/cloudStorageCOS')
const fs = require('fs')

async function test() {
  try {
    const fileContent = Buffer.from('Hello COS!')
    const result = await uploadFile(fileContent, 'test.txt')
    console.log('上传成功:', result)
  } catch (error) {
    console.error('上传失败:', error)
  }
}

test()
```

## 常见问题

### Q1: 添加权限后仍然失败？

**A**: 检查以下几点：
- 确认权限已保存并生效
- 确认 Secret ID/Key 正确
- 确认环境ID正确
- 尝试重新启动应用

### Q2: 如何确认权限是否生效？

**A**: 运行测试脚本：
```bash
node test-upload-debug.js
```

如果仍然失败，查看错误信息中的 `code` 字段：
- `SIGN_PARAM_INVALID`：权限或签名问题
- `UNAUTHORIZED`：未授权
- `FORBIDDEN`：权限不足

### Q3: COS SDK 和 CloudBase SDK 有什么区别？

**A**: 
- **CloudBase SDK**：通过 CloudBase API 操作，需要 CloudBase 权限，功能更完整
- **COS SDK**：直接操作对象存储，需要 COS 权限，性能更好，但功能较少

### Q4: 可以同时使用两种方式吗？

**A**: 可以，但建议统一使用一种方式，避免混乱。可以在配置中切换：
```javascript
// config/index.js
const useCOS = process.env.USE_COS_SDK === 'true'

// 根据配置选择
const { uploadFile } = useCOS 
  ? require('./utils/cloudStorageCOS')
  : require('./utils/cloudStorage')
```

## 相关文档

- [CloudBase 官方文档](https://cloud.tencent.com/document/product/876)
- [CloudBase Node.js SDK](https://cloud.tencent.com/document/product/876/18442)
- [COS Node.js SDK](https://cloud.tencent.com/document/product/436/8629)
- [腾讯云权限管理](https://console.cloud.tencent.com/cam)

## 更新日志

- 2024-11-06: 创建文档，添加多种解决方案
- 2024-11-06: 添加 COS SDK 替代方案

