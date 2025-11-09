const app = getApp()
const CloudBaseSocketIOClient = require('../../utils/cloudbase-socketio-client')

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
    wordInfo: 2,

    // 云托管配置
    service: 'your-service-name' // 替换为你的云托管服务名称
  },

  onLoad() {
    console.log('实时语音识别页面加载（云托管版本）')
    this.recorderManager = wx.getRecorderManager()
    this.socketClient = null
    this.initRecorder()
    this.loadHistory()
    this.loadStats()
  },

  onUnload() {
    console.log('页面卸载，清理资源')
    this.stopRecording()
    if (this.socketClient) {
      this.socketClient.disconnect()
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

    // 录音停止
    this.recorderManager.onStop((res) => {
      console.log('录音已停止', res)
      that.setData({
        statusText: '处理中...'
      })
    })

    // 录音帧数据
    this.recorderManager.onFrameRecorded((res) => {
      const { frameBuffer } = res
      // 发送到 Socket.IO 进行实时识别
      if (that.data.isConnected && that.socketClient) {
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
   * 连接 Socket.IO
   */
  async connectSocketIO() {
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

    try {
      // 创建 Socket.IO 客户端
      this.socketClient = new CloudBaseSocketIOClient({
        service: this.data.service,
        namespace: '/realtime-voice', // Socket.IO 命名空间
        debug: true // 开启调试日志
      })

      // 监听连接成功事件
      this.socketClient.onInternal('connect', () => {
        console.log('Socket.IO 连接成功')
        that.setData({
          isConnected: true
        })

        // 发送 start 事件初始化识别服务
        that.socketClient.emit('start', {
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

      // 监听断开连接事件
      this.socketClient.onInternal('disconnect', () => {
        console.log('Socket.IO 断开连接')
        that.setData({
          isConnected: false
        })
      })

      // 监听连接错误事件
      this.socketClient.onInternal('connect_error', (error) => {
        console.error('Socket.IO 连接错误', error)
        wx.showToast({
          title: '连接失败',
          icon: 'none'
        })
      })

      // 监听服务就绪事件
      this.socketClient.on('ready', (data) => {
        console.log('识别服务就绪:', data)
        that.setData({
          statusText: '识别中...'
        })
      })

      // 监听识别结果事件
      this.socketClient.on('result', (data) => {
        console.log('识别结果:', data)
        that.setData({
          currentText: data.text,
          recognizedText: data.text
        })
      })

      // 监听停止事件
      this.socketClient.on('stopped', (data) => {
        console.log('识别已停止:', data)
        that.setData({
          statusText: '按住说话',
          recognizedText: data.text || that.data.recognizedText
        })
        // 刷新历史记录和统计
        that.loadHistory()
        that.loadStats()
      })

      // 监听错误事件
      this.socketClient.on('error', (data) => {
        console.error('识别错误:', data)
        wx.showToast({
          title: data.message || '识别失败',
          icon: 'none'
        })
        that.setData({
          statusText: '按住说话'
        })
      })

      // 连接到云托管容器
      await this.socketClient.connect()
      console.log('正在连接到云托管容器...')

      return true

    } catch (error) {
      console.error('连接失败:', error)
      wx.showToast({
        title: '连接失败',
        icon: 'none'
      })
      return false
    }
  },

  /**
   * 发送音频帧
   */
  sendAudioFrame(frameBuffer, isEnd = false) {
    if (!this.socketClient || !this.data.isConnected) {
      return
    }

    // 将ArrayBuffer转为Base64
    const base64 = wx.arrayBufferToBase64(frameBuffer)

    this.socketClient.emit('audio', {
      data: base64,
      isEnd: isEnd
    })
  },

  /**
   * 按下开始录音（Socket.IO 流式识别）
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
  async _startRecording() {
    // 先连接 Socket.IO
    if (!this.data.isConnected) {
      const connected = await this.connectSocketIO()
      if (!connected) {
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

    // 发送停止消息到 Socket.IO
    if (this.socketClient && this.data.isConnected) {
      this.socketClient.emit('stop')
    }
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
    const apiUrl = app.globalData.apiUrl

    if (!token) return

    wx.request({
      url: `${apiUrl}/api/realtime-voice-socketio/history`,
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
    const apiUrl = app.globalData.apiUrl

    if (!token) return

    wx.request({
      url: `${apiUrl}/api/realtime-voice-socketio/stats`,
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
    const apiUrl = app.globalData.apiUrl

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${apiUrl}/api/realtime-voice-socketio/history/${id}`,
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

