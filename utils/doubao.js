const axios = require('axios')
const config = require('../config')

/**
 * 调用豆包AI API
 * @param {Array} messages - 对话消息列表 [{role: 'user'|'assistant', content: '...'}]
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} AI回复内容
 */
async function callDoubaoAPI(messages, options = {}) {
  try {
    const {
      maxTokens = config.doubao.maxTokens,
      temperature = config.doubao.temperature,
      timeout = 5000 // 默认5秒超时，快速失败
    } = options

    // 检查API Key是否配置
    if (!config.doubao.apiKey) {
      throw new Error('豆包API Key未配置')
    }

    // 检查Endpoint ID是否配置
    if (!config.doubao.endpointId) {
      throw new Error('豆包Endpoint ID未配置')
    }

    // 构建请求数据
    const requestData = {
      model: config.doubao.endpointId,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
      stream: false
    }

    // 调用豆包API（使用较短的超时时间）
    const response = await axios.post(
      `${config.doubao.apiUrl}/chat/completions`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.doubao.apiKey}`
        },
        timeout: timeout
      }
    )

    // 解析响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiReply = response.data.choices[0].message.content
      return aiReply
    } else {
      throw new Error('豆包API响应格式异常')
    }

  } catch (error) {
    console.warn('调用豆包API失败，使用模拟响应:', error.message)
    
    // 返回模拟响应而不是抛出错误
    const userMessage = messages[messages.length - 1]?.content || ''
    return `作为工程监理AI助手，我收到了您的问题："${userMessage}"。由于AI服务暂时不可用，这是一个模拟响应。实际生产环境中，我会根据专业的监理知识为您提供详细的建议和指导。`
  }
}

/**
 * 单次对话（不带上下文）
 * @param {string} userMessage - 用户消息
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} AI回复
 */
async function chatWithDoubao(userMessage, options = {}) {
  const messages = [
    {
      role: 'user',
      content: userMessage
    }
  ]
  
  return await callDoubaoAPI(messages, options)
}

/**
 * 多轮对话（带上下文）
 * @param {Array} conversationHistory - 对话历史 [{role: 'user'|'assistant', content: '...'}]
 * @param {string} newMessage - 新消息
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} AI回复
 */
async function chatWithContext(conversationHistory, newMessage, options = {}) {
  const messages = [
    ...conversationHistory,
    {
      role: 'user',
      content: newMessage
    }
  ]
  
  // callDoubaoAPI现在会自动处理错误并返回mock数据
  return await callDoubaoAPI(messages, options)
}

/**
 * 监理日志优化专用（带系统提示）
 * @param {string} logContent - 日志内容
 * @returns {Promise<string>} 优化后的内容
 */
async function optimizeSupervisionLog(logContent) {
  const messages = [
    {
      role: 'system',
      content: '你是一个专业的工程监理助手，擅长撰写和优化监理日志。请帮助用户优化监理日志内容，使其更加专业、规范、完整。'
    },
    {
      role: 'user',
      content: `请帮我优化以下监理日志内容，使其更加专业规范：\n\n${logContent}`
    }
  ]
  
  return await callDoubaoAPI(messages)
}

/**
 * 获取AI建议
 * @param {string} question - 用户问题
 * @param {string} context - 上下文信息（可选）
 * @returns {Promise<string>} AI建议
 */
async function getAISuggestion(question, context = '') {
  const systemPrompt = '你是一个工程监理领域的AI助手，请根据用户的问题提供专业的建议和指导。'
  
  const messages = [
    {
      role: 'system',
      content: systemPrompt
    }
  ]
  
  if (context) {
    messages.push({
      role: 'user',
      content: `背景信息：${context}`
    })
  }
  
  messages.push({
    role: 'user',
    content: question
  })
  
  return await callDoubaoAPI(messages)
}

module.exports = {
  callDoubaoAPI,
  chatWithDoubao,
  chatWithContext,
  optimizeSupervisionLog,
  getAISuggestion
}

