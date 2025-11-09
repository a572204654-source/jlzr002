const app = getApp()
const apiUrl = app.globalData.apiUrl

Page({
  data: {
    isRecording: false,
    isConnected: false,
    recognizedText: '',
    currentText: '',
    statusText: '按住说话',
    histories: [],
    stats: {
      totalCount: 0,
      todayCount: 0
    },
    
    // 识别配置
    engineType: '16k_zh',
    voiceFormat: 1, // 1:pcm
    needvad: 1,
    filterDirty: 0,
    filterModal: 0,
    convertNumMode: 1,
    wordInfo: 2
  },

  onLoad() {
    console.log('实时语音识别页面加载')
    this.recorderManager = wx.getRecorderManager()
    this.initRecorder()
    this.loadHistory()
    this.loadStats()
  },

  onUnload() {
    console.log('页面卸载，清理资源')
    this.stopRecording()
    if (this.socketTask) {
      this.socketTask.close()
    }
  },

  /**
   * 初始化录音器
   */
  initRecorder() {
    const that = this

    // 录音开始
    this.recorderManager.onStart(() => {
      console.log('录音已开始')
      that.setData({
        statusText: '正在录音...',
        currentText: ''
      })
    })

    // 录音暂停
    this.recorderManager.onPause(() => {
      console.log('录音已暂停')
    })

    // 录音停止
    this.recorderManager.onStop((res) => {
      console.log('录音已停止', res)
      const { tempFilePath, duration, fileSize } = res
      
      that.setData({
        statusText: '处理中...'
      })

      // 上传识别
      that.uploadAndRecognize(tempFilePath, fileSize)
    })

    // 录音帧数据
    this.recorderManager.onFrameRecorded((res) => {
      const { frameBuffer } = res
      // 发送到WebSocket进行实时识别
      if (that.data.isConnected && that.socketTask) {
        that.sendAudioFrame(frameBuffer, false)
      }
    })

    // 录音错误
    this.recorderManager.onError((err) => {
      console.error('录音错误', err)
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      })
      that.setData({
        isRecording: false,
        statusText: '按住说话'
      })
    })
  },

  /**
   * 连接WebSocket
   */
  connectWebSocket() {
    const that = this
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (!token || !userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return false
    }

    // 如果已有连接，先关闭
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }

    // 清除之前的超时定时器
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout)
      this.connectTimeout = null
    }

    // 创建WebSocket连接
    // 注意：小程序WebSocket地址使用wss://而不是https://
    const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/api/realtime-voice/stream'
    
    console.log('连接WebSocket:', wsUrl)

    // 使用页面对象属性来跟踪连接状态
    that.receivedWelcome = false
    that.connectStartTime = Date.now()

    this.socketTask = wx.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket连接请求已发送')
      },
      fail: (err) => {
        console.error('WebSocket连接失败', err)
        if (that.connectTimeout) {
          clearTimeout(that.connectTimeout)
          that.connectTimeout = null
        }
        wx.showToast({
          title: '连接失败',
          icon: 'none'
        })
      }
    })

    // 监听WebSocket连接打开
    this.socketTask.onOpen(() => {
      console.log('WebSocket已打开，等待欢迎消息...')
      
      // 设置超时检测：15秒内必须收到欢迎消息
      that.connectTimeout = setTimeout(() => {
        if (!that.receivedWelcome) {
          const totalTime = Date.now() - that.connectStartTime
          console.error('❌ WebSocket连接超时（15秒未建立连接）')
          console.error('连接状态:', {
            '已连接': that.data.isConnected,
            '总耗时': `${totalTime}ms`,
            '连接地址': wsUrl,
            '网络类型': 'wifi',
            'socketTask状态': that.socketTask ? 'exists' : 'null',
            'WebSocket状态': 'OPEN'
          })
          
          if (that.socketTask) {
            that.socketTask.close()
            that.socketTask = null
          }
          
          that.setData({
            isConnected: false
          })
          
          wx.showToast({
            title: '连接超时',
            icon: 'none'
          })
        }
      }, 15000)
    })

    // 监听WebSocket消息
    this.socketTask.onMessage((res) => {
      console.log('收到消息:', res.data)
      try {
        const message = JSON.parse(res.data)
        
        // 处理欢迎消息，确认连接成功
        if (message.type === 'welcome') {
          that.receivedWelcome = true
          console.log('✅ 收到欢迎消息，连接已确认')
          
          // 清除超时定时器
          if (that.connectTimeout) {
            clearTimeout(that.connectTimeout)
            that.connectTimeout = null
          }
          
          // 设置连接状态
          that.setData({
            isConnected: true
          })
          
          // 发送初始化消息
          that.socketTask.send({
            data: JSON.stringify({
              type: 'start',
              userId: userInfo.id,
              token: token,
              engineType: that.data.engineType,
              voiceFormat: that.data.voiceFormat,
              needvad: that.data.needvad,
              filterDirty: that.data.filterDirty,
              filterModal: that.data.filterModal,
              convertNumMode: that.data.convertNumMode,
              wordInfo: that.data.wordInfo
            })
          })
          
          return
        }
        
        // 处理其他消息
        that.handleWebSocketMessage(message)
      } catch (err) {
        console.error('解析消息失败', err)
      }
    })

    // 监听WebSocket错误
    this.socketTask.onError((err) => {
      console.error('WebSocket错误', err)
      
      // 清除超时定时器
      if (that.connectTimeout) {
        clearTimeout(that.connectTimeout)
        that.connectTimeout = null
      }
      
      that.setData({
        isConnected: false
      })
      wx.showToast({
        title: '连接异常',
        icon: 'none'
      })
    })

    // 监听WebSocket关闭
    this.socketTask.onClose(() => {
      console.log('WebSocket已关闭')
      
      // 清除超时定时器
      if (that.connectTimeout) {
        clearTimeout(that.connectTimeout)
        that.connectTimeout = null
      }
      
      that.setData({
        isConnected: false
      })
    })

    return true
  },

  /**
   * 处理WebSocket消息
   */
  handleWebSocketMessage(message) {
    console.log('处理消息:', message.type)

    switch (message.type) {
      case 'welcome':
        // 欢迎消息已在 onMessage 中处理，这里不需要再处理
        console.log('收到欢迎消息')
        break

      case 'ready':
        console.log('识别服务就绪')
        this.setData({
          statusText: '识别中...'
        })
        break

      case 'result':
        console.log('识别结果:', message.text)
        this.setData({
          currentText: message.text,
          recognizedText: message.text
        })
        break

      case 'stopped':
        console.log('识别已停止')
        this.setData({
          statusText: '按住说话',
          recognizedText: message.text || this.data.recognizedText
        })
        // 刷新历史记录和统计
        this.loadHistory()
        this.loadStats()
        break

      case 'error':
        console.error('识别错误:', message.message)
        wx.showToast({
          title: message.message || '识别失败',
          icon: 'none'
        })
        this.setData({
          statusText: '按住说话'
        })
        break
    }
  },

  /**
   * 发送音频帧
   */
  sendAudioFrame(frameBuffer, isEnd = false) {
    if (!this.socketTask) {
      return
    }

    // 将ArrayBuffer转为Base64
    const base64 = wx.arrayBufferToBase64(frameBuffer)

    this.socketTask.send({
      data: JSON.stringify({
        type: 'audio',
        data: base64,
        isEnd: isEnd
      })
    })
  },

  /**
   * 按下开始录音（WebSocket流式识别）
   */
  startRecording() {
    console.log('开始录音')

    // 请求录音权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          // 未授权，请求授权
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this._startRecording()
            },
            fail: () => {
              wx.showModal({
                title: '需要录音权限',
                content: '请允许使用录音功能',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        } else {
          this._startRecording()
        }
      }
    })
  },

  /**
   * 执行录音
   */
  _startRecording() {
    // 先连接WebSocket
    if (!this.data.isConnected) {
      if (!this.connectWebSocket()) {
        return
      }
      // 等待连接建立再开始录音
      setTimeout(() => {
        if (this.data.isConnected) {
          this._doStartRecording()
        }
      }, 1000)
    } else {
      this._doStartRecording()
    }
  },

  /**
   * 真正开始录音
   */
  _doStartRecording() {
    this.setData({
      isRecording: true,
      currentText: '',
      statusText: '正在录音...'
    })

    // 开始录音（启用帧录音）
    this.recorderManager.start({
      duration: 60000, // 最长60秒
      sampleRate: 16000, // 16kHz
      numberOfChannels: 1, // 单声道
      encodeBitRate: 48000,
      format: 'pcm', // PCM格式
      frameSize: 10 // 10KB一帧
    })
  },

  /**
   * 松开停止录音
   */
  stopRecording() {
    console.log('停止录音')

    if (!this.data.isRecording) {
      return
    }

    this.setData({
      isRecording: false,
      statusText: '处理中...'
    })

    // 停止录音
    this.recorderManager.stop()

    // 发送停止消息到WebSocket
    if (this.socketTask && this.data.isConnected) {
      this.socketTask.send({
        data: JSON.stringify({
          type: 'stop'
        })
      })
    }
  },

  /**
   * 上传并识别（一句话识别模式）
   */
  uploadAndRecognize(tempFilePath, fileSize) {
    const that = this
    const token = wx.getStorageSync('token')

    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '识别中...'
    })

    wx.uploadFile({
      url: `${apiUrl}/api/realtime-voice/recognize`,
      filePath: tempFilePath,
      name: 'audio',
      header: {
        'token': token
      },
      formData: {
        engineType: that.data.engineType,
        filterDirty: that.data.filterDirty,
        filterModal: that.data.filterModal,
        convertNumMode: that.data.convertNumMode,
        wordInfo: that.data.wordInfo
      },
      success: (res) => {
        wx.hideLoading()
        console.log('上传成功', res)

        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            that.setData({
              recognizedText: data.data.text,
              currentText: data.data.text,
              statusText: '按住说话'
            })

            wx.showToast({
              title: '识别成功',
              icon: 'success'
            })

            // 刷新历史记录
            that.loadHistory()
            that.loadStats()
          } else {
            wx.showToast({
              title: data.message || '识别失败',
              icon: 'none'
            })
            that.setData({
              statusText: '按住说话'
            })
          }
        } catch (err) {
          console.error('解析响应失败', err)
          wx.showToast({
            title: '识别失败',
            icon: 'none'
          })
          that.setData({
            statusText: '按住说话'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败', err)
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        that.setData({
          statusText: '按住说话'
        })
      }
    })
  },

  /**
   * 复制识别结果
   */
  copyText() {
    if (!this.data.recognizedText) {
      wx.showToast({
        title: '没有内容可复制',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: this.data.recognizedText,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 清空结果
   */
  clearText() {
    this.setData({
      recognizedText: '',
      currentText: ''
    })
  },

  /**
   * 加载历史记录
   */
  loadHistory() {
    const that = this
    const token = wx.getStorageSync('token')

    if (!token) return

    wx.request({
      url: `${apiUrl}/api/realtime-voice/history`,
      method: 'GET',
      header: {
        'token': token
      },
      data: {
        page: 1,
        pageSize: 10
      },
      success: (res) => {
        if (res.data.code === 0) {
          that.setData({
            histories: res.data.data.list
          })
        }
      }
    })
  },

  /**
   * 加载统计信息
   */
  loadStats() {
    const that = this
    const token = wx.getStorageSync('token')

    if (!token) return

    wx.request({
      url: `${apiUrl}/api/realtime-voice/stats`,
      method: 'GET',
      header: {
        'token': token
      },
      success: (res) => {
        if (res.data.code === 0) {
          that.setData({
            stats: res.data.data
          })
        }
      }
    })
  },

  /**
   * 查看历史记录详情
   */
  viewHistory(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      recognizedText: item.recognizedText,
      currentText: item.recognizedText
    })
  },

  /**
   * 删除历史记录
   */
  deleteHistory(e) {
    const that = this
    const id = e.currentTarget.dataset.id
    const token = wx.getStorageSync('token')

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${apiUrl}/api/realtime-voice/history/${id}`,
            method: 'DELETE',
            header: {
              'token': token
            },
            success: (res) => {
              if (res.data.code === 0) {
                wx.showToast({
                  title: '已删除',
                  icon: 'success'
                })
                that.loadHistory()
                that.loadStats()
              }
            }
          })
        }
      }
    })
  },

  /**
   * 应用到监理日志
   */
  applyToLog() {
    if (!this.data.recognizedText) {
      wx.showToast({
        title: '没有内容可应用',
        icon: 'none'
      })
      return
    }

    // 将识别结果保存到全局数据
    app.globalData.voiceInputText = this.data.recognizedText

    wx.showToast({
      title: '已保存',
      icon: 'success'
    })

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})

