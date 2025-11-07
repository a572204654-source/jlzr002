# 监理日志小程序后端服务

基于 Express + MySQL 的微信小程序后端服务框架，适配腾讯云 CloudBase 云托管部署。

## 技术栈

- **框架**: Express 4.x
- **数据库**: MySQL 5.7+ (mysql2)
- **认证**: JWT (jsonwebtoken)
- **小程序**: 微信小程序登录对接
- **AI服务**: 豆包AI (ARK API)
- **部署**: 腾讯云 CloudBase 云托管 + Docker

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=express_miniapp

# 微信小程序配置
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret

# JWT配置
JWT_SECRET=your-secret-key-change-in-production

# 豆包AI配置（可选）
DOUBAO_API_KEY=your_doubao_api_key
DOUBAO_ENDPOINT_ID=your_endpoint_id

# 和风天气配置（可选）
QWEATHER_API_KEY=your_qweather_api_key
```

### 3. 初始化数据库

```bash
npm run init-data
```

### 4. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 5. 验证服务

访问以下URL：
- 健康检查: http://localhost/health
- API信息: http://localhost/api/v1

### 6. 运行测试

```bash
npm run test-api
```

---

## 云托管部署

### 快速部署（5分钟）

```bash
# 1. 安装CLI工具
npm install -g @cloudbase/cli

# 2. 登录云托管
cloudbase login

# 3. 一键部署
cloudbase framework:deploy
```

### 详细部署指南

- 📖 **[快速部署指南](QUICKSTART_DEPLOY.md)** - 5分钟快速上手
- 📚 **[完整部署文档](DEPLOY.md)** - 详细步骤和问题排查
- ✅ **[部署清单](DEPLOY_CHECKLIST.md)** - 逐步检查清单

**⚠️ 重要提醒：**
- 云托管环境必须使用数据库**内网地址**
- 生产环境必须修改 `JWT_SECRET` 为强密码
- 需在云托管控制台配置环境变量

---

## 核心功能

### 认证模块
- 微信小程序登录
- JWT令牌管理
- 用户会话维护

### 用户模块
- 用户信息管理
- 用户列表查询
- 用户统计数据

### 项目模块
- 项目增删改查
- 项目列表和搜索
- 项目详情查看

### 工程模块
- 工程增删改查
- 按项目筛选工程
- 工程详情查看

### 监理日志模块
- 日志增删改查
- 多条件筛选
- Word格式导出

### AI助手模块
- 对话会话管理
- 消息发送和接收
- 豆包AI集成
- 对话历史记录

### 附件模块
- 附件上传和删除
- 附件列表查询
- 支持多种文件类型

### 气象模块
- 根据位置获取气象信息
- 和风天气API集成
- 智能缓存机制

## API接口

### 认证接口
- `POST /api/v1/auth/wechat-login` - 微信登录

### 用户接口
- `GET /api/v1/users/me` - 获取当前用户信息
- `PUT /api/v1/users/me` - 更新当前用户信息
- `GET /api/v1/users` - 获取用户列表
- `GET /api/v1/users/:id` - 获取用户详情
- `GET /api/v1/users/stats` - 获取用户统计

### 项目接口
- `POST /api/v1/projects` - 创建项目
- `GET /api/v1/projects` - 获取项目列表
- `GET /api/v1/projects/:id` - 获取项目详情
- `PUT /api/v1/projects/:id` - 更新项目
- `DELETE /api/v1/projects/:id` - 删除项目

### 工程接口
- `POST /api/v1/works` - 创建工程
- `GET /api/v1/works` - 获取工程列表
- `GET /api/v1/works/:id` - 获取工程详情
- `PUT /api/v1/works/:id` - 更新工程
- `DELETE /api/v1/works/:id` - 删除工程

### 监理日志接口
- `POST /api/v1/supervision-logs` - 创建日志
- `GET /api/v1/supervision-logs` - 获取日志列表
- `GET /api/v1/supervision-logs/:id` - 获取日志详情
- `PUT /api/v1/supervision-logs/:id` - 更新日志
- `DELETE /api/v1/supervision-logs/:id` - 删除日志
- `GET /api/v1/supervision-logs/:id/export` - 导出Word

### AI助手接口
- `POST /api/v1/ai-chat/conversations` - 创建会话
- `GET /api/v1/ai-chat/conversations` - 获取会话列表
- `POST /api/v1/ai-chat/conversations/:id/messages` - 发送消息
- `GET /api/v1/ai-chat/conversations/:id/messages` - 获取消息列表
- `DELETE /api/v1/ai-chat/conversations/:id` - 删除会话

### 附件接口
- `POST /api/v1/attachments` - 上传附件
- `GET /api/v1/attachments` - 获取附件列表
- `GET /api/v1/attachments/:id` - 获取附件详情
- `DELETE /api/v1/attachments/:id` - 删除附件
- `GET /api/v1/attachments/by-resource` - 按资源查询

### 气象接口
- `GET /api/v1/weather/current` - 获取当前气象

## 接口测试

### 运行测试

```bash
# 确保服务已启动
npm run dev

# 运行测试（另开终端）
npm run test-api
```

测试脚本会自动测试所有接口，并输出详细结果。

## 项目结构

```
cloudrun-express/
├── bin/                      # 启动脚本
├── config/                   # 配置文件
│   ├── index.js             # 配置总入口
│   └── database.js          # 数据库配置
├── middleware/              # 中间件
│   ├── auth.js             # JWT认证中间件
│   └── errorHandler.js     # 错误处理中间件
├── routes/                  # 路由
│   ├── v1/                 # V1版本API
│   │   ├── index.js        # 路由入口
│   │   ├── user.js         # 用户模块
│   │   ├── project.js      # 项目模块
│   │   ├── work.js         # 工程模块
│   │   ├── supervision-log.js  # 监理日志模块
│   │   ├── ai-chat.js      # AI助手模块
│   │   ├── attachment.js   # 附件模块
│   │   └── weather.js      # 气象模块
│   └── ...                 # 旧版路由（待清理）
├── utils/                   # 工具函数
│   ├── response.js         # 统一响应格式
│   ├── jwt.js              # JWT工具
│   ├── wechat.js           # 微信API
│   ├── doubao.js           # 豆包AI
│   ├── wordGenerator.js    # Word生成
│   └── crypto.js           # 加密工具
├── scripts/                 # 脚本
│   ├── init-db-new.sql     # 数据库表结构
│   └── init-db-data.js     # 测试数据初始化
├── api-tests/              # API测试
│   ├── index.js           # 测试入口
│   ├── tests/             # 测试用例
│   └── utils/             # 测试工具
├── miniapp-example/        # 小程序示例代码
├── app.js                  # 应用入口
├── .env                    # 环境变量
├── package.json            # 项目配置
└── README.md              # 本文档
```

## 开发规范

项目遵循严格的开发规范，详见 `.cursorrules`

### 核心规范

1. **模块系统**: CommonJS (require/module.exports)
2. **异步处理**: async/await
3. **注释语言**: 中文
4. **代码风格**: 2空格缩进，无分号
5. **响应格式**: 统一使用 `utils/response.js`
6. **参数化查询**: 防止SQL注入
7. **错误处理**: try-catch + 统一错误处理

## NPM脚本

```bash
# 启动生产服务器
npm start

# 启动开发服务器（热重载）
npm run dev

# 初始化数据库表结构
npm run init-db

# 初始化测试数据
npm run init-data

# 运行API测试
npm run test-api

# 环境配置
npm run setup
```

## 数据库

### 数据表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| projects | 项目表 |
| works | 单项工程表 |
| supervision_logs | 监理日志表 |
| ai_chat_conversations | AI对话会话表 |
| ai_chat_messages | AI对话消息表 |
| attachments | 附件表 |

### 初始化

```bash
# 使用Node脚本（推荐）
npm run init-data

# 直接导入SQL
mysql -u用户名 -p < scripts/init-db-new.sql
```

## 环境变量

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| DB_HOST | 数据库地址 | localhost |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户 | root |
| DB_PASSWORD | 数据库密码 | password |
| DB_NAME | 数据库名称 | express_miniapp |
| WECHAT_APPID | 微信AppID | wx... |
| WECHAT_APPSECRET | 微信AppSecret | ... |
| JWT_SECRET | JWT密钥 | your-secret-key |

### 可选配置

| 变量名 | 说明 | 是否必需 |
|--------|------|----------|
| DOUBAO_API_KEY | 豆包AI API密钥 | AI功能需要 |
| DOUBAO_ENDPOINT_ID | 豆包AI Endpoint ID | AI功能需要 |
| QWEATHER_API_KEY | 和风天气API密钥 | 气象功能需要 |

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t supervision-log-api .

# 运行容器
docker run -d -p 80:80 \
  -e DB_HOST=xxx \
  -e DB_PASSWORD=xxx \
  supervision-log-api
```

### 云托管部署

1. 配置环境变量
2. 推送代码到代码仓库
3. 云托管平台自动构建和部署

## 测试账号

开发环境测试账号：

| 用户 | OpenID | 昵称 | 机构 |
|------|--------|------|------|
| 用户1 | test_openid_001 | 张三 | 华建监理有限公司 |
| 用户2 | test_openid_002 | 李四 | 中建监理集团 |
| 用户3 | test_openid_003 | 王五 | 华建监理有限公司 |

测试数据：
- 3个项目
- 5个工程
- 10条监理日志
- AI对话记录

## 版本信息

- **版本**: v1.0.0
- **更新时间**: 2024-11-06
- **Node.js**: 14+
- **数据库**: MySQL 5.7+

## License

MIT
