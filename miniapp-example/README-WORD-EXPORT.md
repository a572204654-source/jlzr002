# 小程序端 - Word导出使用指南

## 📌 重要说明

**后端Word导出功能已更新，但前端代码无需修改！**

✅ **API接口完全向后兼容**
- 接口路径不变
- 请求参数不变  
- 响应格式不变
- 现有小程序代码可以正常使用

## 🎯 快速使用

### 方法一：使用现有的API（零改动）

如果你的小程序已经实现了Word导出功能，**什么都不用改**！

```javascript
// 现有代码继续有效
const api = require('./api')

// 导出Word
api.supervisionLog.exportWord(logId)
```

### 方法二：使用推荐的下载方式（最佳体验）

为了更好的用户体验，建议使用 `wx.downloadFile` 实现：

```javascript
function exportWord(logId) {
  wx.showLoading({ title: '正在导出...' })

  const token = wx.getStorageSync('token')
  const BASE_URL = 'https://your-domain.com'

  wx.downloadFile({
    url: `${BASE_URL}/api/v1/supervision-logs/${logId}/export`,
    header: {
      'Authorization': `Bearer ${token}`
    },
    success(res) {
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        // 直接打开文档
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'docx',
          success() {
            wx.showToast({ title: '导出成功', icon: 'success' })
          }
        })
      }
    }
  })
}
```

## 📦 完整示例

详细代码请查看：`word-export-example.js`

该文件包含：
1. ✅ 两种导出方式（downloadFile / request）
2. ✅ 完整的错误处理
3. ✅ 文件保存到本地
4. ✅ 文件分享给好友
5. ✅ 页面集成示例

## 🎨 在页面中使用

### WXML 模板

```xml
<!-- 在监理日志详情页添加导出按钮 -->
<view class="log-actions">
  <button 
    class="export-btn" 
    bindtap="onExportWord"
  >
    导出Word
  </button>
</view>
```

### JS 逻辑

```javascript
// pages/log-detail/log-detail.js
const { exportWordMethod1 } = require('../../utils/word-export-example')

Page({
  data: {
    logId: null
  },

  onLoad(options) {
    this.setData({
      logId: options.id
    })
  },

  // 导出Word
  onExportWord() {
    const { logId } = this.data
    
    if (!logId) {
      wx.showToast({
        title: '日志ID不存在',
        icon: 'none'
      })
      return
    }

    // 调用导出方法
    exportWordMethod1(logId)
  }
})
```

### CSS 样式

```css
/* 导出按钮样式 */
.export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8rpx;
  font-size: 28rpx;
  padding: 20rpx 40rpx;
}

.export-btn::after {
  border: none;
}
```

## 🔧 API详情

### 接口地址
```
GET /api/v1/supervision-logs/:id/export
```

### 请求头
```javascript
{
  "Authorization": "Bearer {token}"
}
```

### 响应
- **Content-Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Content-Disposition**: `attachment; filename="监理日志_2024-11-07.docx"`
- **Body**: Word文档的二进制数据流

### 错误处理

| 状态码 | 说明 | 处理方式 |
|--------|------|----------|
| 200 | 成功 | 正常下载文件 |
| 401 | 未登录 | 跳转到登录页 |
| 404 | 日志不存在 | 提示用户 |
| 500 | 服务器错误 | 提示稍后重试 |

## 📱 小程序权限配置

### app.json 配置

确保配置了文件下载域名：

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

### 服务器域名配置

在微信公众平台配置：

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 开发管理 → 开发设置 → 服务器域名
3. 添加你的后端域名到 **downloadFile合法域名**

```
https://your-domain.com
```

## 🎁 新版本改进

后端Word导出已全面升级，带来以下改进：

### ✨ 格式优化
- ✅ 完全还原标准监理日志格式
- ✅ 支持竖排文字（工程名称、日期等）
- ✅ 精确的单元格合并
- ✅ 标准的表格样式和边框

### 🚀 性能提升
- ✅ 更快的生成速度
- ✅ 更小的文件体积
- ✅ 更好的兼容性

### 📝 内容完整
- ✅ 支持多天气记录
- ✅ 支持多工作内容
- ✅ 支持多附件信息
- ✅ 完整的审批流信息

### 🔒 向后兼容
- ✅ API接口不变
- ✅ 请求参数不变
- ✅ 响应格式不变
- ✅ **现有前端代码无需修改**

## 💡 最佳实践

### 1. 添加导出前确认

```javascript
onExportWord() {
  wx.showModal({
    title: '确认导出',
    content: '是否导出当前监理日志为Word文档？',
    success: (res) => {
      if (res.confirm) {
        exportWordMethod1(this.data.logId)
      }
    }
  })
}
```

### 2. 检查网络状态

```javascript
onExportWord() {
  wx.getNetworkType({
    success: (res) => {
      if (res.networkType === 'none') {
        wx.showToast({
          title: '网络未连接',
          icon: 'none'
        })
        return
      }
      exportWordMethod1(this.data.logId)
    }
  })
}
```

### 3. 添加导出历史

```javascript
// 保存导出记录
function saveExportHistory(logId, fileName) {
  const history = wx.getStorageSync('export_history') || []
  history.unshift({
    logId,
    fileName,
    time: new Date().getTime()
  })
  // 只保留最近10条
  wx.setStorageSync('export_history', history.slice(0, 10))
}
```

## 🐛 常见问题

### 1. 下载失败
**原因**：域名未配置或token过期
**解决**：
- 检查服务器域名配置
- 确认token有效性

### 2. 文件无法打开
**原因**：文件格式错误或损坏
**解决**：
- 确认后端返回的是Word文件
- 检查 `fileType: 'docx'` 设置正确

### 3. 保存失败
**原因**：用户拒绝了权限
**解决**：
- 引导用户开启文件读写权限
- 使用 `wx.openSetting()` 打开设置页

## 📞 技术支持

如有问题，请查看：
- 后端文档：`../docx/Word导出格式说明.md`
- 测试脚本：`../scripts/test-word-export.js`
- API文档：`../API.md`

---

**更新时间**: 2024-11-07  
**版本**: v2.0.0  
**兼容性**: ✅ 完全向后兼容


