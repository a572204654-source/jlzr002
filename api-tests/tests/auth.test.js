/**
 * 认证模块测试
 * 测试接口：
 * - POST /api/v1/auth/wechat-login - 微信登录
 * - POST /api/v1/auth/logout - 退出登录
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
require('dotenv').config()

// 测试数据存储
const testData = {}

/**
 * 测试1: 微信登录（V1版本）
 */
async function testWechatLogin() {
  logger.module('测试1: 微信登录（V1版本）')
  
  try {
    // 使用测试code（文档说明支持test_wechat_code_开头的测试code）
    const code = process.env.WECHAT_CODE || 'test_wechat_code_123456'
    
    logger.info('请求参数', { code })
    
    const response = await http.post('/api/v1/auth/wechat-login', { code })
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '登录接口调用成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'token', '包含token字段')
    assert.assertHasField(response.data, 'userInfo', '包含userInfo字段')
    assert.assertHasField(response.data, 'isNewUser', '包含isNewUser字段')
    
    // 保存token供后续测试使用
    if (response.data.token) {
      testData.token = response.data.token
      testData.userId = response.data.userInfo.id
      testData.openid = response.data.userInfo.openid
      http.setToken(response.data.token)
      logger.success('Token已保存，供后续测试使用')
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('微信登录测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 退出登录（V1版本）
 */
async function testLogout() {
  logger.module('测试2: 退出登录（V1版本）')
  
  try {
    logger.info('当前token', { token: testData.token ? '已设置' : '未设置' })
    
    const response = await http.post('/api/v1/auth/logout')
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '退出登录成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('退出登录测试失败', error)
    logger.divider()
    return false
  }
}


/**
 * 运行所有认证模块测试
 */
async function runAllTests() {
  logger.title('认证模块测试')
  
  const results = []
  
  // 测试1: 微信登录
  results.push(await testWechatLogin())
  
  // 测试2: 退出登录（需要先登录）
  if (testData.token) {
    results.push(await testLogout())
    
    // 重新登录以便后续模块测试使用
    await testWechatLogin()
  }
  
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
    module: '认证模块',
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

