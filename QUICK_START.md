# 快速启动指南

## 前置要求

- Node.js 14+ 
- MySQL 5.7+
- 已配置好的微信小程序（需要AppID和AppSecret）

## 快速开始（3步启动）

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 创建数据库表结构
node scripts/init-db.js

# 导入测试数据（可选）
node scripts/init-db-data.js
```

### 3. 启动服务

```bash
npm start
```

服务将在 http://localhost:80 启动

## 验证服务

### 检查健康状态

```bash
curl http://localhost:80/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": 1699200000000,
  "service": "express-miniapp"
}
```

### 查看API信息

访问：http://localhost:80/api

## 环境配置说明

`.env` 文件配置项：

### 数据库配置
```bash
# 本地开发使用外网地址（当前配置）
DB_HOST=sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com
DB_PORT=22087
DB_USER=a572204654
DB_PASSWORD=572204654aA
DB_NAME=jlzr1101-5g9kplxza13a780d

# 云托管使用内网地址（部署时切换）
# DB_HOST=10.27.100.151
# DB_PORT=3306
```

### 微信小程序配置
```bash
WECHAT_APPID=wxbd778f929f40d8c2
WECHAT_APPSECRET=d2408b2a5907c6ade1bd17b2f75f0e65
```

### 其他配置
```bash
JWT_SECRET=supervision-log-jwt-secret-XyZ9@2024!Abc
DOUBAO_API_KEY=af1085bd-3749-4303-bbd3-efcb287194fa
QWEATHER_API_KEY=d7eb9f449c434e7f8a8cc32aab171128
PORT=80
```

## 测试接口

### 1. 测试登录（开发模式）

```bash
curl -X POST http://localhost:80/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_wechat_code_123"}'
```

### 2. 获取用户信息

```bash
# 使用上一步返回的token
curl http://localhost:80/api/user/info \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. 获取项目列表

```bash
curl http://localhost:80/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 测试账号

数据库中已初始化3个测试用户：

| ID | OpenID | 昵称 | 机构 |
|----|--------|------|------|
| 1 | test_openid_001 | 张三 | 华建监理有限公司 |
| 2 | test_openid_002 | 李四 | 中建监理集团 |
| 3 | test_openid_003 | 王五 | 华建监理有限公司 |

## API文档位置

所有API文档位于 `docx/c-api/` 目录：

- 认证API文档.md
- 用户API文档.md
- 项目管理API文档.md
- 工程管理API文档.md
- 监理日志API文档.md
- 附件管理API文档.md
- AI对话API文档.md
- 天气查询API文档.md

## 常见问题

### Q: 数据库连接失败？
A: 
1. 检查数据库地址和端口是否正确
2. 本地开发使用外网地址，云托管使用内网地址
3. 确认数据库用户名密码正确

### Q: 微信登录失败？
A:
1. 开发模式下使用 `test_wechat_code_` 开头的code进行测试
2. 生产环境确保AppID和AppSecret配置正确
3. 确认code在5分钟内使用

### Q: AI对话无响应？
A:
1. 检查豆包AI配置是否正确
2. 确认API Key有效
3. 查看控制台错误日志

### Q: 天气查询返回模拟数据？
A:
1. 配置和风天气API Key（QWEATHER_API_KEY）
2. 未配置时自动使用模拟数据
3. 模拟数据也可正常使用，基于纬度生成合理温度

## 开发建议

1. **本地开发**：使用外网数据库地址
2. **代码规范**：参考 `.cursorules` 文件
3. **提交代码**：遵循Git提交规范
4. **接口测试**：使用Postman或Apifox
5. **错误日志**：关注控制台输出

## 端口说明

- **默认端口**: 80
- **修改端口**: 在`.env`文件中修改`PORT`变量
- **端口冲突**: 如80端口被占用，可改为3000或8080

## 下一步

1. 查看 `PROJECT_SUMMARY.md` 了解完整项目信息
2. 阅读 `docx/c-api/` 目录下的API文档
3. 开始前端小程序开发
4. 使用测试数据进行功能验证

## 技术支持

- 数据库设计：`docx/数据表设计.md`
- 项目规范：`.cursorules`
- 部署指南：`DEPLOY.md`

---

**祝开发顺利！** 🚀

