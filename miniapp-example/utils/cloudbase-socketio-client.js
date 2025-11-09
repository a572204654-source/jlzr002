/**
 * 微信云托管 Socket.IO 客户端
 * 
 * 使用 wx.cloud.connectContainer 实现 Socket.IO 连接
 * 手动实现 Engine.IO 和 Socket.IO 协议
 * 
 * 基于：https://blog.csdn.net/z329600208z/article/details/153698728
 */

/**
 * Engine.IO 数据包类型
 */
const ENGINE_PACKET_TYPES = {
  OPEN: '0',
  CLOSE: '1',
  PING: '2',
  PONG: '3',
  MESSAGE: '4',
  UPGRADE: '5',
  NOOP: '6'
}

/**
 * Socket.IO 数据包类型
 */
const SOCKET_PACKET_TYPES = {
  CONNECT: '0',
  DISCONNECT: '1',
  EVENT: '2',
  ACK: '3',
  CONNECT_ERROR: '4',
  BINARY_EVENT: '5',
  BINARY_ACK: '6'
}

class CloudBaseSocketIOClient {
  constructor(options = {}) {
    this.service = options.service // 云托管服务名称
    this.namespace = options.namespace || '/' // Socket.IO 命名空间
    this.debug = options.debug || false
    
    this.container = null // WebSocket 连接实例
    this._isConnected = false // 是否已连接
    this._manuallyClosed = false // 是否手动关闭
    this._reconnectDelay = options.reconnectDelay || 3000 // 重连延迟
    this._pingInterval = null // 心跳定时器
    this._eventHandlers = {} // 事件处理器
    this._internalHandlers = {} // 内部事件处理器
  }

  /**
   * 连接到云托管容器
   */
  async connect(service) {
    this.service = service || this.service
    this._manuallyClosed = false

    if (!this.service) {
      throw new Error('缺少 service 参数')
    }

    try {
      // 连接云托管容器
      const { socketTask } = await wx.cloud.connectContainer({
        service: this.service,
        path: `/socket.io/?transport=websocket&namespace=${encodeURIComponent(this.namespace)}&EIO=4`
      })

      this.container = socketTask
      console.log('云托管容器 WebSocket 连接成功')

      // 监听 WebSocket 打开事件
      this.container.onOpen(() => {
        this._isConnected = true
        console.log('WebSocket 连接已建立，发送 Socket.IO CONNECT 包 (40)')

        // 发送 Socket.IO CONNECT 包: Engine.IO 类型 4 (MESSAGE) + Socket.IO 类型 0 (CONNECT)
        const connectPacket = '40' // 连接根命名空间 '/'
        this._sendSocketIOPacketRaw(connectPacket)
      })

      // 监听 WebSocket 消息事件
      this.container.onMessage((res) => {
        if (this.debug) {
          console.log('收到原始 WebSocket 消息:', res)
        }
        this._handleSocketIOMessage(res)
      })

      // 监听 WebSocket 关闭事件
      this.container.onClose(() => {
        console.log('WebSocket 连接已关闭')
        this._isConnected = false
        this._emitInternal('ws_close', {})

        // 停止心跳
        if (this._pingInterval) {
          clearInterval(this._pingInterval)
          this._pingInterval = null
        }

        // 非主动断开，尝试自动重连
        if (!this._manuallyClosed) {
          setTimeout(() => {
            if (this._manuallyClosed) return
            console.log('尝试重新连接...')
            this.connect(this.service)
          }, this._reconnectDelay)
        }
      })

      // 监听 WebSocket 错误事件
      this.container.onError((err) => {
        console.error('WebSocket 连接发生错误:', err)
        this._emitInternal('ws_error', err)
      })

      return this

    } catch (error) {
      console.error('连接云托管容器失败:', error)
      throw error
    }
  }

  /**
   * 处理 Socket.IO 消息
   */
  _handleSocketIOMessage(res) {
    try {
      const message = typeof res.data === 'string' ? res.data : res.data.toString()
      
      if (this.debug) {
        console.log('处理 Socket.IO 消息:', message)
      }

      // Engine.IO 包类型（第一个字符）
      const engineType = message[0]
      
      // 处理 Engine.IO OPEN 包（连接初始化）
      if (engineType === ENGINE_PACKET_TYPES.OPEN) {
        console.log('收到 Engine.IO OPEN 包')
        const openData = JSON.parse(message.substring(1))
        console.log('Engine.IO 配置:', openData)

        // 启动心跳
        if (openData.pingInterval) {
          this._startPing(openData.pingInterval)
        }
        return
      }

      // 处理 Engine.IO PONG 包（心跳响应）
      if (engineType === ENGINE_PACKET_TYPES.PONG) {
        if (this.debug) {
          console.log('收到 Engine.IO PONG')
        }
        return
      }

      // 处理 Engine.IO MESSAGE 包
      if (engineType === ENGINE_PACKET_TYPES.MESSAGE) {
        // Socket.IO 包类型（第二个字符）
        const socketType = message[1]
        const payload = message.substring(2)

        // Socket.IO CONNECT 响应
        if (socketType === SOCKET_PACKET_TYPES.CONNECT) {
          console.log('Socket.IO 连接成功')
          this._emitInternal('connect', {})
          return
        }

        // Socket.IO EVENT 事件
        if (socketType === SOCKET_PACKET_TYPES.EVENT) {
          const eventData = JSON.parse(payload)
          const [eventName, ...args] = eventData
          console.log('收到 Socket.IO 事件:', eventName, args)
          this._emit(eventName, ...args)
          return
        }

        // Socket.IO DISCONNECT
        if (socketType === SOCKET_PACKET_TYPES.DISCONNECT) {
          console.log('Socket.IO 断开连接')
          this._emitInternal('disconnect', {})
          return
        }

        // Socket.IO CONNECT_ERROR
        if (socketType === SOCKET_PACKET_TYPES.CONNECT_ERROR) {
          const errorData = JSON.parse(payload)
          console.error('Socket.IO 连接错误:', errorData)
          this._emitInternal('connect_error', errorData)
          return
        }
      }

    } catch (error) {
      console.error('处理 Socket.IO 消息失败:', error)
    }
  }

  /**
   * 启动心跳
   */
  _startPing(interval) {
    // 停止已有的心跳
    if (this._pingInterval) {
      clearInterval(this._pingInterval)
    }

    // 启动新的心跳
    this._pingInterval = setInterval(() => {
      if (this._isConnected && this.container) {
        if (this.debug) {
          console.log('发送 Engine.IO PING')
        }
        this.container.send({
          data: ENGINE_PACKET_TYPES.PING
        })
      }
    }, interval)
  }

  /**
   * 发送原始 Socket.IO 数据包
   */
  _sendSocketIOPacketRaw(packet) {
    if (!this._isConnected || !this.container) {
      console.error('WebSocket 未连接，无法发送消息')
      return
    }

    if (this.debug) {
      console.log('发送原始 Socket.IO 包:', packet)
    }

    this.container.send({
      data: packet
    })
  }

  /**
   * 发送 Socket.IO 事件
   */
  emit(eventName, ...args) {
    if (!this._isConnected || !this.container) {
      console.error('WebSocket 未连接，无法发送事件')
      return
    }

    // 构造 Socket.IO EVENT 包
    // 格式: Engine.IO MESSAGE (4) + Socket.IO EVENT (2) + JSON 数组
    const eventData = [eventName, ...args]
    const packet = ENGINE_PACKET_TYPES.MESSAGE + SOCKET_PACKET_TYPES.EVENT + JSON.stringify(eventData)

    if (this.debug) {
      console.log('发送 Socket.IO 事件:', eventName, args, '包:', packet)
    }

    this.container.send({
      data: packet
    })
  }

  /**
   * 监听 Socket.IO 事件
   */
  on(eventName, handler) {
    if (!this._eventHandlers[eventName]) {
      this._eventHandlers[eventName] = []
    }
    this._eventHandlers[eventName].push(handler)
  }

  /**
   * 移除事件监听器
   */
  off(eventName, handler) {
    if (!this._eventHandlers[eventName]) {
      return
    }

    if (handler) {
      this._eventHandlers[eventName] = this._eventHandlers[eventName].filter(h => h !== handler)
    } else {
      delete this._eventHandlers[eventName]
    }
  }

  /**
   * 触发事件
   */
  _emit(eventName, ...args) {
    if (this._eventHandlers[eventName]) {
      this._eventHandlers[eventName].forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`事件处理器错误 (${eventName}):`, error)
        }
      })
    }
  }

  /**
   * 监听内部事件（connect, disconnect, ws_close, ws_error 等）
   */
  onInternal(eventName, handler) {
    if (!this._internalHandlers[eventName]) {
      this._internalHandlers[eventName] = []
    }
    this._internalHandlers[eventName].push(handler)
  }

  /**
   * 触发内部事件
   */
  _emitInternal(eventName, ...args) {
    if (this._internalHandlers[eventName]) {
      this._internalHandlers[eventName].forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`内部事件处理器错误 (${eventName}):`, error)
        }
      })
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this._manuallyClosed = true
    
    // 停止心跳
    if (this._pingInterval) {
      clearInterval(this._pingInterval)
      this._pingInterval = null
    }

    // 发送 Socket.IO DISCONNECT 包
    if (this._isConnected && this.container) {
      const disconnectPacket = ENGINE_PACKET_TYPES.MESSAGE + SOCKET_PACKET_TYPES.DISCONNECT
      this._sendSocketIOPacketRaw(disconnectPacket)
    }

    // 关闭 WebSocket
    if (this.container) {
      this.container.close({
        success: () => {
          console.log('WebSocket 已主动关闭')
        }
      })
      this.container = null
    }

    this._isConnected = false
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this._isConnected
  }
}

module.exports = CloudBaseSocketIOClient

