# Git仓库部署指南

通过Git仓库部署到云托管是最推荐的方式，简单、高效、便于管理。

---

## 🎯 适用场景

- ✅ 代码已托管在Git仓库（GitHub/Gitee/GitLab/腾讯工蜂）
- ✅ 需要版本管理和追溯
- ✅ 团队协作开发
- ✅ 需要自动化部署

---

## 📋 前置准备

### 1. 确保代码已推送到Git仓库

```bash
# 初始化Git仓库（如果还没有）
git init

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/cloudrun-express.git
# 或 Gitee
git remote add origin https://gitee.com/你的用户名/cloudrun-express.git

# 查看状态
git status

# 添加所有文件
git add .

# 提交
git commit -m "准备部署到云托管"

# 推送到远程仓库
git push -u origin main  # 或 master
```

### 2. 确认仓库文件

**必须包含：**
- ✅ `Dockerfile` - Docker构建配置
- ✅ `package.json` - 项目依赖
- ✅ `bin/www` - 启动脚本
- ✅ `app.js` - 应用入口
- ✅ 所有源代码文件

**不要包含：**
- ❌ `node_modules/` - 依赖包（在 `.gitignore` 中）
- ❌ `.env` - 环境变量文件（敏感信息）
- ❌ `*.log` - 日志文件

### 3. 检查 `.gitignore`

确保 `.gitignore` 包含以下内容：

```gitignore
# 依赖
node_modules/
package-lock.json

# 环境变量（重要！）
.env
.env.local
.env.production

# 日志
logs/
*.log

# 临时文件
.DS_Store
Thumbs.db
```

---

## 🚀 部署步骤

### 步骤1：进入云托管控制台

1. 访问：https://console.cloud.tencent.com/tcb
2. 登录你的腾讯云账号
3. 选择环境：`cloud1-5gtce4ym5a28e1b9`
4. 点击左侧菜单「云托管」

### 步骤2：创建服务（首次）

如果还没有创建服务：

1. 点击「新建服务」
2. 填写配置：
   ```
   服务名称：supervision-log-api
   备注：监理日志后端服务
   ```
3. 点击「提交」

### 步骤3：新建版本

1. 在服务列表中，点击「supervision-log-api」
2. 点击「新建版本」按钮
3. 在部署方式中，选择「**代码仓库**」

### 步骤4：授权Git仓库（首次）

**如果是首次使用，需要授权：**

#### GitHub 授权
1. 选择「GitHub」
2. 点击「授权」按钮
3. 跳转到GitHub页面
4. 点击「Authorize」授权腾讯云访问
5. 授权成功后返回控制台

#### Gitee 授权
1. 选择「Gitee」
2. 点击「授权」按钮
3. 跳转到Gitee页面
4. 点击「同意授权」
5. 授权成功后返回控制台

#### GitLab 授权
1. 选择「GitLab」
2. 输入GitLab访问令牌
3. 完成授权

#### 腾讯工蜂
- 无需授权，直接可用

### 步骤5：配置构建参数

授权成功后，填写以下配置：

```
┌─────────────────────────────────────────┐
│ 代码仓库                                  │
├─────────────────────────────────────────┤
│ 仓库：cloudrun-express                   │
│ 分支：main （或 master）                  │
│ 构建目录：/                               │
│ Dockerfile路径：Dockerfile               │
└─────────────────────────────────────────┘
```

**参数说明：**
- **仓库**：从下拉列表选择你的仓库
- **分支**：选择要部署的分支（通常是 `main` 或 `master`）
- **构建目录**：填 `/`（表示项目根目录）
- **Dockerfile路径**：填 `Dockerfile`（相对于构建目录）

### 步骤6：配置服务参数

```
┌─────────────────────────────────────────┐
│ 资源配置                                  │
├─────────────────────────────────────────┤
│ CPU：0.5核                               │
│ 内存：1GB                                │
│ 最小副本数：0（节省成本）                 │
│ 最大副本数：5                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 服务配置                                  │
├─────────────────────────────────────────┤
│ 端口：80                                 │
│ 流量策略：100%                            │
└─────────────────────────────────────────┘
```

**资源配置建议：**
- **小流量**：0.5核 + 1GB内存
- **中流量**：1核 + 2GB内存
- **高流量**：2核 + 4GB内存

### 步骤7：开始构建

1. 确认所有配置无误
2. 点击「**开始构建**」按钮
3. 进入构建日志页面

### 步骤8：查看构建日志

构建过程约3-5分钟，你可以实时查看日志：

```
✓ 拉取代码仓库
✓ 读取 Dockerfile
✓ 安装依赖 (npm ci --production)
✓ 构建Docker镜像
✓ 推送镜像到云托管
✓ 部署服务
✓ 健康检查
```

**常见日志：**
```bash
Step 1/7 : FROM node:14-alpine
Step 2/7 : WORKDIR /app
Step 3/7 : COPY package*.json ./
Step 4/7 : RUN npm ci --production
Step 5/7 : COPY . .
Step 6/7 : EXPOSE 80
Step 7/7 : CMD ["node", "bin/www"]
Successfully built xxx
Successfully tagged xxx
```

### 步骤9：配置环境变量（重要！）

构建完成后，必须配置环境变量：

1. 在服务详情页，点击「环境变量」标签
2. 点击「新增环境变量」
3. 添加以下配置：

```bash
# ========== 必需配置 ==========
DB_HOST=内网地址.sql.tencentcdb.com  # ⚠️ 必须是内网地址
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=supervision_log

WECHAT_APPID=wxXXXXXXXXXXXXXXXX
WECHAT_APPSECRET=你的微信AppSecret

JWT_SECRET=prod_Xk9mP2vB8nQ7wE6rT5yU4iO3pA1sD0fG  # ⚠️ 至少32位强密码

NODE_ENV=production

# ========== 可选配置 ==========
# 豆包AI（如不使用可不配）
DOUBAO_API_KEY=你的豆包API_KEY
DOUBAO_ENDPOINT_ID=你的豆包Endpoint_ID

# 和风天气（如不使用可不配）
QWEATHER_API_KEY=你的和风天气KEY
```

4. 点击「保存」
5. 重启服务使环境变量生效

### 步骤10：验证部署

1. **获取服务域名**
   - 在服务详情页查看「默认域名」
   - 格式：`https://xxx.service.tcloudbase.com`

2. **测试健康检查**
   ```bash
   curl https://你的域名.service.tcloudbase.com/health
   ```
   
   期望返回：
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": 1699200000000
   }
   ```

3. **测试API接口**
   ```bash
   curl https://你的域名.service.tcloudbase.com/api/v1
   ```

---

## 🔄 更新部署

代码更新后，按以下流程重新部署：

### 方式1：推送代码后手动部署

```bash
# 1. 本地修改代码
# ... 修改文件 ...

# 2. 提交并推送
git add .
git commit -m "更新：添加新功能"
git push origin main

# 3. 在云托管控制台
# 3.1 进入服务详情
# 3.2 点击「新建版本」
# 3.3 选择「代码仓库」
# 3.4 确认分支和配置
# 3.5 点击「开始构建」

# 4. 等待构建完成（约2-3分钟）
```

### 方式2：使用自动部署（推荐）

在云托管控制台可以配置「自动部署」：

1. 进入服务详情页
2. 点击「触发方式」
3. 启用「代码推送自动部署」
4. 选择要监听的分支（如 `main`）

**配置后：**
- 每次推送代码到指定分支
- 云托管会自动拉取并构建
- 无需手动点击「新建版本」

```bash
# 只需提交推送，自动触发部署
git add .
git commit -m "更新功能"
git push origin main
# 自动开始构建，无需手动操作！
```

---

## 🎯 Git工作流建议

### 基础工作流

```
main（生产环境）
  ↑
  | 合并发布
  |
develop（开发环境）
  ↑
  | 合并功能
  |
feature/xxx（功能分支）
```

### 推荐分支策略

1. **main** - 生产环境，只部署稳定版本
2. **develop** - 开发环境，用于测试
3. **feature/xxx** - 功能分支，开发新功能

### 部署流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature develop

# 2. 开发和提交
git add .
git commit -m "新功能：XXX"

# 3. 合并到develop测试
git checkout develop
git merge feature/new-feature
git push origin develop

# 4. 在云托管创建测试服务，部署develop分支

# 5. 测试通过后，合并到main
git checkout main
git merge develop
git push origin main

# 6. 云托管自动部署生产环境
```

---

## ⚙️ 高级配置

### 使用 .dockerignore

创建 `.dockerignore` 文件，减少构建上下文大小：

```dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
README.md
.DS_Store
```

### 多阶段构建优化

优化 `Dockerfile`，减少镜像大小：

```dockerfile
# 构建阶段
FROM node:14-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# 运行阶段
FROM node:14-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 80
CMD ["node", "bin/www"]
```

### 配置构建缓存

在 Dockerfile 中合理安排命令顺序：

```dockerfile
# 先复制依赖文件（变化少，可利用缓存）
COPY package*.json ./
RUN npm ci --production

# 再复制源代码（变化多）
COPY . .
```

---

## 🐛 常见问题

### 1. 授权失败

**问题：** 无法授权GitHub/Gitee

**解决：**
- 确保网络连接正常
- 清除浏览器缓存重试
- 使用无痕模式重新授权
- 检查Git平台账号状态

### 2. 找不到仓库

**问题：** 授权后看不到仓库列表

**解决：**
- 确认仓库是否存在
- 检查仓库权限（需要至少有读取权限）
- GitHub：检查组织权限
- 刷新页面重试

### 3. 构建失败

**问题：** 构建过程报错

**常见原因：**
- Dockerfile 路径错误
- package.json 缺失或格式错误
- 依赖安装失败

**解决：**
```bash
# 本地测试构建
docker build -t test .

# 查看详细日志
docker build -t test . --progress=plain
```

### 4. 构建超时

**问题：** 构建时间过长导致超时

**解决：**
- 使用国内镜像源（Gitee 比 GitHub 快）
- 优化 Dockerfile，使用缓存
- 移除不必要的依赖

### 5. 服务启动失败

**问题：** 构建成功但服务无法启动

**检查：**
- 环境变量是否配置
- 数据库地址是否正确（内网地址）
- 端口是否正确（80）
- 查看服务日志

---

## 📊 对比：Git部署 vs CLI部署

| 特性 | Git部署 | CLI部署 |
|------|---------|---------|
| 操作难度 | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| 版本管理 | ✅ 完善 | ⚠️ 手动 |
| 自动化 | ✅ 支持 | ⚠️ 需配置 |
| 团队协作 | ✅ 便捷 | ⚠️ 需同步 |
| 网络依赖 | ✅ 低 | ⚠️ 高 |
| 回滚 | ✅ 简单 | ⚠️ 复杂 |

**推荐：** 优先使用Git部署！

---

## 📚 相关文档

- [完整部署指南](DEPLOY.md)
- [快速部署](QUICKSTART_DEPLOY.md)
- [部署清单](DEPLOY_CHECKLIST.md)
- [README](README.md)

---

## ✅ 部署完成后

- [ ] 配置小程序服务器域名
- [ ] 测试所有API接口
- [ ] 配置监控告警
- [ ] 启用自动部署
- [ ] 备份数据库

---

**祝部署顺利！** 🚀

如有问题，请查看[完整部署指南](DEPLOY.md)的常见问题章节。

