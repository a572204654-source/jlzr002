/**
 * AI对话API测试
 * 对应文档：docx/c-api/AI对话API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')
const config = require('../config')

/**
 * 运行AI对话测试
 */
async function runAiChatTests() {
  logger.startModule('AI对话API测试')
  
  // 1. 创建新会话
  await testCreateSession()
  
  // 2. 发送消息
  await testSendMessage()
  
  // 3. 获取对话历史
  await testGetHistory()
  
  // 4. 获取会话列表
  await testGetSessions()
  
  // 5. 删除会话
  // await testDeleteSession()
}

/**
 * 测试创建新会话
 */
async function testCreateSession() {
  try {
    const response = await request({
      url: '/api/ai-chat/session',
      method: 'POST',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.sessionId) {
      throw new Error('未返回sessionId')
    }
    
    // 保存会话ID
    config.globalData.sessionId = response.data.sessionId
    
    logger.success('创建新会话', {
      sessionId: response.data.sessionId,
      message: response.message
    })
    
    logger.info(`会话ID已保存: ${response.data.sessionId}`)
  } catch (error) {
    logger.fail('创建新会话', error)
  }
}

/**
 * 测试发送消息
 */
async function testSendMessage() {
  try {
    if (!config.globalData.sessionId) {
      throw new Error('未找到会话ID，请先创建会话')
    }
    
    const response = await request({
      url: '/api/ai-chat/send',
      method: 'POST',
      needAuth: true,
      data: {
        sessionId: config.globalData.sessionId,
        content: '你好，我是一名监理工程师，请帮我优化一下监理日志的编写。'
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.aiReply) {
      throw new Error('未返回AI回复')
    }
    
    if (!response.data.messageId) {
      throw new Error('未返回messageId')
    }
    
    logger.success('发送消息', {
      messageId: response.data.messageId,
      aiReplyLength: response.data.aiReply.length
    })
    
    logger.info(`AI回复: ${response.data.aiReply.substring(0, 50)}...`)
  } catch (error) {
    logger.fail('发送消息', error)
  }
}

/**
 * 测试获取对话历史
 */
async function testGetHistory() {
  try {
    if (!config.globalData.sessionId) {
      throw new Error('未找到会话ID，请先创建会话')
    }
    
    const response = await request({
      url: '/api/ai-chat/history',
      method: 'GET',
      needAuth: true,
      params: {
        sessionId: config.globalData.sessionId,
        page: 1,
        pageSize: 50
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.sessionId) {
      throw new Error('未返回sessionId')
    }
    
    if (typeof response.data.total === 'undefined') {
      throw new Error('未返回总数')
    }
    
    if (!Array.isArray(response.data.list)) {
      throw new Error('list不是数组')
    }
    
    logger.success('获取对话历史', {
      sessionId: response.data.sessionId,
      total: response.data.total,
      count: response.data.list.length
    })
  } catch (error) {
    logger.fail('获取对话历史', error)
  }
}

/**
 * 测试获取会话列表
 */
async function testGetSessions() {
  try {
    const response = await request({
      url: '/api/ai-chat/sessions',
      method: 'GET',
      needAuth: true,
      params: {
        page: 1,
        pageSize: 20
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (typeof response.data.total === 'undefined') {
      throw new Error('未返回总数')
    }
    
    if (!Array.isArray(response.data.list)) {
      throw new Error('list不是数组')
    }
    
    logger.success('获取会话列表', {
      total: response.data.total,
      count: response.data.list.length
    })
  } catch (error) {
    logger.fail('获取会话列表', error)
  }
}

/**
 * 测试删除会话
 */
async function testDeleteSession() {
  try {
    if (!config.globalData.sessionId) {
      throw new Error('未找到会话ID，请先创建会话')
    }
    
    const response = await request({
      url: `/api/ai-chat/session/${config.globalData.sessionId}`,
      method: 'DELETE',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('删除会话', { message: response.message })
    
    // 清除会话ID
    config.globalData.sessionId = null
  } catch (error) {
    logger.fail('删除会话', error)
  }
}

module.exports = { runAiChatTests }

