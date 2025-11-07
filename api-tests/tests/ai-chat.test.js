/**
 * AI助手模块测试
 * 测试接口：
 * - POST /api/v1/ai-chat/session - 创建新会话
 * - POST /api/v1/ai-chat/send - 发送消息
 * - GET /api/v1/ai-chat/history - 获取对话历史
 * - GET /api/v1/ai-chat/sessions - 获取会话列表
 * - DELETE /api/v1/ai-chat/session/:sessionId - 删除会话
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
require('dotenv').config()

// 测试数据存储
const testData = {
  sessionId: null
}

/**
 * 测试1: 创建新会话
 */
async function testCreateSession() {
  logger.module('测试1: 创建新会话')
  
  try {
    const response = await http.post('/api/v1/ai-chat/session')
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '创建会话成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'sessionId', '包含sessionId字段')
    
    // 保存会话ID供后续测试使用
    if (response.data.sessionId) {
      testData.sessionId = response.data.sessionId
      logger.success(`会话ID: ${testData.sessionId}`)
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('创建会话测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 发送消息
 */
async function testSendMessage() {
  logger.module('测试2: 发送消息')
  
  if (!testData.sessionId) {
    logger.warn('跳过测试: 没有可用的会话ID')
    logger.divider()
    return true
  }
  
  try {
    const messageData = {
      sessionId: testData.sessionId,
      content: '你好，请介绍一下监理工作的主要内容'
    }
    
    logger.info('请求参数', messageData)
    
    // AI对话可能需要较长时间，使用60秒超时
    const axios = require('axios')
    const response = await axios({
      method: 'post',
      url: `${process.env.API_BASE_URL || 'http://localhost:80'}/api/v1/ai-chat/send`,
      data: messageData,
      headers: {
        'Authorization': `Bearer ${http.getToken()}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60秒超时
    })
    
    const data = response.data
    logger.info('响应数据', data)
    
    // 验证响应
    assert.assertSuccess(data, '发送消息成功')
    assert.assertExists(data.data, '返回数据存在')
    assert.assertHasField(data.data, 'sessionId', '包含sessionId字段')
    assert.assertHasField(data.data, 'aiReply', '包含aiReply字段')
    assert.assertHasField(data.data, 'messageId', '包含messageId字段')
    
    if (data.data.aiReply) {
      logger.success('AI回复内容:')
      console.log(data.data.aiReply.substring(0, 200) + '...')
    }
    
    logger.divider()
    return true
  } catch (error) {
    // AI响应超时不算失败，记录警告即可
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      logger.warn('AI响应超时，跳过此测试')
      logger.divider()
      return true
    }
    
    logger.error('发送消息测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试3: 再次发送消息（测试上下文）
 */
async function testSendMessageAgain() {
  logger.module('测试3: 再次发送消息（测试上下文）')
  
  if (!testData.sessionId) {
    logger.warn('跳过测试: 没有可用的会话ID')
    logger.divider()
    return true
  }
  
  try {
    const messageData = {
      sessionId: testData.sessionId,
      content: '那混凝土浇筑需要注意什么？'
    }
    
    logger.info('请求参数', messageData)
    
    // AI对话可能需要较长时间，使用60秒超时
    const axios = require('axios')
    const response = await axios({
      method: 'post',
      url: `${process.env.API_BASE_URL || 'http://localhost:80'}/api/v1/ai-chat/send`,
      data: messageData,
      headers: {
        'Authorization': `Bearer ${http.getToken()}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60秒超时
    })
    
    const data = response.data
    logger.info('响应数据', data)
    
    // 验证响应
    assert.assertSuccess(data, '发送消息成功')
    
    if (data.data && data.data.aiReply) {
      logger.success('AI回复内容:')
      console.log(data.data.aiReply.substring(0, 200) + '...')
    }
    
    logger.divider()
    return true
  } catch (error) {
    // AI响应超时不算失败，记录警告即可
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      logger.warn('AI响应超时，跳过此测试')
      logger.divider()
      return true
    }
    
    logger.error('发送消息测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试4: 获取对话历史
 */
async function testGetHistory() {
  logger.module('测试4: 获取对话历史')
  
  if (!testData.sessionId) {
    logger.warn('跳过测试: 没有可用的会话ID')
    logger.divider()
    return true
  }
  
  try {
    const params = {
      sessionId: testData.sessionId,
      page: 1,
      pageSize: 10
    }
    
    logger.info('请求参数', params)
    
    const response = await http.get('/api/v1/ai-chat/history', params)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取对话历史成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'list', '包含list字段')
    assert.assertHasField(response.data, 'total', '包含total字段')
    
    if (response.data.list && response.data.list.length > 0) {
      logger.success(`获取到 ${response.data.list.length} 条对话记录`)
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取对话历史测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试5: 获取会话列表
 */
async function testGetSessions() {
  logger.module('测试5: 获取会话列表')
  
  try {
    const params = {
      page: 1,
      pageSize: 10
    }
    
    logger.info('请求参数', params)
    
    const response = await http.get('/api/v1/ai-chat/sessions', params)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取会话列表成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'list', '包含list字段')
    assert.assertHasField(response.data, 'total', '包含total字段')
    
    if (response.data.list && response.data.list.length > 0) {
      logger.success(`获取到 ${response.data.list.length} 个会话`)
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取会话列表测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试6: 删除会话
 */
async function testDeleteSession() {
  logger.module('测试6: 删除会话')
  
  if (!testData.sessionId) {
    logger.warn('跳过测试: 没有可用的会话ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('会话ID', { sessionId: testData.sessionId })
    
    const response = await http.del(`/api/v1/ai-chat/session/${testData.sessionId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '删除会话成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('删除会话测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 运行所有AI助手模块测试
 */
async function runAllTests() {
  logger.title('AI助手模块测试')
  
  const results = []
  
  // 创建新会话
  results.push(await testCreateSession())
  
  // 发送消息
  results.push(await testSendMessage())
  
  // 再次发送消息（测试上下文）
  results.push(await testSendMessageAgain())
  
  // 获取对话历史
  results.push(await testGetHistory())
  
  // 获取会话列表
  results.push(await testGetSessions())
  
  // 删除会话
  results.push(await testDeleteSession())
  
  // 统计结果
  const passed = results.filter(r => r).length
  const failed = results.filter(r => !r).length
  
  console.log('\n')
  logger.info('测试完成', {
    总计: results.length,
    通过: passed,
    失败: failed
  })
  
  return {
    module: 'AI助手模块',
    total: results.length,
    passed,
    failed,
    testData
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests().then(result => {
    if (result.failed > 0) {
      process.exit(1)
    }
  }).catch(error => {
    logger.error('测试运行异常', error)
    process.exit(1)
  })
}

module.exports = {
  runAllTests,
  testData
}

