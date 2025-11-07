/**
 * 项目模块测试
 * 测试接口：
 * - GET /api/v1/projects - 获取项目列表
 * - GET /api/v1/projects/:id - 获取项目详情
 * - POST /api/v1/projects - 新增项目
 * - PUT /api/v1/projects/:id - 编辑项目
 * - DELETE /api/v1/projects/:id - 删除项目
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
require('dotenv').config()

// 测试数据存储
const testData = {
  projectId: null
}

/**
 * 测试1: 获取项目列表
 */
async function testGetProjects() {
  logger.module('测试1: 获取项目列表')
  
  try {
    const params = {
      page: 1,
      pageSize: 10,
      keyword: ''
    }
    
    logger.info('请求参数', params)
    
    const response = await http.get('/api/v1/projects', params)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取项目列表成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'list', '包含list字段')
    assert.assertHasField(response.data, 'total', '包含total字段')
    
    if (response.data.list && response.data.list.length > 0) {
      logger.success(`获取到 ${response.data.list.length} 个项目`)
      // 保存第一个项目ID用于后续测试
      testData.projectId = response.data.list[0].id
    } else {
      logger.warn('暂无项目数据')
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取项目列表测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 新增项目
 */
async function testCreateProject() {
  logger.module('测试2: 新增项目')
  
  try {
    const prefix = process.env.TEST_PREFIX || '[API测试]'
    const timestamp = Date.now()
    
    const projectData = {
      projectName: `${prefix} 测试项目_${timestamp}`,
      projectCode: `TEST-${timestamp}`,
      organization: '测试监理公司',
      chiefEngineer: '测试工程师'
    }
    
    logger.info('请求参数', projectData)
    
    const response = await http.post('/api/v1/projects', projectData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '新增项目成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含项目ID')
    
    // 保存项目ID供后续测试使用
    if (response.data.id) {
      testData.projectId = response.data.id
      logger.success(`新建项目ID: ${testData.projectId}`)
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('新增项目测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试3: 获取项目详情
 */
async function testGetProjectDetail() {
  logger.module('测试3: 获取项目详情')
  
  if (!testData.projectId) {
    logger.warn('跳过测试: 没有可用的项目ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('项目ID', { id: testData.projectId })
    
    const response = await http.get(`/api/v1/projects/${testData.projectId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取项目详情成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含id字段')
    assert.assertHasField(response.data, 'projectName', '包含projectName字段')
    assert.assertHasField(response.data, 'projectCode', '包含projectCode字段')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取项目详情测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试4: 编辑项目
 */
async function testUpdateProject() {
  logger.module('测试4: 编辑项目')
  
  if (!testData.projectId) {
    logger.warn('跳过测试: 没有可用的项目ID')
    logger.divider()
    return true
  }
  
  try {
    const updateData = {
      projectName: `${process.env.TEST_PREFIX || '[API测试]'} 更新后的项目名称`,
      chiefEngineer: '更新后的工程师'
    }
    
    logger.info('请求参数', updateData)
    logger.info('项目ID', { id: testData.projectId })
    
    const response = await http.put(`/api/v1/projects/${testData.projectId}`, updateData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '编辑项目成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('编辑项目测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试5: 删除项目
 */
async function testDeleteProject() {
  logger.module('测试5: 删除项目')
  
  if (!testData.projectId) {
    logger.warn('跳过测试: 没有可用的项目ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('项目ID', { id: testData.projectId })
    
    const response = await http.del(`/api/v1/projects/${testData.projectId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '删除项目成功')
    
    logger.divider()
    return true
  } catch (error) {
    // 如果是因为存在工程而无法删除，也算正常
    if (error.message && error.message.includes('工程')) {
      logger.warn('无法删除: 项目下存在工程')
      logger.divider()
      return true
    }
    
    logger.error('删除项目测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 运行所有项目模块测试
 */
async function runAllTests() {
  logger.title('项目模块测试')
  
  const results = []
  
  // 先获取列表
  results.push(await testGetProjects())
  
  // 保存第一个项目ID供后续所有测试使用（不会被删除）
  const mainProjectId = testData.projectId
  
  // 新增项目
  results.push(await testCreateProject())
  
  // 使用新创建的项目进行详情和编辑测试
  // 获取详情
  results.push(await testGetProjectDetail())
  
  // 编辑项目
  results.push(await testUpdateProject())
  
  // 删除项目（删除新创建的项目）
  results.push(await testDeleteProject())
  
  // 恢复为第一个项目ID，供后续测试使用（工程、日志等模块需要）
  testData.projectId = mainProjectId
  logger.info('后续测试将使用项目ID', { projectId: testData.projectId })
  
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
    module: '项目模块',
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

