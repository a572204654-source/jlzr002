# 腾讯云CloudBase云托管部署指南

## 部署前准备

### 1. 准备工作

#### 必需资源
- ✅ 腾讯云账号（已开通CloudBase）
- ✅ 微信小程序AppID和AppSecret
- ✅ MySQL数据库（推荐使用腾讯云MySQL）
- ✅ （可选）豆包AI的API Key（用于AI助手功能）
- ✅ （可选）和风天气API Key（用于气象功能）

#### 本地准备
```bash
# 1. 确保代码已提交
git add .
git commit -m "准备部署到云托管"

# 2. 测试本地环境
npm install
npm run test-api  # 确保测试通过
```

---

## 部署步骤

### 第一步：创建云托管服务

#### 1.1 进入CloudBase控制台
1. 访问 https://console.cloud.tencent.com/tcb
2. 选择你的环境（或创建新环境）
3. 点击左侧菜单「云托管」

#### 1.2 新建服务
1. 点击「新建服务」
2. 填写服务信息：
   - **服务名称**：`supervision-log-api`（或自定义）
   - **镜像仓库**：选择「使用系统默认仓库」
   - 点击「确定」

#### 1.3 配置服务
- **CPU**：0.5核（建议初始配置）
- **内存**：1GB（建议初始配置）
- **最小副本数**：1
- **最大副本数**：5（根据需求调整）
- **端口**：80
- **协议**：HTTP

---

### 第二步：配置数据库

#### 2.1 使用腾讯云MySQL

**推荐方案：使用云数据库MySQL**

1. 进入「云数据库MySQL」控制台
2. 创建实例（如果没有）：
   - **地域**：与云托管环境相同
   - **规格**：入门版即可
   - **网络**：选择VPC（与云托管同一VPC）

3. 创建数据库：
```sql
CREATE DATABASE supervision_log CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. 获取**内网地址**（重要！）：
   - 进入实例详情
   - 复制「内网地址」（格式：`xxx.sql.tencentcdb.com`）
   - 记录端口号（通常是3306）

#### 2.2 初始化数据库

**方法一：使用本地连接（推荐）**
```bash
# 1. 配置.env文件（使用外网地址）
DB_HOST=你的数据库外网地址
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=supervision_log

# 2. 运行初始化
npm run init-data
```

**方法二：使用SQL文件直接导入**
1. 登录数据库管理界面
2. 导入 `scripts/init-db.sql`
3. 导入 `scripts/init-db-data.js`（需先运行）

---

### 第三步：配置环境变量

#### 3.1 在云托管控制台配置

1. 进入「云托管」→「服务列表」
2. 点击你的服务 → 「版本配置」
3. 找到「环境变量」配置项
4. 添加以下环境变量：

```bash
# ============ 数据库配置（必需）============
DB_HOST=内网地址.sql.tencentcdb.com
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=supervision_log

# ============ 微信小程序配置（必需）============
WECHAT_APPID=你的小程序AppID
WECHAT_APPSECRET=你的小程序AppSecret

# ============ JWT配置（必需）============
# 重要：生产环境必须修改为复杂密钥！
JWT_SECRET=production_strong_secret_key_change_me_in_production_123456

# ============ 豆包AI配置（可选）============
# 如果不使用AI功能，可以不配置
DOUBAO_API_KEY=你的豆包API_KEY
DOUBAO_ENDPOINT_ID=你的豆包Endpoint_ID

# ============ 和风天气配置（可选）============
# 如果不使用气象功能，可以不配置
QWEATHER_API_KEY=你的和风天气API_KEY

# ============ 其他配置 ============
NODE_ENV=production
```

**⚠️ 重要提示：**
- ✅ 数据库地址必须使用**内网地址**（云托管访问云数据库不走公网）
- ✅ `JWT_SECRET` 生产环境必须修改为强密码
- ✅ 所有配置项不要有引号（直接填值）

---

### 第四步：部署代码

#### 4.0 准备Git仓库（推荐方式）

如果你的代码托管在Git仓库（GitHub/GitLab/Gitee/腾讯工蜂），可以直接使用Git仓库部署，这是最方便的方式。

**前置准备**

1. **确保代码已提交到Git仓库**

```bash
# 查看代码状态
git status

# 如有未提交的更改，先提交
git add .
git commit -m "准备部署到云托管"

# 推送到远程仓库
git push origin main  # 或 master
```

2. **确保仓库包含必需文件**
   - ✅ `Dockerfile` - Docker构建文件
   - ✅ `package.json` - 依赖配置
   - ✅ 完整的项目代码
   - ❌ 不要包含 `node_modules` 目录
   - ❌ 不要包含 `.env` 文件（敏感信息）

3. **推荐的Git仓库服务**
   - **GitHub** - 全球最大的代码托管平台
   - **Gitee** - 国内访问速度快，构建更快
   - **GitLab** - 支持自建和云托管
   - **腾讯工蜂** - 腾讯云原生支持，无需授权

**Git部署流程（在云托管控制台）**

1. **进入云托管控制台**
   - 访问：https://console.cloud.tencent.com/tcb
   - 选择环境：`cloud1-5gtce4ym5a28e1b9`
   - 点击「云托管」

2. **新建服务**
   - 点击「新建服务」
   - 服务名称：`supervision-log-api`
   - 点击「提交」

3. **新建版本（Git部署）**
   - 点击「新建版本」
   - 选择「代码仓库」
   
4. **授权代码仓库**
   - 首次使用需要授权
   - 选择你的Git平台（GitHub/Gitee等）
   - 点击「授权」并完成授权流程
   - 授权后可以看到你的仓库列表

5. **配置构建参数**
   ```
   代码仓库：选择 cloudrun-express
   分支：main （或 master）
   构建目录：/
   Dockerfile路径：Dockerfile
   ```

6. **配置服务参数**
   ```
   CPU：0.5核
   内存：1GB
   最小副本数：0（节省成本）
   最大副本数：5
   端口：80
   ```

7. **点击「开始构建」**
   - 构建时间：首次约3-5分钟
   - 可查看构建日志
   - 构建完成后自动部署

**Git部署的优势**

- ✅ 无需本地打包上传
- ✅ 自动从仓库拉取最新代码
- ✅ 支持自动化CI/CD
- ✅ 可追溯每个版本对应的Git提交
- ✅ 更新时只需推送代码，在控制台点击「新建版本」

**后续更新流程**

```bash
# 1. 本地修改代码
# 2. 提交并推送
git add .
git commit -m "更新功能"
git push origin main

# 3. 在云托管控制台点击「新建版本」
# 4. 系统自动拉取最新代码并构建
# 5. 构建完成后自动发布
```

---

#### 4.1 使用CloudBase CLI部署（命令行方式）

**安装CLI工具**
```bash
npm install -g @cloudbase/cli
```

**登录**
```bash
cloudbase login
```

**初始化项目（如果没有cloudbaserc.json）**
```bash
cloudbase init --without-template
```

**编辑 `cloudbaserc.json`**
```json
{
  "envId": "你的环境ID",
  "version": "2.0",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "framework": {
    "name": "supervision-log-api",
    "plugins": {
      "container": {
        "use": "@cloudbase/framework-plugin-container",
        "inputs": {
          "serviceName": "supervision-log-api",
          "servicePath": "/",
          "containerPort": 80,
          "dockerfilePath": "./Dockerfile",
          "buildDir": "."
        }
      }
    }
  }
}
```

**部署**
```bash
cloudbase framework:deploy
```

#### 4.2 使用控制台手动部署

**方式一：Dockerfile部署（推荐）**

1. 项目已包含 `Dockerfile`，内容如下：

```dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 80
CMD ["node", "bin/www"]
```

2. 在云托管控制台部署：

**选项A：通过Git仓库部署（推荐）**

   - 点击「新建版本」
   - 选择「代码仓库」
   - 授权并选择你的Git仓库（GitHub/GitLab/Gitee/腾讯工蜂）
   - 选择分支（如 `main` 或 `master`）
   - 构建目录：`/`（项目根目录）
   - Dockerfile路径：`Dockerfile`
   - 点击「开始构建」
   - 等待构建完成（首次约3-5分钟）

**选项B：通过本地上传部署**

   - 点击「新建版本」
   - 选择「本地代码」
   - 将项目打包为ZIP（不含 `node_modules`）
   - 上传ZIP文件
   - 等待构建完成

**方式二：镜像仓库部署**

1. 本地构建镜像：
```bash
# 构建镜像
docker build -t supervision-log-api:latest .

# 测试镜像
docker run -p 80:80 --env-file .env supervision-log-api:latest

# 推送到腾讯云镜像仓库（需先配置）
docker tag supervision-log-api:latest ccr.ccs.tencentyun.com/你的命名空间/supervision-log-api:latest
docker push ccr.ccs.tencentyun.com/你的命名空间/supervision-log-api:latest
```

2. 在云托管控制台选择镜像部署

---

### 第五步：配置服务访问

#### 5.1 获取服务域名

1. 进入「云托管」→「服务列表」
2. 点击你的服务
3. 复制「默认域名」（格式：`xxx.service.tcloudbase.com`）

#### 5.2 配置小程序服务器域名

1. 登录微信小程序后台
2. 进入「开发」→「开发管理」→「开发设置」
3. 找到「服务器域名」→「request合法域名」
4. 添加你的云托管域名：
   ```
   https://你的服务域名.service.tcloudbase.com
   ```

#### 5.3 更新小程序代码

编辑小程序中的 `miniapp-example/request.js`：

```javascript
// 替换为你的云托管域名
const BASE_URL = 'https://你的服务域名.service.tcloudbase.com'
```

---

## 部署后验证

### 1. 健康检查

```bash
# 访问健康检查接口
curl https://你的服务域名.service.tcloudbase.com/health

# 期望返回
{
  "status": "ok",
  "timestamp": 1699200000000,
  "database": "connected"
}
```

### 2. API接口测试

```bash
# 测试微信登录接口（使用测试code）
curl -X POST https://你的服务域名.service.tcloudbase.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_wechat_code_123456"}'
```

### 3. 使用API测试工具

编辑 `api-tests/index.js` 中的 `BASE_URL`：

```javascript
const BASE_URL = 'https://你的服务域名.service.tcloudbase.com'
```

运行测试：
```bash
cd api-tests
npm install
npm test
```

---

## 常见问题

### 1. 数据库连接失败

**问题**：日志显示 `ETIMEDOUT` 或 `Access denied`

**解决方案**：
- ✅ 确认使用的是**内网地址**（不是外网地址）
- ✅ 检查数据库用户名和密码是否正确
- ✅ 确认云托管和数据库在同一VPC
- ✅ 检查数据库安全组规则

### 2. 微信登录失败

**问题**：返回 `40029` 或 `invalid code`

**解决方案**：
- ✅ 确认 `WECHAT_APPID` 和 `WECHAT_APPSECRET` 正确
- ✅ code只能使用一次，且5分钟内有效
- ✅ 检查小程序是否已发布

### 3. 服务无法访问

**问题**：访问域名返回 `502` 或 `503`

**解决方案**：
- ✅ 检查服务是否正常运行（查看日志）
- ✅ 确认端口配置为 `80`
- ✅ 检查最小副本数 ≥ 1
- ✅ 查看「版本管理」中的部署状态

### 4. AI功能不可用

**问题**：AI对话返回错误

**解决方案**：
- ✅ 确认配置了 `DOUBAO_API_KEY` 和 `DOUBAO_ENDPOINT_ID`
- ✅ 检查豆包账号余额
- ✅ 如不使用AI功能，可忽略此配置

### 5. 气象功能不可用

**问题**：获取天气返回错误

**解决方案**：
- ✅ 确认配置了 `QWEATHER_API_KEY`
- ✅ 如不使用气象功能，系统会返回模拟数据

---

## 性能优化建议

### 1. 数据库优化

```sql
-- 添加索引（提升查询性能）
CREATE INDEX idx_user_openid ON users(openid);
CREATE INDEX idx_project_user ON projects(user_id, status);
CREATE INDEX idx_work_project ON works(project_id, status);
CREATE INDEX idx_log_user ON supervision_logs(user_id, log_date);
CREATE INDEX idx_log_work ON supervision_logs(work_id, log_date);
CREATE INDEX idx_attachment_related ON attachments(related_type, related_id);
```

### 2. 云托管配置

根据实际流量调整：

- **低流量**（<100 QPS）：0.5核 1GB 内存
- **中等流量**（100-500 QPS）：1核 2GB 内存
- **高流量**（>500 QPS）：2核 4GB 内存

### 3. 启用CDN加速

1. 进入「静态网站托管」
2. 上传静态资源（图片、CSS、JS）
3. 使用CDN域名访问

---

## 监控和日志

### 1. 查看日志

1. 进入「云托管」→「服务列表」
2. 点击服务 → 「日志」
3. 查看实时日志和历史日志

### 2. 配置告警

1. 进入「云监控」控制台
2. 创建告警策略：
   - CPU使用率 > 80%
   - 内存使用率 > 80%
   - 请求错误率 > 5%
3. 设置通知方式（短信/邮件/微信）

---

## 成本估算

### 基础配置（0.5核 1GB 内存）

- **云托管**：约 ¥30-50/月（按实际使用计费）
- **MySQL**：约 ¥50-100/月（入门版）
- **流量费**：约 ¥10/月（前50GB免费）

**总计**：约 ¥90-160/月

### 节省成本技巧

1. 使用**按量计费**（流量小时推荐）
2. 合理设置**最小副本数**（夜间可设为0）
3. 开启**自动扩缩容**
4. 使用**资源包**（流量大时更划算）

---

## 安全建议

### 1. 生产环境必做

- ✅ 修改 `JWT_SECRET` 为复杂密钥
- ✅ 数据库密码使用强密码
- ✅ 定期备份数据库
- ✅ 配置HTTPS（云托管默认支持）
- ✅ 配置CORS白名单（当前允许所有域名）

### 2. CORS配置优化

编辑 `app.js`，将：

```javascript
app.use(cors())
```

改为：

```javascript
app.use(cors({
  origin: [
    'https://servicewechat.com',  // 微信小程序
    'https://你的管理后台域名.com'
  ],
  credentials: true
}))
```

### 3. 接口限流

安装依赖：
```bash
npm install express-rate-limit
```

添加限流配置（`app.js`）：
```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100个请求
})

app.use('/api/', limiter)
```

---

## 更新部署

### 方式一：使用CLI

```bash
# 1. 更新代码
git pull

# 2. 重新部署
cloudbase framework:deploy
```

### 方式二：使用控制台

1. 打包代码：
```bash
npm install --production
zip -r deploy.zip .
```

2. 在云托管控制台「新建版本」上传 `deploy.zip`

### 灰度发布（推荐）

1. 新建版本时选择「灰度发布」
2. 设置流量比例（如：10%新版本，90%旧版本）
3. 观察新版本运行情况
4. 逐步调整流量比例至100%

---

## 回滚版本

如果新版本有问题：

1. 进入「版本管理」
2. 选择旧版本 → 「切换为此版本」
3. 确认回滚

---

## 技术支持

- **CloudBase文档**：https://cloud.tencent.com/document/product/876
- **云托管文档**：https://cloud.tencent.com/document/product/1243
- **工单支持**：腾讯云控制台提交工单

---

## 部署检查清单

部署前：
- [ ] 代码测试通过（`npm run test-api`）
- [ ] 数据库已创建并初始化
- [ ] `.env` 配置正确
- [ ] `Dockerfile` 存在

部署中：
- [ ] 云托管服务已创建
- [ ] 环境变量已配置（使用内网地址）
- [ ] 端口设置为 80
- [ ] 最小副本数 ≥ 1

部署后：
- [ ] 健康检查通过
- [ ] API接口可访问
- [ ] 小程序可以登录
- [ ] 数据库连接正常
- [ ] 配置了监控告警

---

**祝部署顺利！如有问题，请查看云托管日志或提交工单。** 🚀

