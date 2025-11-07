/**
 * 小程序端 - 监理日志Word导出示例
 * 完整的下载和保存流程
 */

/**
 * 方式一：使用 wx.downloadFile（推荐 - 更简单）
 * 适用于：直接下载到本地，用户可以打开/分享
 */
function exportWordMethod1(logId) {
  wx.showLoading({
    title: '正在导出...'
  })

  // 获取token
  const token = wx.getStorageSync('token')
  const BASE_URL = 'https://your-domain.com' // 替换为你的域名

  wx.downloadFile({
    url: `${BASE_URL}/api/v1/supervision-logs/${logId}/export`,
    header: {
      'Authorization': `Bearer ${token}`
    },
    success(res) {
      wx.hideLoading()

      if (res.statusCode === 200) {
        const filePath = res.tempFilePath

        wx.showModal({
          title: '导出成功',
          content: '是否立即打开Word文档？',
          confirmText: '打开',
          cancelText: '稍后',
          success(modalRes) {
            if (modalRes.confirm) {
              // 打开文档
              wx.openDocument({
                filePath: filePath,
                fileType: 'docx',
                success() {
                  console.log('打开文档成功')
                },
                fail(err) {
                  console.error('打开文档失败', err)
                  wx.showToast({
                    title: '打开失败',
                    icon: 'none'
                  })
                }
              })
            } else {
              // 保存到相册或分享
              wx.showActionSheet({
                itemList: ['保存到文件', '分享给朋友'],
                success(actionRes) {
                  if (actionRes.tapIndex === 0) {
                    // 保存文件
                    saveFileToLocal(filePath)
                  } else if (actionRes.tapIndex === 1) {
                    // 分享文件
                    shareFile(filePath)
                  }
                }
              })
            }
          }
        })
      } else {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  })
}

/**
 * 方式二：使用 wx.request（需要手动处理二进制）
 * 适用于：需要对数据做额外处理的场景
 */
function exportWordMethod2(logId) {
  wx.showLoading({
    title: '正在导出...'
  })

  const token = wx.getStorageSync('token')
  const BASE_URL = 'https://your-domain.com' // 替换为你的域名

  wx.request({
    url: `${BASE_URL}/api/v1/supervision-logs/${logId}/export`,
    method: 'GET',
    responseType: 'arraybuffer', // 关键：设置返回类型为二进制
    header: {
      'Authorization': `Bearer ${token}`
    },
    success(res) {
      wx.hideLoading()

      if (res.statusCode === 200) {
        // 将二进制数据写入临时文件
        const fs = wx.getFileSystemManager()
        const fileName = `监理日志_${logId}_${Date.now()}.docx`
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

        fs.writeFile({
          filePath: filePath,
          data: res.data,
          encoding: 'binary',
          success() {
            wx.showToast({
              title: '导出成功',
              icon: 'success'
            })

            // 打开文档
            wx.openDocument({
              filePath: filePath,
              fileType: 'docx',
              success() {
                console.log('打开文档成功')
              }
            })
          },
          fail(err) {
            console.error('保存文件失败', err)
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      } else {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('请求失败', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  })
}

/**
 * 保存文件到本地
 */
function saveFileToLocal(tempFilePath) {
  wx.saveFile({
    tempFilePath: tempFilePath,
    success(res) {
      const savedFilePath = res.savedFilePath
      wx.showToast({
        title: '已保存到文件',
        icon: 'success'
      })
      console.log('文件已保存：', savedFilePath)
    },
    fail(err) {
      console.error('保存失败', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 分享文件给好友
 */
function shareFile(filePath) {
  wx.shareFileMessage({
    filePath: filePath,
    fileName: `监理日志_${Date.now()}.docx`,
    success() {
      wx.showToast({
        title: '分享成功',
        icon: 'success'
      })
    },
    fail(err) {
      console.error('分享失败', err)
      wx.showToast({
        title: '分享失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 完整示例：在页面中使用
 */
Page({
  data: {
    logId: 1 // 当前日志ID
  },

  // 点击导出按钮
  onExportClick() {
    const { logId } = this.data

    // 使用方式一（推荐）
    exportWordMethod1(logId)

    // 或使用方式二
    // exportWordMethod2(logId)
  },

  // 也可以封装成通用方法
  async exportLog(logId) {
    try {
      await exportWordMethod1(logId)
    } catch (err) {
      console.error('导出失败', err)
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      })
    }
  }
})

module.exports = {
  exportWordMethod1,
  exportWordMethod2,
  saveFileToLocal,
  shareFile
}


