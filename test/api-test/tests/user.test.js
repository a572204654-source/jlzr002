/**
 * 用户API测试
 * 对应文档：docx/c-api/用户API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')

/**
 * 运行用户测试
 */
async function runUserTests() {
  logger.startModule('用户API测试')
  
  // 1. 获取用户信息
  await testGetUserInfo()
  
  // 2. 更新用户信息
  await testUpdateUserInfo()
  
  // 3. 获取用户项目列表
  await testGetUserProjects()
  
  // 4. 获取用户日志统计
  await testGetLogStats()
}

/**
 * 测试获取用户信息
 */
async function testGetUserInfo() {
  try {
    const response = await request({
      url: '/api/user/info',
      method: 'GET',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回用户ID')
    }
    
    if (!response.data.stats) {
      throw new Error('未返回统计信息')
    }
    
    logger.success('获取用户信息', {
      id: response.data.id,
      nickname: response.data.nickname,
      organization: response.data.organization,
      projectCount: response.data.stats.projectCount,
      logCount: response.data.stats.logCount
    })
  } catch (error) {
    logger.fail('获取用户信息', error)
  }
}

/**
 * 测试更新用户信息
 */
async function testUpdateUserInfo() {
  try {
    const response = await request({
      url: '/api/user/info',
      method: 'PUT',
      needAuth: true,
      data: {
        nickname: '测试用户_' + Date.now(),
        organization: '测试监理机构'
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('更新用户信息', { message: response.message })
  } catch (error) {
    logger.fail('更新用户信息', error)
  }
}

/**
 * 测试获取用户项目列表
 */
async function testGetUserProjects() {
  try {
    const response = await request({
      url: '/api/user/projects',
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
    
    logger.success('获取用户项目列表', {
      total: response.data.total,
      count: response.data.list.length
    })
  } catch (error) {
    logger.fail('获取用户项目列表', error)
  }
}

/**
 * 测试获取用户日志统计
 */
async function testGetLogStats() {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7)
    
    const response = await request({
      url: '/api/user/log-stats',
      method: 'GET',
      needAuth: true,
      params: {
        month: currentMonth
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (typeof response.data.monthCount === 'undefined') {
      throw new Error('未返回monthCount')
    }
    
    if (typeof response.data.totalCount === 'undefined') {
      throw new Error('未返回totalCount')
    }
    
    logger.success('获取用户日志统计', {
      month: currentMonth,
      monthCount: response.data.monthCount,
      totalCount: response.data.totalCount,
      passRate: response.data.passRate
    })
  } catch (error) {
    logger.fail('获取用户日志统计', error)
  }
}

module.exports = { runUserTests }

