/**
 * 小程序端 - Word导出完整实现代码
 * 
 * 这是一个可以直接复制粘贴使用的完整解决方案
 * 包含了所有必要的错误处理和用户提示
 * 
 * 使用前请修改：
 * 1. BASE_URL - 改为你的后端地址
 * 2. getToken() - 改为你的token获取方式
 */

// ============================================
// 配置区域 - 请根据实际情况修改
// ============================================

// 后端API地址
const BASE_URL = 'https://your-domain.com'

// 获取用户token的函数（根据你的项目实际情况修改）
function getToken() {
  return wx.getStorageSync('token')
}

// ============================================
// 核心导出函数
// ============================================

/**
 * 导出监理日志为Word文档（推荐方式）
 * 
 * 优点：
 * - 代码简单，一步到位
 * - 自动下载和打开
 * - 用户体验好
 * 
 * 注意：
 * - 需要在微信公众平台配置 downloadFile 合法域名
 * 
 * @param {Number} logId - 监理日志ID
 */
function exportWord(logId) {
  // 显示加载提示
  wx.showLoading({
    title: '正在导出Word...',
    mask: true
  })

  // 获取token
  const token = getToken()
  
  if (!token) {
    wx.hideLoading()
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  // 使用 downloadFile 下载Word文档
  wx.downloadFile({
    url: `${BASE_URL}/api/supervision-logs/${logId}/export`,
    header: {
      'Authorization': `Bearer ${token}`
    },
    success(res) {
      wx.hideLoading()
      
      console.log('下载响应:', res)
      
      // 检查状态码
      if (res.statusCode === 200) {
        // 下载成功，直接打开文档
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'docx',
          showMenu: true,
          success() {
            wx.showToast({
              title: '导出成功',
              icon: 'success'
            })
          },
          fail(err) {
            console.error('打开文档失败:', err)
            wx.showModal({
              title: '提示',
              content: '文档已下载，但打开失败。请尝试保存后用其他应用打开。',
              showCancel: false
            })
          }
        })
      } else if (res.statusCode === 401) {
        // Token过期
        wx.showModal({
          title: '登录已过期',
          content: '请重新登录',
          showCancel: false,
          success() {
            // 跳转到登录页（根据你的项目实际路径修改）
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }
        })
      } else if (res.statusCode === 404) {
        // 日志不存在
        wx.showToast({
          title: '日志不存在',
          icon: 'none'
        })
      } else {
        // 其他错误
        wx.showToast({
          title: `导出失败(${res.statusCode})`,
          icon: 'none'
        })
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败:', err)
      
      // 判断错误类型
      if (err.errMsg && err.errMsg.includes('domain')) {
        // 域名未配置
        wx.showModal({
          title: '配置错误',
          content: '请在微信公众平台配置 downloadFile 合法域名',
          showCancel: false
        })
      } else if (err.errMsg && err.errMsg.includes('fail')) {
        // 下载失败
        wx.showModal({
          title: '下载失败',
          content: '网络异常，请检查网络连接后重试',
          showCancel: false
        })
      } else {
        // 其他错误
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    }
  })
}

/**
 * 导出Word并保存到本地相册
 * 
 * @param {Number} logId - 监理日志ID
 */
function exportWordAndSave(logId) {
  wx.showLoading({
    title: '正在导出...',
    mask: true
  })

  const token = getToken()
  
  if (!token) {
    wx.hideLoading()
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  wx.downloadFile({
    url: `${BASE_URL}/api/supervision-logs/${logId}/export`,
    header: {
      'Authorization': `Bearer ${token}`
    },
    success(res) {
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        // 获取文件系统管理器
        const fs = wx.getFileSystemManager()
        
        // 生成文件名
        const fileName = `监理日志_${logId}_${Date.now()}.docx`
        const savedPath = `${wx.env.USER_DATA_PATH}/${fileName}`
        
        // 保存文件
        fs.saveFile({
          tempFilePath: res.tempFilePath,
          filePath: savedPath,
          success() {
            wx.showModal({
              title: '保存成功',
              content: `文件已保存：${fileName}`,
              confirmText: '打开',
              cancelText: '关闭',
              success(modalRes) {
                if (modalRes.confirm) {
                  // 打开文档
                  wx.openDocument({
                    filePath: savedPath,
                    fileType: 'docx',
                    showMenu: true
                  })
                }
              }
            })
          },
          fail(err) {
            console.error('保存文件失败:', err)
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      } else {
        handleErrorStatus(res.statusCode)
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败:', err)
      handleDownloadError(err)
    }
  })
}

/**
 * 导出Word并分享
 * 
 * @param {Number} logId - 监理日志ID
 */
function exportWordAndShare(logId) {
  wx.showLoading({
    title: '正在准备分享...',
    mask: true
  })

  const token = getToken()
  
  if (!token) {
    wx.hideLoading()
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  wx.downloadFile({
    url: `${BASE_URL}/api/supervision-logs/${logId}/export`,
    header: {
      'Authorization': `Bearer ${token}`
    },
    success(res) {
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        // 分享文件
        wx.shareFileMessage({
          filePath: res.tempFilePath,
          fileName: `监理日志_${logId}.docx`,
          success() {
            wx.showToast({
              title: '分享成功',
              icon: 'success'
            })
          },
          fail(err) {
            console.error('分享失败:', err)
            wx.showToast({
              title: '分享失败',
              icon: 'none'
            })
          }
        })
      } else {
        handleErrorStatus(res.statusCode)
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败:', err)
      handleDownloadError(err)
    }
  })
}

// ============================================
// 辅助函数
// ============================================

/**
 * 处理HTTP错误状态码
 */
function handleErrorStatus(statusCode) {
  switch (statusCode) {
    case 401:
      wx.showModal({
        title: '登录已过期',
        content: '请重新登录',
        showCancel: false,
        success() {
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      })
      break
    case 404:
      wx.showToast({
        title: '日志不存在',
        icon: 'none'
      })
      break
    case 500:
      wx.showToast({
        title: '服务器错误',
        icon: 'none'
      })
      break
    default:
      wx.showToast({
        title: `导出失败(${statusCode})`,
        icon: 'none'
      })
  }
}

/**
 * 处理下载错误
 */
function handleDownloadError(err) {
  if (err.errMsg && err.errMsg.includes('domain')) {
    wx.showModal({
      title: '配置错误',
      content: '请在微信公众平台配置 downloadFile 合法域名：\n\n' + BASE_URL,
      showCancel: false
    })
  } else if (err.errMsg && err.errMsg.includes('fail')) {
    wx.showModal({
      title: '下载失败',
      content: '网络异常，请检查网络连接后重试',
      showCancel: false
    })
  } else {
    wx.showToast({
      title: '导出失败',
      icon: 'none'
    })
  }
}

/**
 * 检查网络状态
 */
function checkNetwork(callback) {
  wx.getNetworkType({
    success(res) {
      if (res.networkType === 'none') {
        wx.showToast({
          title: '网络未连接',
          icon: 'none'
        })
        return false
      }
      callback && callback()
    },
    fail() {
      callback && callback()
    }
  })
}

/**
 * 带网络检查的导出
 */
function exportWordWithCheck(logId) {
  checkNetwork(() => {
    exportWord(logId)
  })
}

// ============================================
// 导出模块（根据项目模块化方式选择）
// ============================================

// CommonJS 方式
module.exports = {
  exportWord,                 // 推荐：简单导出并打开
  exportWordAndSave,          // 导出并保存到本地
  exportWordAndShare,         // 导出并分享
  exportWordWithCheck,        // 带网络检查的导出
  BASE_URL                    // 导出BASE_URL供外部修改
}

// 或者 ES6 方式（如果项目支持）
// export {
//   exportWord,
//   exportWordAndSave,
//   exportWordAndShare,
//   exportWordWithCheck,
//   BASE_URL
// }

// ============================================
// 使用示例
// ============================================

/**
 * 在页面中使用示例
 * 
 * 1. 在页面JS中引入：
 * const { exportWord } = require('../../utils/word-export')
 * 
 * 2. 在按钮点击事件中调用：
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
 *   onExportWord() {
 *     exportWord(this.data.logId)
 *   }
 * })
 * 
 * 3. 如果需要导出并保存：
 * onExportAndSave() {
 *   exportWordAndSave(this.data.logId)
 * }
 * 
 * 4. 如果需要导出并分享：
 * onExportAndShare() {
 *   exportWordAndShare(this.data.logId)
 * }
 */

// ============================================
// 配置检查清单
// ============================================

/**
 * 使用前请确认：
 * 
 * ✅ 1. 修改 BASE_URL 为你的后端地址
 *    例如：const BASE_URL = 'https://api.example.com'
 * 
 * ✅ 2. 修改 getToken() 函数
 *    确保能正确获取到用户的token
 * 
 * ✅ 3. 在微信公众平台配置 downloadFile 合法域名
 *    登录 https://mp.weixin.qq.com
 *    开发管理 → 开发设置 → 服务器域名
 *    在 "downloadFile合法域名" 中添加你的域名
 * 
 * ✅ 4. 确认后端接口路径正确
 *    接口：GET /api/supervision-logs/:id/export
 *    如果路径不同，请修改代码中的URL
 * 
 * ✅ 5. 测试网络连接
 *    先在开发工具中测试
 *    然后在真机上测试
 */

// ============================================
// 故障排查
// ============================================

/**
 * 如果遇到 "下载失败" 错误：
 * 
 * 1. 域名未配置
 *    - 错误信息：errMsg: "downloadFile:fail invalid url domain"
 *    - 解决方法：在微信公众平台配置 downloadFile 合法域名
 * 
 * 2. Token无效
 *    - 错误信息：statusCode: 401
 *    - 解决方法：检查token是否有效，是否已过期
 * 
 * 3. 日志不存在
 *    - 错误信息：statusCode: 404
 *    - 解决方法：检查日志ID是否正确
 * 
 * 4. 网络问题
 *    - 错误信息：errMsg: "downloadFile:fail"
 *    - 解决方法：检查网络连接，尝试重启小程序
 * 
 * 5. 服务器错误
 *    - 错误信息：statusCode: 500
 *    - 解决方法：查看后端日志，确认服务正常运行
 * 
 * 6. 跨域问题
 *    - 开发工具正常，真机失败
 *    - 解决方法：确认域名配置正确，包括https
 */

