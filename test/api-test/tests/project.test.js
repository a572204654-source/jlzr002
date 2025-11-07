/**
 * 项目管理API测试
 * 对应文档：docx/c-api/项目管理API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')
const config = require('../config')

/**
 * 运行项目测试
 */
async function runProjectTests() {
  logger.startModule('项目管理API测试')
  
  // 1. 新增项目
  await testCreateProject()
  
  // 2. 获取项目列表
  await testGetProjects()
  
  // 3. 获取项目详情
  await testGetProjectDetail()
  
  // 4. 编辑项目
  await testUpdateProject()
  
  // 5. 删除项目（最后测试，因为会删除数据）
  // await testDeleteProject()
}

/**
 * 测试新增项目
 */
async function testCreateProject() {
  try {
    const timestamp = Date.now()
    const response = await request({
      url: '/api/projects',
      method: 'POST',
      needAuth: true,
      data: {
        projectName: `测试项目_${timestamp}`,
        projectCode: `TEST-${timestamp}`,
        organization: '测试监理机构',
        chiefEngineer: '测试工程师',
        description: '这是一个测试项目',
        address: '测试地址',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回项目ID')
    }
    
    // 保存项目ID
    config.globalData.projectId = response.data.id
    
    logger.success('新增项目', {
      id: response.data.id,
      message: response.message
    })
    
    logger.info(`项目ID已保存: ${response.data.id}`)
  } catch (error) {
    logger.fail('新增项目', error)
  }
}

/**
 * 测试获取项目列表
 */
async function testGetProjects() {
  try {
    const response = await request({
      url: '/api/projects',
      method: 'GET',
      needAuth: true,
      params: {
        page: 1,
        pageSize: 20,
        keyword: '测试'
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
    
    logger.success('获取项目列表', {
      total: response.data.total,
      count: response.data.list.length,
      page: response.data.page,
      pageSize: response.data.pageSize
    })
  } catch (error) {
    logger.fail('获取项目列表', error)
  }
}

/**
 * 测试获取项目详情
 */
async function testGetProjectDetail() {
  try {
    if (!config.globalData.projectId) {
      throw new Error('未找到项目ID，请先创建项目')
    }
    
    const response = await request({
      url: `/api/projects/${config.globalData.projectId}`,
      method: 'GET',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回项目详情')
    }
    
    logger.success('获取项目详情', {
      id: response.data.id,
      projectName: response.data.projectName,
      projectCode: response.data.projectCode,
      organization: response.data.organization
    })
  } catch (error) {
    logger.fail('获取项目详情', error)
  }
}

/**
 * 测试编辑项目
 */
async function testUpdateProject() {
  try {
    if (!config.globalData.projectId) {
      throw new Error('未找到项目ID，请先创建项目')
    }
    
    const response = await request({
      url: `/api/projects/${config.globalData.projectId}`,
      method: 'PUT',
      needAuth: true,
      data: {
        description: '更新后的项目描述_' + Date.now()
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('编辑项目', { message: response.message })
  } catch (error) {
    logger.fail('编辑项目', error)
  }
}

/**
 * 测试删除项目
 */
async function testDeleteProject() {
  try {
    if (!config.globalData.projectId) {
      throw new Error('未找到项目ID，请先创建项目')
    }
    
    const response = await request({
      url: `/api/projects/${config.globalData.projectId}`,
      method: 'DELETE',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('删除项目', { message: response.message })
    
    // 清除项目ID
    config.globalData.projectId = null
  } catch (error) {
    logger.fail('删除项目', error)
  }
}

module.exports = { runProjectTests }

