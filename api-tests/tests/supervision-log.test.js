/**
 * 监理日志模块测试
 * 测试接口：
 * - GET /api/v1/supervision-logs - 获取监理日志列表
 * - GET /api/v1/supervision-logs/:id - 获取监理日志详情
 * - POST /api/v1/supervision-logs - 新增监理日志
 * - PUT /api/v1/supervision-logs/:id - 编辑监理日志
 * - DELETE /api/v1/supervision-logs/:id - 删除监理日志
 * - GET /api/v1/supervision-logs/:id/export - 导出监理日志为Word
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// 测试数据存储
const testData = {
  logId: null,
  workId: null
}

/**
 * 测试1: 获取监理日志列表
 */
async function testGetSupervisionLogs() {
  logger.module('测试1: 获取监理日志列表')
  
  try {
    const params = {
      page: 1,
      pageSize: 10
    }
    
    logger.info('请求参数', params)
    
    const response = await http.get('/api/v1/supervision-logs', params)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取监理日志列表成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'list', '包含list字段')
    assert.assertHasField(response.data, 'total', '包含total字段')
    assert.assertHasField(response.data, 'stats', '包含stats字段')
    
    if (response.data.list && response.data.list.length > 0) {
      logger.success(`获取到 ${response.data.list.length} 条监理日志`)
      // 保存第一条日志的ID和工程ID
      testData.logId = response.data.list[0].id
      testData.workId = response.data.list[0].workId
    } else {
      logger.warn('暂无监理日志数据')
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取监理日志列表测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 新增监理日志
 */
async function testCreateSupervisionLog(workId, projectId) {
  logger.module('测试2: 新增监理日志')
  
  // 如果传入了工程ID和项目ID则使用，否则需要先有这些数据
  const useWorkId = workId || testData.workId
  const useProjectId = projectId || testData.projectId
  
  if (!useWorkId || !useProjectId) {
    logger.warn('跳过测试: 没有可用的工程ID或项目ID，无法创建监理日志')
    logger.divider()
    return true
  }
  
  try {
    const prefix = process.env.TEST_PREFIX || '[API测试]'
    const today = new Date().toISOString().split('T')[0]
    
    const logData = {
      projectId: useProjectId,
      workId: useWorkId,
      logDate: today,
      weather: '晴 15-25℃',
      projectDynamics: `${prefix} 工程动态：今日进行主体结构施工，进度正常`,
      supervisionWork: '监理工作情况：检查钢筋绑扎质量，符合规范要求',
      safetyWork: '安全监理工作情况：现场安全措施到位，无安全隐患',
      recorderName: '测试记录人',
      recorderDate: today,
      reviewerName: '测试审核人',
      reviewerDate: today
    }
    
    logger.info('请求参数', logData)
    
    const response = await http.post('/api/v1/supervision-logs', logData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '新增监理日志成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含日志ID')
    
    // 保存日志ID供后续测试使用
    if (response.data.id) {
      testData.logId = response.data.id
      testData.workId = useWorkId
      testData.projectId = useProjectId
      logger.success(`新建监理日志ID: ${testData.logId}`)
    }
    
    logger.divider()
    return true
  } catch (error) {
    // 如果是因为同一天已有日志而失败，也记录一下
    if (error.message && error.message.includes('已存在')) {
      logger.warn('该工程今日已有监理日志')
      logger.divider()
      return true
    }
    
    logger.error('新增监理日志测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试3: 获取监理日志详情
 */
async function testGetSupervisionLogDetail() {
  logger.module('测试3: 获取监理日志详情')
  
  if (!testData.logId) {
    logger.warn('跳过测试: 没有可用的日志ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('日志ID', { id: testData.logId })
    
    const response = await http.get(`/api/v1/supervision-logs/${testData.logId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取监理日志详情成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含id字段')
    assert.assertHasField(response.data, 'workId', '包含workId字段')
    assert.assertHasField(response.data, 'logDate', '包含logDate字段')
    assert.assertHasField(response.data, 'weather', '包含weather字段')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取监理日志详情测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试4: 编辑监理日志
 */
async function testUpdateSupervisionLog() {
  logger.module('测试4: 编辑监理日志')
  
  if (!testData.logId) {
    logger.warn('跳过测试: 没有可用的日志ID')
    logger.divider()
    return true
  }
  
  try {
    const updateData = {
      weather: '多云 18-26℃',
      constructionSituation: `${process.env.TEST_PREFIX || '[API测试]'} 更新后的施工情况`,
      qualityInspection: '更新后的质量检查'
    }
    
    logger.info('请求参数', updateData)
    logger.info('日志ID', { id: testData.logId })
    
    const response = await http.put(`/api/v1/supervision-logs/${testData.logId}`, updateData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '编辑监理日志成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('编辑监理日志测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试5: 导出监理日志为Word
 */
async function testExportSupervisionLog() {
  logger.module('测试5: 导出监理日志为Word')
  
  if (!testData.logId) {
    logger.warn('跳过测试: 没有可用的日志ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('日志ID', { id: testData.logId })
    
    const response = await http.download(`/api/v1/supervision-logs/${testData.logId}/export`)
    
    // 验证响应
    if (response.data && response.data.byteLength > 0) {
      logger.success(`导出成功，文件大小: ${response.data.byteLength} bytes`)
      
      // 保存到临时文件（可选）
      const outputDir = path.join(__dirname, '../output')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      const filePath = path.join(outputDir, `supervision_log_${testData.logId}.docx`)
      fs.writeFileSync(filePath, response.data)
      logger.success(`Word文档已保存: ${filePath}`)
    } else {
      logger.error('导出失败: 响应数据为空')
      logger.divider()
      return false
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('导出监理日志测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试6: 删除监理日志
 */
async function testDeleteSupervisionLog() {
  logger.module('测试6: 删除监理日志')
  
  if (!testData.logId) {
    logger.warn('跳过测试: 没有可用的日志ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('日志ID', { id: testData.logId })
    
    const response = await http.del(`/api/v1/supervision-logs/${testData.logId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '删除监理日志成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('删除监理日志测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 运行所有监理日志模块测试
 */
async function runAllTests(workId = null, projectId = null) {
  logger.title('监理日志模块测试')
  
  const results = []
  
  // 先获取列表
  results.push(await testGetSupervisionLogs())
  
  // 新增监理日志（如果有工程ID和项目ID）
  results.push(await testCreateSupervisionLog(workId, projectId))
  
  // 获取详情
  results.push(await testGetSupervisionLogDetail())
  
  // 编辑监理日志
  results.push(await testUpdateSupervisionLog())
  
  // 导出Word
  results.push(await testExportSupervisionLog())
  
  // 删除监理日志
  results.push(await testDeleteSupervisionLog())
  
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
    module: '监理日志模块',
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

