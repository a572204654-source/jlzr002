# 快速启动指南

## 🚀 一键启动

### Windows PowerShell
```powershell
# 设置端口并启动（推荐端口80，与云托管环境一致）
$env:PORT=80; npm start
```

### 开发模式（自动重启）
```bash
npm run dev
```

---

## 🔍 验证系统

### 测试数据库连接
```bash
npm run test-db
```

### 完整功能验证
```bash
npm run verify
```

**前提**: 确保服务器已启动

---

## 📡 快速测试接口

### 1. 健康检查
```bash
curl http://localhost/health
```

### 2. 系统诊断
```bash
curl http://localhost/diagnose
```

### 3. API信息
```bash
curl http://localhost/api
```

### 4. 查询天气（北京）
```bash
curl "http://localhost/api/weather/current?latitude=39.92&longitude=116.41"
```

---

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动服务器（生产模式） |
| `npm run dev` | 启动服务器（开发模式，自动重启） |
| `npm run test-db` | 测试数据库连接 |
| `npm run verify` | 完整功能验证 |
| `npm run init-db` | 初始化数据库表结构 |
| `npm run init-data` | 初始化测试数据 |

---

## 🌐 访问地址

- **本地开发**: http://localhost
- **健康检查**: http://localhost/health
- **系统诊断**: http://localhost/diagnose
- **API文档**: http://localhost/api

---

## 📝 注意事项

1. **端口设置**: 默认端口3000，建议设置为80（与云托管一致）
2. **数据库**: 开发环境自动使用外网地址
3. **认证**: 大部分接口需要JWT token，使用微信登录获取
4. **日志**: 使用 `console.log` 查看运行日志

---

## ✅ 当前状态

- ✅ 服务器运行正常
- ✅ 数据库连接正常
- ✅ 所有核心功能正常
- ✅ 成功率: 100%

详细报告请查看: [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md)
