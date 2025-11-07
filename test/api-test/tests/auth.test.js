/**
 * 认证API测试
 * 对应文档：docx/c-api/认证API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')
const config = require('../config')

/**
 * 运行认证测试
 */
async function runAuthTests() {
  logger.startModule('认证API测试')
  
  // 1. 测试微信登录
  await testWechatLogin()
  
  // 2. 测试退出登录
  await testLogout()
}

/**
 * 测试微信登录（使用测试接口）
 */
async function testWechatLogin() {
  try {
    const response = await request({
      url: '/api/auth/test-login',
      method: 'POST',
      data: {
        openid: config.testOpenid
      }
    })
    
    // 验证响应格式
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.token) {
      throw new Error('未返回token')
    }
    
    if (!response.data.userInfo) {
      throw new Error('未返回userInfo')
    }
    
    // 保存token到全局变量
    global.testToken = response.data.token
    config.globalData.token = response.data.token
    config.globalData.userId = response.data.userInfo.id
    
    logger.success('测试登录', {
      token: response.data.token.substring(0, 20) + '...',
      userId: response.data.userInfo.id,
      nickname: response.data.userInfo.nickname
    })
    
    logger.info(`Token已保存，用户ID: ${response.data.userInfo.id}`)
  } catch (error) {
    logger.fail('测试登录', error)
  }
}

/**
 * 测试退出登录
 */
async function testLogout() {
  try {
    const response = await request({
      url: '/api/auth/logout',
      method: 'POST',
      needAuth: true
    })
    
    // 验证响应格式
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('退出登录', { message: response.message })
    
    // 注意：这里不清除token，因为后续测试还需要使用
    logger.info('Token保留用于后续测试')
  } catch (error) {
    logger.fail('退出登录', error)
  }
}

module.exports = { runAuthTests }

