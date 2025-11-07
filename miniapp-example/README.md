# 小程序端完整示例代码

这个目录包含了小程序前端的完整示例代码和文档，帮助你快速集成后端API。

## 📁 文件说明

### 🚀 快速开始（推荐）

| 文件 | 说明 | 使用场景 |
|------|------|---------|
| **一键复制-Word导出.js** | ⭐ 最简单的Word导出实现 | 只需复制粘贴即可使用 |
| **错误修复指南.md** | 🔧 解决"下载失败"等常见错误 | 遇到问题时查看 |

### 📚 完整示例

| 文件 | 说明 | 使用场景 |
|------|------|---------|
| **api.js** | API接口封装 | 查看所有可用的API接口 |
| **request.js** | 网络请求封装 | 统一的请求处理和错误拦截 |
| **完整的Word导出代码.js** | 多种导出方式实现 | 需要高级功能（保存、分享等） |
| **Vue页面Word导出示例.vue** | Vue/uni-app页面示例 | 如果使用uni-app框架 |

### 📖 文档

| 文件 | 说明 |
|------|------|
| **README-WORD-EXPORT.md** | Word导出详细使用文档 |
| **前端代码兼容性说明.md** | 后端升级对前端的影响说明 |

---

## ⚡ 快速集成 Word 导出功能

### 第一步：复制文件

将 `一键复制-Word导出.js` 复制到你的小程序项目的 `utils` 目录：

```
你的小程序项目/
├── utils/
│   └── word-export.js  ← 复制到这里
└── pages/
    └── ...
```

### 第二步：修改配置

打开 `word-export.js`，修改第16行的后端地址：

```javascript
// 修改这里为你的实际后端地址
const BASE_URL = 'https://your-domain.com'
```

### 第三步：在页面中使用

在需要导出Word的页面引入并调用：

```javascript
// 1. 引入模块
const { exportWord } = require('../../utils/word-export')

// 2. 在页面中定义方法
Page({
  data: {
    logId: 123  // 日志ID
  },
  
  // 导出按钮点击事件
  onExportWord() {
    exportWord(this.data.logId)
  }
})
```

在WXML中添加按钮：

```xml
<button bindtap="onExportWord">导出Word</button>
```

### 第四步：配置域名

在微信公众平台配置 downloadFile 合法域名：

1. 登录 https://mp.weixin.qq.com
2. 开发管理 → 开发设置 → 服务器域名
3. 在 "downloadFile合法域名" 中添加你的后端域名
4. 保存

### 完成！🎉

现在可以测试Word导出功能了。

---

## 🐛 遇到问题？

### 1. 报错："下载失败"

**原因**：域名未配置或配置错误

**解决**：查看 `错误修复指南.md` 第一节

### 2. 报错："statusCode: 401"

**原因**：Token过期或无效

**解决**：
- 重新登录获取新token
- 检查token是否正确存储在storage中

### 3. 报错："statusCode: 404"

**原因**：接口路径错误或日志不存在

**解决**：
- 检查 `word-export.js` 中的 `API_PATH` 是否正确
- 确认日志ID是否存在

### 4. 开发工具正常，真机失败

**原因**：域名未配置

**解决**：
- 在微信公众平台配置 downloadFile 合法域名
- 确认域名以 https:// 开头

---

## 📖 完整的API列表

### 认证相关
- `POST /api/auth/login` - 小程序登录
- `GET /api/auth/profile` - 获取用户信息

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

### 工程管理
- `GET /api/works` - 获取工程列表
- `POST /api/works` - 创建工程
- `GET /api/works/:id` - 获取工程详情
- `PUT /api/works/:id` - 更新工程
- `DELETE /api/works/:id` - 删除工程

### 监理日志
- `GET /api/supervision-logs` - 获取日志列表
- `POST /api/supervision-logs` - 创建日志
- `GET /api/supervision-logs/:id` - 获取日志详情
- `PUT /api/supervision-logs/:id` - 更新日志
- `DELETE /api/supervision-logs/:id` - 删除日志
- **`GET /api/supervision-logs/:id/export`** - **导出Word** ⭐

### AI助手
- `POST /api/ai-chat/sessions` - 创建会话
- `GET /api/ai-chat/sessions` - 获取会话列表
- `POST /api/ai-chat/messages` - 发送消息

---

## 📝 API调用示例

### 使用封装好的API

```javascript
const api = require('../../utils/api')

// 登录
const result = await api.auth.login({ code: 'xxx' })

// 获取项目列表
const projects = await api.project.getList()

// 创建监理日志
const log = await api.supervisionLog.create({
  projectId: 1,
  workId: 1,
  logDate: '2024-11-07',
  weather: '晴',
  workContent: '混凝土浇筑'
})

// 导出Word
api.supervisionLog.exportWord(123)
```

### 直接使用request

```javascript
const { get, post } = require('../../utils/request')

// GET请求
const data = await get('/api/projects')

// POST请求
const result = await post('/api/projects', {
  projectName: '测试项目'
})
```

---

## 🎯 核心功能说明

### Word导出功能

**接口**: `GET /api/supervision-logs/:id/export`

**功能**: 将监理日志导出为标准格式的Word文档

**特点**:
- ✅ 完全还原监理日志标准格式
- ✅ 支持竖排文字
- ✅ 精确的单元格合并
- ✅ 包含完整的日志内容和附件信息
- ✅ 自动生成文件名（含日期）

**前端实现方式**:

1. **方式一：wx.downloadFile（推荐）**
   - 优点：简单、直接、用户体验好
   - 缺点：需要配置域名
   - 文件：`一键复制-Word导出.js`

2. **方式二：wx.request**
   - 优点：无需配置域名
   - 缺点：代码复杂，需要手动保存文件
   - 文件：`完整的Word导出代码.js`

**推荐使用方式一**（wx.downloadFile），配置一次域名后永久有效。

---

## 🔧 项目配置

### 小程序配置

在 `app.json` 中确保有以下配置：

```json
{
  "permission": {
    "scope.writePhotosAlbum": {
      "desc": "用于保存Word文档"
    }
  },
  "requiredPrivateInfos": [
    "chooseFile",
    "getFileSystemManager"
  ]
}
```

### 域名配置

在微信公众平台配置以下域名（假设后端地址是 https://api.example.com）：

| 域名类型 | 配置值 |
|---------|--------|
| request合法域名 | https://api.example.com |
| downloadFile合法域名 | https://api.example.com |
| uploadFile合法域名 | https://api.example.com |

---

## 💡 最佳实践

### 1. 统一的错误处理

```javascript
// 在 request.js 中统一处理
function handleError(err) {
  if (err.statusCode === 401) {
    // Token过期，跳转登录
    wx.redirectTo({ url: '/pages/login/login' })
  } else if (err.statusCode === 403) {
    wx.showToast({ title: '无权限访问', icon: 'none' })
  } else {
    wx.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}
```

### 2. Loading状态管理

```javascript
// 统一的loading管理
let loadingCount = 0

function showLoading(title = '加载中...') {
  if (loadingCount === 0) {
    wx.showLoading({ title, mask: true })
  }
  loadingCount++
}

function hideLoading() {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    wx.hideLoading()
  }
}
```

### 3. Token自动续期

```javascript
// 在请求拦截器中检查token
function checkToken() {
  const token = wx.getStorageSync('token')
  const expireTime = wx.getStorageSync('token_expire')
  
  if (!token || Date.now() > expireTime) {
    // Token过期，刷新token
    return refreshToken()
  }
  
  return Promise.resolve(token)
}
```

---

## 📊 文件结构建议

```
你的小程序项目/
├── app.js
├── app.json
├── app.wxss
├── utils/
│   ├── request.js           # 网络请求封装
│   ├── api.js               # API接口定义
│   ├── word-export.js       # Word导出功能
│   └── common.js            # 通用工具函数
├── pages/
│   ├── login/               # 登录页
│   ├── home/                # 首页
│   ├── project/             # 项目管理
│   ├── work/                # 工程管理
│   └── supervision-log/     # 监理日志
│       ├── list.js          # 日志列表
│       ├── detail.js        # 日志详情
│       └── create.js        # 创建日志
└── components/              # 自定义组件
    └── ...
```

---

## 🔄 版本历史

### v2.0.0 (2024-11-07)
- ✅ 后端Word导出功能全面升级
- ✅ 完全还原标准监理日志格式
- ✅ 支持竖排文字和精确合并
- ✅ 前端API完全向后兼容
- ✅ 新增完整的示例代码和文档

### v1.0.0
- ✅ 基础功能实现
- ✅ 用户认证
- ✅ 项目和工程管理
- ✅ 监理日志CRUD
- ✅ 基础Word导出

---

## 📞 技术支持

### 相关文档
- 后端API文档：`../API.md`
- Word导出说明：`../docx/Word导出格式说明.md`
- 后端测试脚本：`../scripts/test-word-export.js`

### 常见问题
查看 `错误修复指南.md` 获取详细的问题排查步骤。

### 联系方式
如有问题，请查看项目文档或联系技术支持。

---

**最后更新**: 2024-11-07  
**适用版本**: 微信小程序基础库 2.0.0+  
**后端兼容**: v2.0.0+

