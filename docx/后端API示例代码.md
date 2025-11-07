# 后端API示例代码

本文档提供了后端API接口的实现示例，帮助后端开发人员快速理解和实现接口。

## 技术栈建议

- **Node.js + Express**
- **Python + Django/Flask**
- **Java + Spring Boot**
- **PHP + Laravel**

---

## Node.js + Express 示例

### 1. 基础配置

```javascript
// app.js
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const app = express()

// 中间件
app.use(cors())
app.use(express.json())

// JWT密钥
const JWT_SECRET = 'your-secret-key'

// 统一响应格式
const response = {
  success: (data, message = '操作成功') => ({
    code: 200,
    message,
    data
  }),
  error: (message = '操作失败', code = 400) => ({
    code,
    message,
    data: null
  })
}

// Token验证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json(response.error('未授权', 401))
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json(response.error('Token无效', 401))
  }
}

module.exports = { app, response, authMiddleware, JWT_SECRET }
```

### 2. 用户认证接口

```javascript
// routes/auth.js
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { response, JWT_SECRET } = require('../app')

// 微信登录
router.post('/wxLogin', async (req, res) => {
  try {
    const { code, encryptedData, iv } = req.body
    
    // TODO: 调用微信API验证code，获取用户信息
    // 这里简化处理，实际需要调用微信接口
    
    const user = {
      id: 1,
      nickname: '张三',
      avatar: 'https://example.com/avatar.jpg'
    }
    
    // 生成Token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    res.json(response.success({
      token,
      userInfo: user
    }))
  } catch (error) {
    res.status(500).json(response.error('登录失败', 500))
  }
})

// 获取用户信息
router.get('/user/info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // TODO: 从数据库查询用户信息
    const user = {
      id: userId,
      nickname: '张三',
      avatar: 'https://example.com/avatar.jpg',
      phone: '13800138000',
      role: '监理工程师'
    }
    
    res.json(response.success(user))
  } catch (error) {
    res.status(500).json(response.error('获取失败', 500))
  }
})

// 退出登录
router.post('/logout', authMiddleware, (req, res) => {
  // TODO: 可以将token加入黑名单
  res.json(response.success(null, '退出成功'))
})

module.exports = router
```

### 3. 项目管理接口

```javascript
// routes/projects.js
const express = require('express')
const router = express.Router()
const { response, authMiddleware } = require('../app')

// 模拟数据库
let projects = [
  {
    id: 1,
    name: '城市综合体建设项目',
    code: 'CTZH-2024-001',
    engineer: '李建国',
    status: '进行中',
    statusType: 'progress',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// 获取项目列表
router.get('/', authMiddleware, (req, res) => {
  try {
    // 按置顶状态排序
    const sortedProjects = projects.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
    
    res.json(response.success(sortedProjects))
  } catch (error) {
    res.status(500).json(response.error('获取失败', 500))
  }
})

// 获取项目详情
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const project = projects.find(p => p.id == req.params.id)
    
    if (!project) {
      return res.status(404).json(response.error('项目不存在', 404))
    }
    
    res.json(response.success(project))
  } catch (error) {
    res.status(500).json(response.error('获取失败', 500))
  }
})

// 添加项目
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, code, engineer, status, statusType } = req.body
    
    const newProject = {
      id: projects.length + 1,
      name,
      code,
      engineer,
      status,
      statusType,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    projects.push(newProject)
    
    res.json(response.success(newProject, '创建成功'))
  } catch (error) {
    res.status(500).json(response.error('创建失败', 500))
  }
})

// 更新项目
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const project = projects.find(p => p.id == req.params.id)
    
    if (!project) {
      return res.status(404).json(response.error('项目不存在', 404))
    }
    
    Object.assign(project, req.body, {
      updatedAt: new Date().toISOString()
    })
    
    res.json(response.success(project, '更新成功'))
  } catch (error) {
    res.status(500).json(response.error('更新失败', 500))
  }
})

// 删除项目
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const index = projects.findIndex(p => p.id == req.params.id)
    
    if (index === -1) {
      return res.status(404).json(response.error('项目不存在', 404))
    }
    
    projects.splice(index, 1)
    
    res.json(response.success(null, '删除成功'))
  } catch (error) {
    res.status(500).json(response.error('删除失败', 500))
  }
})

// 置顶项目
router.post('/:id/pin', authMiddleware, (req, res) => {
  try {
    const project = projects.find(p => p.id == req.params.id)
    
    if (!project) {
      return res.status(404).json(response.error('项目不存在', 404))
    }
    
    project.isPinned = true
    project.updatedAt = new Date().toISOString()
    
    res.json(response.success({ isPinned: true }, '置顶成功'))
  } catch (error) {
    res.status(500).json(response.error('置顶失败', 500))
  }
})

// 取消置顶项目
router.post('/:id/unpin', authMiddleware, (req, res) => {
  try {
    const project = projects.find(p => p.id == req.params.id)
    
    if (!project) {
      return res.status(404).json(response.error('项目不存在', 404))
    }
    
    project.isPinned = false
    project.updatedAt = new Date().toISOString()
    
    res.json(response.success({ isPinned: false }, '取消置顶成功'))
  } catch (error) {
    res.status(500).json(response.error('操作失败', 500))
  }
})

module.exports = router
```

### 4. 工程管理接口

```javascript
// routes/works.js
const express = require('express')
const router = express.Router()
const { response, authMiddleware } = require('../app')

// 模拟数据库
let works = [
  {
    id: 1,
    name: '主体结构工程',
    code: 'CTZH-2024-001-ZTJ',
    unit: '第一施工段',
    color: '#0d9488',
    projectId: 1,
    isPinned: false,
    createdAt: new Date().toISOString()
  }
]

// 获取工程列表
router.get('/', authMiddleware, (req, res) => {
  try {
    const { projectId } = req.query
    
    let result = works
    
    if (projectId) {
      result = works.filter(w => w.projectId == projectId)
    }
    
    // 按置顶状态排序
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
    
    res.json(response.success(result))
  } catch (error) {
    res.status(500).json(response.error('获取失败', 500))
  }
})

// 置顶工程
router.post('/:id/pin', authMiddleware, (req, res) => {
  try {
    const work = works.find(w => w.id == req.params.id)
    
    if (!work) {
      return res.status(404).json(response.error('工程不存在', 404))
    }
    
    work.isPinned = true
    
    res.json(response.success({ isPinned: true }, '置顶成功'))
  } catch (error) {
    res.status(500).json(response.error('置顶失败', 500))
  }
})

// 其他接口类似...

module.exports = router
```

### 5. 监理日志接口

```javascript
// routes/logs.js
const express = require('express')
const router = express.Router()
const { response, authMiddleware } = require('../app')

// 模拟数据库
let logs = []

// 获取日志列表
router.get('/', authMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    
    let result = logs
    
    // 状态筛选
    if (status) {
      result = logs.filter(l => l.statusType === status)
    }
    
    // 按置顶状态排序
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
    
    // 分页
    const start = (page - 1) * pageSize
    const end = start + parseInt(pageSize)
    const paginatedResult = result.slice(start, end)
    
    res.json(response.success(paginatedResult))
  } catch (error) {
    res.status(500).json(response.error('获取失败', 500))
  }
})

// 删除日志
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const index = logs.findIndex(l => l.id == req.params.id)
    
    if (index === -1) {
      return res.status(404).json(response.error('日志不存在', 404))
    }
    
    logs.splice(index, 1)
    
    res.json(response.success(null, '删除成功'))
  } catch (error) {
    res.status(500).json(response.error('删除失败', 500))
  }
})

// 导出Word
router.get('/:id/export', authMiddleware, (req, res) => {
  try {
    const log = logs.find(l => l.id == req.params.id)
    
    if (!log) {
      return res.status(404).json(response.error('日志不存在', 404))
    }
    
    // TODO: 生成Word文档
    // 这里需要使用如 docx 或 officegen 等库
    
    res.setHeader('Content-Type', 'application/msword')
    res.setHeader('Content-Disposition', 'attachment; filename="log.doc"')
    
    // 发送文件
    res.send('Word文件内容')
  } catch (error) {
    res.status(500).json(response.error('导出失败', 500))
  }
})

module.exports = router
```

### 6. 文件上传接口

```javascript
// routes/upload.js
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { response, authMiddleware } = require('../app')

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueName + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// 上传图片
router.post('/image', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(response.error('请选择文件', 400))
    }
    
    const fileInfo = {
      url: `https://your-domain.com/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      size: req.file.size
    }
    
    res.json(response.success(fileInfo, '上传成功'))
  } catch (error) {
    res.status(500).json(response.error('上传失败', 500))
  }
})

module.exports = router
```

### 7. 统计数据接口

```javascript
// routes/stats.js
const express = require('express')
const router = express.Router()
const { response, authMiddleware } = require('../app')

// 获取日志统计
router.get('/logs', authMiddleware, (req, res) => {
  try {
    // TODO: 从数据库统计
    const stats = {
      monthCount: 12,
      totalCount: 48,
      submittedCount: 40,
      pendingCount: 8
    }
    
    res.json(response.success(stats))
  } catch (error) {
    res.status(500).json(response.error('获取失败', 500))
  }
})

module.exports = router
```

### 8. 主文件

```javascript
// server.js
const { app } = require('./app')

// 路由
const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const workRoutes = require('./routes/works')
const logRoutes = require('./routes/logs')
const uploadRoutes = require('./routes/upload')
const statsRoutes = require('./routes/stats')

// 挂载路由
app.use('/api/auth', authRoutes)
app.use('/api/user', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/works', workRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/stats', statsRoutes)

// 静态文件
app.use('/uploads', express.static('uploads'))

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  })
})

// 启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})
```

---

## Python + Flask 示例

### 基础配置

```python
# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# 配置
app.config['SECRET_KEY'] = 'your-secret-key'

# 统一响应格式
def success_response(data, message='操作成功'):
    return jsonify({
        'code': 200,
        'message': message,
        'data': data
    })

def error_response(message='操作失败', code=400):
    return jsonify({
        'code': code,
        'message': message,
        'data': None
    }), code

# Token验证装饰器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return error_response('未授权', 401)
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user = data
        except:
            return error_response('Token无效', 401)
        
        return f(*args, **kwargs)
    
    return decorated

# 项目列表接口
@app.route('/api/projects', methods=['GET'])
@token_required
def get_projects():
    # TODO: 从数据库查询
    projects = []
    return success_response(projects)

# 置顶项目
@app.route('/api/projects/<int:id>/pin', methods=['POST'])
@token_required
def pin_project(id):
    # TODO: 更新数据库
    return success_response({'isPinned': True}, '置顶成功')

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

---

## 数据库设计建议

### MySQL 示例

```sql
-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(100),
  avatar VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 项目表
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200),
  code VARCHAR(100),
  engineer VARCHAR(100),
  status VARCHAR(50),
  status_type VARCHAR(50),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 工程表
CREATE TABLE works (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200),
  code VARCHAR(100),
  unit VARCHAR(100),
  color VARCHAR(20),
  project_id INT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 日志表
CREATE TABLE logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date VARCHAR(100),
  project VARCHAR(200),
  weather VARCHAR(100),
  status VARCHAR(50),
  status_type VARCHAR(50),
  content TEXT,
  images TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 测试建议

### 使用Postman测试

1. 导入接口集合
2. 设置环境变量（API地址、Token）
3. 按顺序测试每个接口
4. 验证响应格式和数据

### 自动化测试

```javascript
// 使用Jest进行单元测试
const request = require('supertest')
const app = require('./app')

describe('Projects API', () => {
  it('should get projects list', async () => {
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', 'Bearer test-token')
    
    expect(response.status).toBe(200)
    expect(response.body.code).toBe(200)
  })
})
```

---

## 注意事项

1. **安全性**: 
   - 使用HTTPS
   - 验证所有输入参数
   - 防止SQL注入
   - 限制请求频率

2. **性能**:
   - 添加数据库索引
   - 使用Redis缓存
   - 实现分页查询

3. **错误处理**:
   - 记录错误日志
   - 返回友好的错误信息
   - 避免泄露敏感信息

---

**文档版本**: v1.0.0  
**最后更新**: 2024-11-07

