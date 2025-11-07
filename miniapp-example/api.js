/**
 * 小程序端API接口封装示例
 * 使用方法：将此文件放到小程序项目的 common 目录下
 */

const { get, post, put, del } = require('./request')

/**
 * 认证相关接口
 */
const auth = {
  // 微信小程序登录
  wechatLogin(code) {
    return post('/api/v1/auth/wechat-login', { code })
  }
}

/**
 * 用户相关接口
 */
const user = {
  // 获取当前用户信息
  getMe() {
    return get('/api/v1/users/me')
  },

  // 更新当前用户信息
  updateMe(data) {
    return put('/api/v1/users/me', data)
  },

  // 获取用户列表
  getList(params = {}) {
    return get('/api/v1/users', params)
  },

  // 获取用户详情
  getDetail(id) {
    return get(`/api/v1/users/${id}`)
  },

  // 获取用户统计
  getStats() {
    return get('/api/v1/users/stats')
  }
}

/**
 * 项目相关接口
 */
const project = {
  // 创建项目
  create(data) {
    return post('/api/v1/projects', data)
  },

  // 获取项目列表
  getList(params = {}) {
    return get('/api/v1/projects', params)
  },

  // 获取项目详情
  getDetail(id) {
    return get(`/api/v1/projects/${id}`)
  },

  // 更新项目
  update(id, data) {
    return put(`/api/v1/projects/${id}`, data)
  },

  // 删除项目
  delete(id) {
    return del(`/api/v1/projects/${id}`)
  }
}

/**
 * 工程相关接口
 */
const work = {
  // 创建工程
  create(data) {
    return post('/api/v1/works', data)
  },

  // 获取工程列表
  getList(params = {}) {
    return get('/api/v1/works', params)
  },

  // 获取工程详情
  getDetail(id) {
    return get(`/api/v1/works/${id}`)
  },

  // 更新工程
  update(id, data) {
    return put(`/api/v1/works/${id}`, data)
  },

  // 删除工程
  delete(id) {
    return del(`/api/v1/works/${id}`)
  }
}

/**
 * 监理日志相关接口
 */
const supervisionLog = {
  // 创建监理日志
  create(data) {
    return post('/api/v1/supervision-logs', data)
  },

  // 获取监理日志列表
  getList(params = {}) {
    return get('/api/v1/supervision-logs', params)
  },

  // 获取监理日志详情
  getDetail(id) {
    return get(`/api/v1/supervision-logs/${id}`)
  },

  // 更新监理日志
  update(id, data) {
    return put(`/api/v1/supervision-logs/${id}`, data)
  },

  // 删除监理日志
  delete(id) {
    return del(`/api/v1/supervision-logs/${id}`)
  },

  // 导出Word
  exportWord(id) {
    return get(`/api/v1/supervision-logs/${id}/export`, {}, {
      responseType: 'arraybuffer'
    })
  }
}

/**
 * AI助手相关接口
 */
const aiChat = {
  // 创建会话
  createConversation(data) {
    return post('/api/v1/ai-chat/conversations', data)
  },

  // 获取会话列表
  getConversations(params = {}) {
    return get('/api/v1/ai-chat/conversations', params)
  },

  // 发送消息
  sendMessage(conversationId, data) {
    return post(`/api/v1/ai-chat/conversations/${conversationId}/messages`, data)
  },

  // 获取消息列表
  getMessages(conversationId, params = {}) {
    return get(`/api/v1/ai-chat/conversations/${conversationId}/messages`, params)
  },

  // 删除会话
  deleteConversation(id) {
    return del(`/api/v1/ai-chat/conversations/${id}`)
  }
}

/**
 * 附件相关接口
 */
const attachment = {
  // 上传附件
  upload(data) {
    return post('/api/v1/attachments', data)
  },

  // 获取附件列表
  getList(params = {}) {
    return get('/api/v1/attachments', params)
  },

  // 获取附件详情
  getDetail(id) {
    return get(`/api/v1/attachments/${id}`)
  },

  // 删除附件
  delete(id) {
    return del(`/api/v1/attachments/${id}`)
  },

  // 根据资源获取附件
  getByResource(resourceType, resourceId) {
    return get('/api/v1/attachments/by-resource', {
      resourceType,
      resourceId
    })
  }
}

/**
 * 气象相关接口
 */
const weather = {
  // 获取当前气象
  getCurrent(latitude, longitude) {
    return get('/api/v1/weather/current', {
      latitude,
      longitude
    })
  }
}

module.exports = {
  auth,
  user,
  project,
  work,
  supervisionLog,
  aiChat,
  attachment,
  weather
}
