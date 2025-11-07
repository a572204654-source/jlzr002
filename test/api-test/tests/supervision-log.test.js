/**
 * 监理日志API测试
 * 对应文档：docx/c-api/监理日志API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')
const config = require('../config')

/**
 * 运行监理日志测试
 */
async function runSupervisionLogTests() {
  logger.startModule('监理日志API测试')
  
  // 1. 新增监理日志
  await testCreateLog()
  
  // 2. 获取监理日志列表
  await testGetLogs()
  
  // 3. 获取监理日志详情
  await testGetLogDetail()
  
  // 4. 编辑监理日志
  await testUpdateLog()
  
  // 5. 导出Word文档
  await testExportLog()
  
  // 6. 删除监理日志（最后测试）
  // await testDeleteLog()
}

/**
 * 测试新增监理日志
 */
async function testCreateLog() {
  try {
    if (!config.globalData.projectId || !config.globalData.workId) {
      throw new Error('未找到项目ID或工程ID，请先创建项目和工程')
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    const response = await request({
      url: '/api/supervision-logs',
      method: 'POST',
      needAuth: true,
      data: {
        projectId: config.globalData.projectId,
        workId: config.globalData.workId,
        logDate: today,
        weather: '晴 16-24℃ 南风2级',
        projectDynamics: '今日完成主体结构第三层混凝土浇筑，累计完成混凝土浇筑量约500立方米。',
        supervisionWork: '1. 检查模板支撑系统，确认符合设计要求\n2. 旁站监理混凝土浇筑过程\n3. 检查混凝土试块制作和养护',
        safetyWork: '1. 检查高处作业防护措施\n2. 检查施工用电安全\n3. 开展安全教育培训',
        recorderName: '测试记录人',
        recorderDate: today,
        reviewerName: '测试审核人',
        reviewerDate: today
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回日志ID')
    }
    
    // 保存日志ID
    config.globalData.logId = response.data.id
    
    logger.success('新增监理日志', {
      id: response.data.id,
      message: response.message
    })
    
    logger.info(`日志ID已保存: ${response.data.id}`)
  } catch (error) {
    logger.fail('新增监理日志', error)
  }
}

/**
 * 测试获取监理日志列表
 */
async function testGetLogs() {
  try {
    const params = {
      page: 1,
      pageSize: 20
    }
    
    // 如果有项目ID和工程ID，添加筛选条件
    if (config.globalData.projectId) {
      params.projectId = config.globalData.projectId
    }
    if (config.globalData.workId) {
      params.workId = config.globalData.workId
    }
    
    const response = await request({
      url: '/api/supervision-logs',
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
    
    logger.success('获取监理日志列表', {
      total: response.data.total,
      count: response.data.list.length,
      monthCount: response.data.stats?.monthCount || 0,
      totalCount: response.data.stats?.totalCount || 0
    })
  } catch (error) {
    logger.fail('获取监理日志列表', error)
  }
}

/**
 * 测试获取监理日志详情
 */
async function testGetLogDetail() {
  try {
    if (!config.globalData.logId) {
      throw new Error('未找到日志ID，请先创建监理日志')
    }
    
    const response = await request({
      url: `/api/supervision-logs/${config.globalData.logId}`,
      method: 'GET',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回日志详情')
    }
    
    if (!Array.isArray(response.data.attachments)) {
      throw new Error('attachments不是数组')
    }
    
    logger.success('获取监理日志详情', {
      id: response.data.id,
      logDate: response.data.logDate,
      projectName: response.data.projectName,
      workName: response.data.workName,
      attachmentCount: response.data.attachments.length
    })
  } catch (error) {
    logger.fail('获取监理日志详情', error)
  }
}

/**
 * 测试编辑监理日志
 */
async function testUpdateLog() {
  try {
    if (!config.globalData.logId) {
      throw new Error('未找到日志ID，请先创建监理日志')
    }
    
    const response = await request({
      url: `/api/supervision-logs/${config.globalData.logId}`,
      method: 'PUT',
      needAuth: true,
      data: {
        projectDynamics: '更新后的工程动态内容_' + Date.now()
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('编辑监理日志', { message: response.message })
  } catch (error) {
    logger.fail('编辑监理日志', error)
  }
}

/**
 * 测试导出Word文档
 */
async function testExportLog() {
  try {
    if (!config.globalData.logId) {
      throw new Error('未找到日志ID，请先创建监理日志')
    }
    
    const response = await request({
      url: `/api/supervision-logs/${config.globalData.logId}/export`,
      method: 'GET',
      needAuth: true,
      responseType: 'arraybuffer'
    })
    
    // Word文档导出返回的是二进制数据
    if (!response || response.length === 0) {
      throw new Error('未返回Word文档数据')
    }
    
    logger.success('导出Word文档', {
      size: `${(response.length / 1024).toFixed(2)} KB`
    })
  } catch (error) {
    logger.fail('导出Word文档', error)
  }
}

/**
 * 测试删除监理日志
 */
async function testDeleteLog() {
  try {
    if (!config.globalData.logId) {
      throw new Error('未找到日志ID，请先创建监理日志')
    }
    
    const response = await request({
      url: `/api/supervision-logs/${config.globalData.logId}`,
      method: 'DELETE',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('删除监理日志', { message: response.message })
    
    // 清除日志ID
    config.globalData.logId = null
  } catch (error) {
    logger.fail('删除监理日志', error)
  }
}

module.exports = { runSupervisionLogTests }

