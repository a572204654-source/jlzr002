/**
 * ⚡ 一键复制使用 - 小程序Word导出功能
 * 
 * 使用步骤：
 * 1. 复制这个文件到你的小程序项目 utils 目录
 * 2. 修改下面的 BASE_URL 为你的后端地址
 * 3. 在页面中引入并调用 exportWord(logId)
 * 
 * 示例：
 * const { exportWord } = require('../../utils/word-export')
 * exportWord(123) // 传入日志ID即可
 */

// ============================================
// 🔧 配置区域 - 请修改这里
// ============================================

// 你的后端地址（必须是 https://）
const BASE_URL = 'https://your-domain.com'

// Token在storage中的key（根据你的项目修改）
const TOKEN_KEY = 'token'

// 接口路径（如果不同请修改）
const API_PATH = '/api/supervision-logs'

// ============================================
// ⚡ 核心导出函数 - 直接使用这个
// ============================================

/**
 * 导出监理日志为Word文档
 * @param {Number} logId - 日志ID
 */
function exportWord(logId) {
  // 1. 参数检查
  if (!logId) {
    wx.showToast({
      title: '日志ID不存在',
      icon: 'none'
    })
    return
  }

  // 2. 显示加载提示
  wx.showLoading({
    title: '正在导出Word...',
    mask: true
  })

  // 3. 获取token
  const token = wx.getStorageSync(TOKEN_KEY)
  
  if (!token) {
    wx.hideLoading()
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  // 4. 构建下载URL
  const url = `${BASE_URL}${API_PATH}/${logId}/export`
  
  console.log('📥 开始下载Word:', url)

  // 5. 下载Word文档
  wx.downloadFile({
    url: url,
    header: {
      'Authorization': `Bearer ${token}`
    },
    
    // 下载成功
    success(res) {
      wx.hideLoading()
      console.log('✅ 下载响应:', res)
      
      // 检查状态码
      if (res.statusCode === 200) {
        // 下载成功，打开Word文档
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'docx',
          showMenu: true,
          
          success() {
            console.log('✅ Word打开成功')
            wx.showToast({
              title: '导出成功',
              icon: 'success'
            })
          },
          
          fail(err) {
            console.error('❌ 打开Word失败:', err)
            wx.showModal({
              title: '提示',
              content: 'Word已下载但打开失败，请尝试其他方式打开',
              showCancel: false
            })
          }
        })
      } 
      // Token过期
      else if (res.statusCode === 401) {
        console.error('❌ Token过期')
        wx.showModal({
          title: '登录已过期',
          content: '请重新登录',
          showCancel: false,
          success() {
            // 跳转到登录页（根据你的项目路径修改）
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }
        })
      } 
      // 日志不存在
      else if (res.statusCode === 404) {
        console.error('❌ 日志不存在')
        wx.showToast({
          title: '日志不存在',
          icon: 'none'
        })
      } 
      // 服务器错误
      else if (res.statusCode === 500) {
        console.error('❌ 服务器错误')
        wx.showToast({
          title: '服务器错误',
          icon: 'none'
        })
      } 
      // 其他错误
      else {
        console.error('❌ 未知错误:', res.statusCode)
        wx.showToast({
          title: `导出失败(${res.statusCode})`,
          icon: 'none'
        })
      }
    },
    
    // 下载失败
    fail(err) {
      wx.hideLoading()
      console.error('❌ 下载失败:', err)
      
      // 判断错误类型
      if (err.errMsg && err.errMsg.includes('domain')) {
        // 域名未配置错误
        console.error('❌ 域名未配置')
        wx.showModal({
          title: '配置错误',
          content: '请在微信公众平台配置 downloadFile 合法域名：\n\n' + BASE_URL,
          showCancel: false,
          confirmText: '我知道了'
        })
      } 
      else if (err.errMsg && err.errMsg.includes('network')) {
        // 网络错误
        console.error('❌ 网络错误')
        wx.showModal({
          title: '网络错误',
          content: '请检查网络连接后重试',
          showCancel: false
        })
      } 
      else if (err.errMsg && err.errMsg.includes('timeout')) {
        // 超时错误
        console.error('❌ 请求超时')
        wx.showModal({
          title: '请求超时',
          content: '网络不稳定，请稍后重试',
          showCancel: false
        })
      } 
      else {
        // 其他未知错误
        console.error('❌ 未知错误')
        wx.showToast({
          title: err.errMsg || '下载失败',
          icon: 'none',
          duration: 3000
        })
      }
    }
  })
}

// ============================================
// 📤 导出函数
// ============================================

module.exports = {
  exportWord,
  BASE_URL,  // 导出供外部访问
  TOKEN_KEY
}

// ============================================
// 📖 使用示例
// ============================================

/**
 * 在页面中使用：
 * 
 * 1. 引入模块
 * const { exportWord } = require('../../utils/word-export')
 * 
 * 2. 在按钮点击事件中调用
 * 
 * // WXML
 * <button bindtap="onExportWord">导出Word</button>
 * 
 * // JS
 * Page({
 *   data: {
 *     logId: 123
 *   },
 *   
 *   // 导出Word
 *   onExportWord() {
 *     exportWord(this.data.logId)
 *   }
 * })
 * 
 * 3. 就这么简单！
 */

// ============================================
// ⚠️ 重要提醒
// ============================================

/**
 * 使用前必须完成的配置：
 * 
 * ✅ 1. 修改本文件开头的 BASE_URL
 *    改为你的实际后端地址，例如：
 *    const BASE_URL = 'https://api.example.com'
 * 
 * ✅ 2. 在微信公众平台配置域名
 *    - 登录 https://mp.weixin.qq.com
 *    - 开发管理 → 开发设置 → 服务器域名
 *    - 在 "downloadFile合法域名" 中添加你的域名
 *    - 保存并等待生效
 * 
 * ✅ 3. 确认后端接口路径
 *    默认：/api/supervision-logs/:id/export
 *    如果不同，修改本文件开头的 API_PATH
 * 
 * ✅ 4. 确认token存储key
 *    默认：'token'
 *    如果不同，修改本文件开头的 TOKEN_KEY
 */

// ============================================
// 🐛 调试技巧
// ============================================

/**
 * 如果遇到问题：
 * 
 * 1. 在微信开发者工具中测试
 *    - 点击右上角"详情"
 *    - 勾选"不校验合法域名..."
 *    - 重新测试
 *    - 如果能成功，说明只需配置域名
 * 
 * 2. 查看控制台日志
 *    - 所有关键步骤都有日志输出
 *    - 以 ✅ 开头的是成功
 *    - 以 ❌ 开头的是错误
 *    - 以 📥 开头的是操作
 * 
 * 3. 检查网络请求
 *    - 切换到"Network"面板
 *    - 点击导出按钮
 *    - 查看请求详情
 * 
 * 4. 常见错误对照：
 *    - "invalid url domain" → 域名未配置
 *    - "statusCode: 401" → Token过期
 *    - "statusCode: 404" → 日志不存在或接口路径错误
 *    - "statusCode: 500" → 后端服务错误
 */

