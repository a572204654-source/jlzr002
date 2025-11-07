# 云托管快速部署（5分钟）

## 前置条件

✅ 已有腾讯云账号并开通CloudBase  
✅ 已有MySQL数据库并完成初始化  
✅ 已获取微信小程序AppID和AppSecret

---

## 快速部署

### 1️⃣ 安装CLI工具（如未安装）

```bash
npm install -g @cloudbase/cli
cloudbase login
```

### 2️⃣ 配置环境变量

在云托管控制台配置（**重要：使用数据库内网地址**）：

```bash
# 必需配置
DB_HOST=xxx.sql.tencentcdb.com  # 内网地址！
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=supervision_log
WECHAT_APPID=你的AppID
WECHAT_APPSECRET=你的AppSecret
JWT_SECRET=生产环境强密码
NODE_ENV=production

# 可选配置（不用可不配）
DOUBAO_API_KEY=豆包Key
DOUBAO_ENDPOINT_ID=豆包Endpoint
QWEATHER_API_KEY=和风Key
```

### 3️⃣ 一键部署

```bash
# 使用CLI部署
cloudbase framework:deploy

# 或使用脚本部署（Linux/Mac）
bash scripts/deploy.sh
```

### 4️⃣ 验证部署

```bash
# 访问健康检查（替换为你的域名）
curl https://你的服务域名.service.tcloudbase.com/health

# 期望返回
{"status":"ok","database":"connected"}
```

### 5️⃣ 配置小程序

1. 登录微信小程序后台
2. 开发 → 开发设置 → 服务器域名
3. 添加：`https://你的服务域名.service.tcloudbase.com`
4. 更新小程序代码中的 `BASE_URL`

---

## 完成！🎉

现在你可以：
- ✅ 使用小程序登录
- ✅ 创建项目和工程
- ✅ 记录监理日志
- ✅ 导出Word文档
- ✅ 使用AI助手（如已配置）

---

## 常见问题

### ❌ 数据库连接失败

确保使用**内网地址**（`xxx.sql.tencentcdb.com`），不是外网地址！

### ❌ 微信登录失败

检查 `WECHAT_APPID` 和 `WECHAT_APPSECRET` 是否正确。

### ❌ 服务无法访问

1. 检查服务状态（云托管控制台）
2. 确认端口设置为 `80`
3. 查看部署日志

---

## 详细文档

查看完整部署指南：[DEPLOY.md](DEPLOY.md)

---

**祝部署顺利！** 🚀

