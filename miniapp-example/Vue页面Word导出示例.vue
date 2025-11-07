<!--
  小程序端 - Word导出功能 Vue页面示例
  
  这个文件展示了如何在uni-app的Vue页面中实现Word导出功能
  可以直接复制代码到你的 profile-logs.vue 或其他页面
-->

<template>
  <view class="log-detail">
    <!-- 日志内容区域 -->
    <view class="log-content">
      <text class="log-title">{{ log.title }}</text>
      <!-- 其他日志内容... -->
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons">
      <!-- 导出Word按钮 -->
      <button 
        class="export-btn" 
        @click="handleExportWord"
        :loading="isExporting"
      >
        {{ isExporting ? '导出中...' : '导出Word' }}
      </button>

      <!-- 导出并保存按钮 -->
      <button 
        class="save-btn" 
        @click="handleExportAndSave"
      >
        导出并保存
      </button>

      <!-- 导出并分享按钮 -->
      <button 
        class="share-btn" 
        @click="handleExportAndShare"
      >
        导出并分享
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      logId: null,           // 当前日志ID
      log: {},               // 日志详情
      isExporting: false     // 是否正在导出
    }
  },

  onLoad(options) {
    // 获取日志ID
    this.logId = options.id || options.logId
    
    // 加载日志详情
    this.loadLogDetail()
  },

  methods: {
    /**
     * 加载日志详情
     */
    async loadLogDetail() {
      // 你的加载逻辑...
    },

    /**
     * 导出Word文档（推荐方式）
     */
    handleExportWord() {
      if (!this.logId) {
        uni.showToast({
          title: '日志ID不存在',
          icon: 'none'
        })
        return
      }

      // 设置导出状态
      this.isExporting = true

      // 显示加载提示
      uni.showLoading({
        title: '正在导出Word...',
        mask: true
      })

      // 获取token
      const token = uni.getStorageSync('token')
      
      if (!token) {
        uni.hideLoading()
        this.isExporting = false
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        // 跳转到登录页
        setTimeout(() => {
          uni.redirectTo({
            url: '/pages/login/login'
          })
        }, 1500)
        return
      }

      // 获取后端地址（从配置文件或环境变量）
      const BASE_URL = this.$baseUrl || 'https://your-domain.com'

      // 使用 uni.downloadFile 下载Word文档
      uni.downloadFile({
        url: `${BASE_URL}/api/supervision-logs/${this.logId}/export`,
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          console.log('下载响应:', res)
          
          uni.hideLoading()
          this.isExporting = false
          
          // 检查状态码
          if (res.statusCode === 200) {
            // 下载成功，打开文档
            uni.openDocument({
              filePath: res.tempFilePath,
              fileType: 'docx',
              showMenu: true,
              success: () => {
                uni.showToast({
                  title: '导出成功',
                  icon: 'success'
                })
              },
              fail: (err) => {
                console.error('打开文档失败:', err)
                uni.showModal({
                  title: '提示',
                  content: '文档已下载，但打开失败。请尝试保存后用其他应用打开。',
                  showCancel: false
                })
              }
            })
          } else {
            // 处理错误状态码
            this.handleErrorStatus(res.statusCode)
          }
        },
        fail: (err) => {
          console.error('下载失败:', err)
          
          uni.hideLoading()
          this.isExporting = false
          
          // 处理下载错误
          this.handleDownloadError(err)
        }
      })
    },

    /**
     * 导出Word并保存到本地
     */
    handleExportAndSave() {
      if (!this.logId) {
        uni.showToast({
          title: '日志ID不存在',
          icon: 'none'
        })
        return
      }

      uni.showLoading({
        title: '正在导出...',
        mask: true
      })

      const token = uni.getStorageSync('token')
      const BASE_URL = this.$baseUrl || 'https://your-domain.com'

      uni.downloadFile({
        url: `${BASE_URL}/api/supervision-logs/${this.logId}/export`,
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          uni.hideLoading()
          
          if (res.statusCode === 200) {
            // 生成文件名
            const fileName = `监理日志_${this.logId}_${Date.now()}.docx`
            const savedPath = `${uni.env.USER_DATA_PATH}/${fileName}`
            
            // 获取文件系统管理器
            const fs = uni.getFileSystemManager()
            
            // 保存文件
            fs.saveFile({
              tempFilePath: res.tempFilePath,
              filePath: savedPath,
              success: () => {
                uni.showModal({
                  title: '保存成功',
                  content: `文件已保存：${fileName}`,
                  confirmText: '打开',
                  cancelText: '关闭',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      // 打开文档
                      uni.openDocument({
                        filePath: savedPath,
                        fileType: 'docx',
                        showMenu: true
                      })
                    }
                  }
                })
              },
              fail: (err) => {
                console.error('保存文件失败:', err)
                uni.showToast({
                  title: '保存失败',
                  icon: 'none'
                })
              }
            })
          } else {
            this.handleErrorStatus(res.statusCode)
          }
        },
        fail: (err) => {
          uni.hideLoading()
          console.error('下载失败:', err)
          this.handleDownloadError(err)
        }
      })
    },

    /**
     * 导出Word并分享
     */
    handleExportAndShare() {
      if (!this.logId) {
        uni.showToast({
          title: '日志ID不存在',
          icon: 'none'
        })
        return
      }

      uni.showLoading({
        title: '正在准备分享...',
        mask: true
      })

      const token = uni.getStorageSync('token')
      const BASE_URL = this.$baseUrl || 'https://your-domain.com'

      uni.downloadFile({
        url: `${BASE_URL}/api/supervision-logs/${this.logId}/export`,
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          uni.hideLoading()
          
          if (res.statusCode === 200) {
            // 分享文件
            uni.shareFileMessage({
              filePath: res.tempFilePath,
              fileName: `监理日志_${this.logId}.docx`,
              success: () => {
                uni.showToast({
                  title: '分享成功',
                  icon: 'success'
                })
              },
              fail: (err) => {
                console.error('分享失败:', err)
                uni.showToast({
                  title: '分享失败',
                  icon: 'none'
                })
              }
            })
          } else {
            this.handleErrorStatus(res.statusCode)
          }
        },
        fail: (err) => {
          uni.hideLoading()
          console.error('下载失败:', err)
          this.handleDownloadError(err)
        }
      })
    },

    /**
     * 处理HTTP错误状态码
     */
    handleErrorStatus(statusCode) {
      switch (statusCode) {
        case 401:
          uni.showModal({
            title: '登录已过期',
            content: '请重新登录',
            showCancel: false,
            success: () => {
              uni.redirectTo({
                url: '/pages/login/login'
              })
            }
          })
          break
        case 404:
          uni.showToast({
            title: '日志不存在',
            icon: 'none'
          })
          break
        case 500:
          uni.showToast({
            title: '服务器错误',
            icon: 'none'
          })
          break
        default:
          uni.showToast({
            title: `导出失败(${statusCode})`,
            icon: 'none'
          })
      }
    },

    /**
     * 处理下载错误
     */
    handleDownloadError(err) {
      console.error('下载错误详情:', err)
      
      if (err.errMsg) {
        if (err.errMsg.includes('domain')) {
          // 域名未配置
          uni.showModal({
            title: '配置错误',
            content: '请在微信公众平台配置 downloadFile 合法域名',
            showCancel: false
          })
        } else if (err.errMsg.includes('network')) {
          // 网络错误
          uni.showModal({
            title: '网络错误',
            content: '请检查网络连接后重试',
            showCancel: false
          })
        } else if (err.errMsg.includes('timeout')) {
          // 超时
          uni.showModal({
            title: '请求超时',
            content: '网络不稳定，请稍后重试',
            showCancel: false
          })
        } else {
          // 其他错误
          uni.showModal({
            title: '下载失败',
            content: err.errMsg || '未知错误',
            showCancel: false
          })
        }
      } else {
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },

    /**
     * 检查网络状态
     */
    checkNetwork(callback) {
      uni.getNetworkType({
        success: (res) => {
          if (res.networkType === 'none') {
            uni.showToast({
              title: '网络未连接',
              icon: 'none'
            })
            return false
          }
          callback && callback()
        },
        fail: () => {
          callback && callback()
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.log-detail {
  padding: 30rpx;
}

.log-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.log-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.export-btn,
.save-btn,
.share-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  border: none;
}

.export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.save-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.share-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.export-btn::after,
.save-btn::after,
.share-btn::after {
  border: none;
}

/* 加载状态 */
.export-btn[loading] {
  opacity: 0.6;
}
</style>

<!--
使用说明：

1. 如果你使用的是原生微信小程序，将 uni.xxx 替换为 wx.xxx
   例如：
   - uni.downloadFile → wx.downloadFile
   - uni.showToast → wx.showToast
   - uni.getStorageSync → wx.getStorageSync

2. 确保在 main.js 或 App.vue 中配置了 BASE_URL：
   Vue.prototype.$baseUrl = 'https://your-domain.com'

3. 在微信公众平台配置 downloadFile 合法域名：
   - 登录 https://mp.weixin.qq.com
   - 开发管理 → 开发设置 → 服务器域名
   - 在 "downloadFile合法域名" 中添加你的后端域名

4. 如果后端接口路径不同，修改代码中的URL：
   当前：/api/supervision-logs/:id/export
   如果是 v1 版本：/api/v1/supervision-logs/:id/export

5. 测试步骤：
   - 先在开发工具中测试（不校验域名）
   - 然后在真机上测试（需要配置域名）
-->

