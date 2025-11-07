/**
 * 用户模块测试
 * 测试接口：
 * - GET /api/v1/user/info - 获取用户信息
 * - PUT /api/v1/user/info - 更新用户信息
 * - GET /api/v1/user/projects - 获取用户项目列表
 * - GET /api/v1/user/log-stats - 获取用户日志统计
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
require('dotenv').config()

/**
 * 测试1: 获取用户信息（V1版本）
 */
async function testGetUserInfo() {
  logger.module('测试1: 获取用户信息（V1版本）')
  
  try {
    const response = await http.get('/api/v1/user/info')
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取用户信息成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含id字段')
    assert.assertHasField(response.data, 'nickname', '包含nickname字段')
    assert.assertHasField(response.data, 'stats', '包含stats字段')
    
    if (response.data.stats) {
      assert.assertHasField(response.data.stats, 'projectCount', '包含项目数量')
      assert.assertHasField(response.data.stats, 'logCount', '包含日志总数')
      assert.assertHasField(response.data.stats, 'monthLogCount', '包含本月日志数')
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取用户信息测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 更新用户信息（V1版本）
 */
async function testUpdateUserInfo() {
  logger.module('测试2: 更新用户信息（V1版本）')
  
  try {
    const updateData = {
      nickname: '测试用户_' + Date.now(),
      organization: '测试监理公司'
    }
    
    logger.info('请求参数', updateData)
    
    const response = await http.put('/api/v1/user/info', updateData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '更新用户信息成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('更新用户信息测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试3: 获取用户项目列表（V1版本）
 */
async function testGetUserProjects() {
  logger.module('测试3: 获取用户项目列表（V1版本）')
  
  try {
    const response = await http.get('/api/v1/user/projects')
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取用户项目列表成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'list', '包含list字段')
    
    if (response.data.list && response.data.list.length > 0) {
      logger.success(`获取到 ${response.data.list.length} 个项目`)
    } else {
      logger.warn('用户暂无项目')
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取用户项目列表测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试4: 获取用户日志统计（V1版本）
 */
async function testGetUserLogStats() {
  logger.module('测试4: 获取用户日志统计（V1版本）')
  
  try {
    const params = {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
    
    logger.info('请求参数', params)
    
    const response = await http.get('/api/v1/user/log-stats', params)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取用户日志统计成功')
    assert.assertExists(response.data, '返回数据存在')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取用户日志统计测试失败', error)
    logger.divider()
    return false
  }
}


/**
 * 运行所有用户模块测试
 */
async function runAllTests() {
  logger.title('用户模块测试')
  
  const results = []
  
  // V1版本接口测试
  results.push(await testGetUserInfo())
  results.push(await testUpdateUserInfo())
  results.push(await testGetUserProjects())
  results.push(await testGetUserLogStats())
  
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
    module: '用户模块',
    total: results.length,
    passed,
    failed
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
  runAllTests
}

