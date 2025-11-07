/**
 * 工程模块测试
 * 测试接口：
 * - GET /api/v1/works - 获取工程列表
 * - GET /api/v1/works/:id - 获取工程详情
 * - POST /api/v1/works - 新增工程
 * - PUT /api/v1/works/:id - 编辑工程
 * - DELETE /api/v1/works/:id - 删除工程
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
require('dotenv').config()

// 测试数据存储
const testData = {
  workId: null,
  projectId: null
}

/**
 * 测试1: 获取工程列表
 */
async function testGetWorks() {
  logger.module('测试1: 获取工程列表')
  
  try {
    const params = {
      page: 1,
      pageSize: 10
    }
    
    logger.info('请求参数', params)
    
    const response = await http.get('/api/v1/works', params)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取工程列表成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'list', '包含list字段')
    assert.assertHasField(response.data, 'total', '包含total字段')
    
    if (response.data.list && response.data.list.length > 0) {
      logger.success(`获取到 ${response.data.list.length} 个工程`)
      // 保存第一个工程的ID和项目ID用于后续测试
      testData.workId = response.data.list[0].id
      testData.projectId = response.data.list[0].projectId
    } else {
      logger.warn('暂无工程数据')
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取工程列表测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 新增工程
 */
async function testCreateWork(projectId) {
  logger.module('测试2: 新增工程')
  
  // 如果传入了项目ID则使用，否则需要先有项目
  const useProjectId = projectId || testData.projectId
  
  if (!useProjectId) {
    logger.warn('跳过测试: 没有可用的项目ID，无法创建工程')
    logger.divider()
    return true
  }
  
  try {
    const prefix = process.env.TEST_PREFIX || '[API测试]'
    const timestamp = Date.now()
    
    const workData = {
      projectId: useProjectId,
      workName: `${prefix} 测试工程_${timestamp}`,
      workCode: `WORK-${timestamp}`,
      unitWork: '测试单位工程',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      color: '#0d9488'
    }
    
    logger.info('请求参数', workData)
    
    const response = await http.post('/api/v1/works', workData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '新增工程成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含工程ID')
    
    // 保存工程ID供后续测试使用
    if (response.data.id) {
      testData.workId = response.data.id
      testData.projectId = useProjectId
      logger.success(`新建工程ID: ${testData.workId}`)
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('新增工程测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试3: 获取工程详情
 */
async function testGetWorkDetail() {
  logger.module('测试3: 获取工程详情')
  
  if (!testData.workId) {
    logger.warn('跳过测试: 没有可用的工程ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('工程ID', { id: testData.workId })
    
    const response = await http.get(`/api/v1/works/${testData.workId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取工程详情成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含id字段')
    assert.assertHasField(response.data, 'workName', '包含workName字段')
    assert.assertHasField(response.data, 'workCode', '包含workCode字段')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取工程详情测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试4: 编辑工程
 */
async function testUpdateWork() {
  logger.module('测试4: 编辑工程')
  
  if (!testData.workId) {
    logger.warn('跳过测试: 没有可用的工程ID')
    logger.divider()
    return true
  }
  
  try {
    const updateData = {
      workName: `${process.env.TEST_PREFIX || '[API测试]'} 更新后的工程名称`,
      unitWork: '更新后的单位工程',
      color: '#f59e0b'
    }
    
    logger.info('请求参数', updateData)
    logger.info('工程ID', { id: testData.workId })
    
    const response = await http.put(`/api/v1/works/${testData.workId}`, updateData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '编辑工程成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('编辑工程测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试5: 删除工程
 */
async function testDeleteWork() {
  logger.module('测试5: 删除工程')
  
  if (!testData.workId) {
    logger.warn('跳过测试: 没有可用的工程ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('工程ID', { id: testData.workId })
    
    const response = await http.del(`/api/v1/works/${testData.workId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '删除工程成功')
    
    logger.divider()
    return true
  } catch (error) {
    // 如果是因为存在监理日志而无法删除，也算正常
    if (error.message && error.message.includes('监理日志')) {
      logger.warn('无法删除: 工程下存在监理日志')
      logger.divider()
      return true
    }
    
    logger.error('删除工程测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 运行所有工程模块测试
 */
async function runAllTests(projectId = null) {
  logger.title('工程模块测试')
  
  const results = []
  
  // 先获取列表
  results.push(await testGetWorks())
  
  // 保存第一个工程ID供后续所有测试使用（不会被删除）
  const mainWorkId = testData.workId
  const mainProjectId = testData.projectId
  
  // 新增工程（如果有项目ID）
  results.push(await testCreateWork(projectId))
  
  // 使用新创建的工程进行详情和编辑测试
  // 获取详情
  results.push(await testGetWorkDetail())
  
  // 编辑工程
  results.push(await testUpdateWork())
  
  // 删除工程（删除新创建的工程）
  results.push(await testDeleteWork())
  
  // 恢复为第一个工程ID，供后续测试使用（日志模块需要）
  testData.workId = mainWorkId
  testData.projectId = mainProjectId || projectId
  logger.info('后续测试将使用工程ID', { workId: testData.workId, projectId: testData.projectId })
  
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
    module: '工程模块',
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

