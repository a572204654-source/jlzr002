/**
 * 工程管理API测试
 * 对应文档：docx/c-api/工程管理API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')
const config = require('../config')

/**
 * 运行工程测试
 */
async function runWorkTests() {
  logger.startModule('工程管理API测试')
  
  // 1. 新增工程
  await testCreateWork()
  
  // 2. 获取工程列表
  await testGetWorks()
  
  // 3. 获取工程详情
  await testGetWorkDetail()
  
  // 4. 编辑工程
  await testUpdateWork()
  
  // 5. 删除工程（最后测试，因为会删除数据）
  // await testDeleteWork()
}

/**
 * 测试新增工程
 */
async function testCreateWork() {
  try {
    if (!config.globalData.projectId) {
      throw new Error('未找到项目ID，请先创建项目')
    }
    
    const timestamp = Date.now()
    const response = await request({
      url: '/api/works',
      method: 'POST',
      needAuth: true,
      data: {
        projectId: config.globalData.projectId,
        workName: `测试工程_${timestamp}`,
        workCode: `TEST-WORK-${timestamp}`,
        unitWork: '测试单位工程',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        color: '#0d9488',
        description: '这是一个测试工程'
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回工程ID')
    }
    
    // 保存工程ID
    config.globalData.workId = response.data.id
    
    logger.success('新增工程', {
      id: response.data.id,
      message: response.message
    })
    
    logger.info(`工程ID已保存: ${response.data.id}`)
  } catch (error) {
    logger.fail('新增工程', error)
  }
}

/**
 * 测试获取工程列表
 */
async function testGetWorks() {
  try {
    const params = {
      page: 1,
      pageSize: 20
    }
    
    // 如果有项目ID，添加项目筛选
    if (config.globalData.projectId) {
      params.projectId = config.globalData.projectId
    }
    
    const response = await request({
      url: '/api/works',
      method: 'GET',
      needAuth: true,
      params
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
    
    logger.success('获取工程列表', {
      total: response.data.total,
      count: response.data.list.length,
      page: response.data.page,
      pageSize: response.data.pageSize
    })
  } catch (error) {
    logger.fail('获取工程列表', error)
  }
}

/**
 * 测试获取工程详情
 */
async function testGetWorkDetail() {
  try {
    if (!config.globalData.workId) {
      throw new Error('未找到工程ID，请先创建工程')
    }
    
    const response = await request({
      url: `/api/works/${config.globalData.workId}`,
      method: 'GET',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回工程详情')
    }
    
    logger.success('获取工程详情', {
      id: response.data.id,
      workName: response.data.workName,
      workCode: response.data.workCode,
      projectName: response.data.projectName
    })
  } catch (error) {
    logger.fail('获取工程详情', error)
  }
}

/**
 * 测试编辑工程
 */
async function testUpdateWork() {
  try {
    if (!config.globalData.workId) {
      throw new Error('未找到工程ID，请先创建工程')
    }
    
    const response = await request({
      url: `/api/works/${config.globalData.workId}`,
      method: 'PUT',
      needAuth: true,
      data: {
        description: '更新后的工程描述_' + Date.now()
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('编辑工程', { message: response.message })
  } catch (error) {
    logger.fail('编辑工程', error)
  }
}

/**
 * 测试删除工程
 */
async function testDeleteWork() {
  try {
    if (!config.globalData.workId) {
      throw new Error('未找到工程ID，请先创建工程')
    }
    
    const response = await request({
      url: `/api/works/${config.globalData.workId}`,
      method: 'DELETE',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('删除工程', { message: response.message })
    
    // 清除工程ID
    config.globalData.workId = null
  } catch (error) {
    logger.fail('删除工程', error)
  }
}

module.exports = { runWorkTests }

