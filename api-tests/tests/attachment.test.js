/**
 * 附件模块测试
 * 测试接口：
 * - POST /api/v1/attachments/upload - 上传附件
 * - GET /api/v1/attachments - 获取附件列表
 * - GET /api/v1/attachments/:id - 获取附件详情
 * - DELETE /api/v1/attachments/:id - 删除附件
 * - POST /api/v1/attachments/batch-delete - 批量删除附件
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
require('dotenv').config()

// 测试数据存储
const testData = {
  attachmentId: null,
  attachmentIds: []
}

/**
 * 测试1: 上传附件
 */
async function testUploadAttachment(relatedType = 'log', relatedId = 1) {
  logger.module('测试1: 上传附件')
  
  try {
    // 模拟附件数据（实际应用中fileUrl应该是真实的云存储URL）
    const attachmentData = {
      relatedType: relatedType,
      relatedId: relatedId,
      fileName: `测试附件_${Date.now()}.jpg`,
      fileType: 'image/jpeg',
      fileUrl: `https://example.com/test_${Date.now()}.jpg`,
      fileSize: 102400
    }
    
    logger.info('请求参数', attachmentData)
    
    const response = await http.post('/api/v1/attachments/upload', attachmentData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '上传附件成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含附件ID')
    assert.assertHasField(response.data, 'fileName', '包含文件名')
    assert.assertHasField(response.data, 'fileUrl', '包含文件URL')
    
    // 保存附件ID供后续测试使用
    if (response.data.id) {
      testData.attachmentId = response.data.id
      testData.attachmentIds.push(response.data.id)
      logger.success(`附件ID: ${testData.attachmentId}`)
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('上传附件测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 获取附件列表
 */
async function testGetAttachments() {
  logger.module('测试2: 获取附件列表')
  
  try {
    const params = {
      relatedType: 'log',
      relatedId: 1
    }
    
    logger.info('请求参数', params)
    
    const response = await http.get('/api/v1/attachments', params)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取附件列表成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'list', '包含list字段')
    
    if (response.data.list && response.data.list.length > 0) {
      logger.success(`获取到 ${response.data.list.length} 个附件`)
    } else {
      logger.warn('暂无附件数据')
    }
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取附件列表测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试3: 获取附件详情
 */
async function testGetAttachmentDetail() {
  logger.module('测试3: 获取附件详情')
  
  if (!testData.attachmentId) {
    logger.warn('跳过测试: 没有可用的附件ID')
    logger.divider()
    return true
  }
  
  try {
    logger.info('附件ID', { id: testData.attachmentId })
    
    const response = await http.get(`/api/v1/attachments/${testData.attachmentId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '获取附件详情成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'id', '包含id字段')
    assert.assertHasField(response.data, 'fileName', '包含fileName字段')
    assert.assertHasField(response.data, 'fileUrl', '包含fileUrl字段')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('获取附件详情测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试4: 批量上传附件（为批量删除做准备）
 */
async function testBatchUploadAttachments() {
  logger.module('测试4: 批量上传附件（为批量删除做准备）')
  
  try {
    // 上传3个附件
    for (let i = 0; i < 3; i++) {
      const attachmentData = {
        relatedType: 'log',
        relatedId: 1,
        fileName: `批量测试附件_${i + 1}_${Date.now()}.jpg`,
        fileType: 'image/jpeg',
        fileUrl: `https://example.com/batch_test_${i + 1}_${Date.now()}.jpg`,
        fileSize: 50000 + i * 1000
      }
      
      const response = await http.post('/api/v1/attachments/upload', attachmentData)
      
      if (response.code === 0 && response.data.id) {
        testData.attachmentIds.push(response.data.id)
        logger.success(`上传附件 ${i + 1}: ID=${response.data.id}`)
      }
    }
    
    logger.success(`批量上传完成，共 ${testData.attachmentIds.length} 个附件`)
    logger.divider()
    return true
  } catch (error) {
    logger.error('批量上传附件测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试5: 批量删除附件
 */
async function testBatchDeleteAttachments() {
  logger.module('测试5: 批量删除附件')
  
  if (testData.attachmentIds.length === 0) {
    logger.warn('跳过测试: 没有可用的附件ID')
    logger.divider()
    return true
  }
  
  try {
    const deleteData = {
      ids: testData.attachmentIds
    }
    
    logger.info('请求参数', deleteData)
    
    const response = await http.post('/api/v1/attachments/batch-delete', deleteData)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '批量删除附件成功')
    
    // 清空已删除的ID
    testData.attachmentIds = []
    testData.attachmentId = null
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('批量删除附件测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试6: 删除单个附件
 */
async function testDeleteAttachment() {
  logger.module('测试6: 删除单个附件')
  
  // 先上传一个附件用于删除测试
  const uploadResult = await testUploadAttachment('log', 1)
  if (!uploadResult || !testData.attachmentId) {
    logger.warn('跳过测试: 无法创建测试附件')
    logger.divider()
    return true
  }
  
  try {
    const deleteId = testData.attachmentId
    logger.info('附件ID', { id: deleteId })
    
    const response = await http.del(`/api/v1/attachments/${deleteId}`)
    
    logger.info('响应数据', response)
    
    // 验证响应
    assert.assertSuccess(response, '删除附件成功')
    
    logger.divider()
    return true
  } catch (error) {
    logger.error('删除附件测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 运行所有附件模块测试
 */
async function runAllTests() {
  logger.title('附件模块测试')
  
  const results = []
  
  // 上传附件
  results.push(await testUploadAttachment('log', 1))
  
  // 获取附件列表
  results.push(await testGetAttachments())
  
  // 获取附件详情
  results.push(await testGetAttachmentDetail())
  
  // 批量上传附件
  results.push(await testBatchUploadAttachments())
  
  // 批量删除附件
  results.push(await testBatchDeleteAttachments())
  
  // 删除单个附件
  results.push(await testDeleteAttachment())
  
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
    module: '附件模块',
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

