/**
 * 附件管理API测试
 * 对应文档：docx/c-api/附件管理API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')
const config = require('../config')

/**
 * 运行附件测试
 */
async function runAttachmentTests() {
  logger.startModule('附件管理API测试')
  
  // 1. 上传附件
  await testUploadAttachment()
  
  // 2. 获取附件列表
  await testGetAttachments()
  
  // 3. 获取附件详情
  await testGetAttachmentDetail()
  
  // 4. 删除附件
  // await testDeleteAttachment()
  
  // 5. 批量删除附件
  // await testBatchDeleteAttachments()
}

/**
 * 测试上传附件
 */
async function testUploadAttachment() {
  try {
    if (!config.globalData.logId) {
      throw new Error('未找到日志ID，请先创建监理日志')
    }
    
    const response = await request({
      url: '/api/attachments/upload',
      method: 'POST',
      needAuth: true,
      data: {
        relatedType: 'log',
        relatedId: config.globalData.logId,
        fileName: '测试照片_' + Date.now() + '.jpg',
        fileType: 'image',
        fileUrl: 'https://example.com/test-photo.jpg',
        fileSize: 1024000
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回附件ID')
    }
    
    // 保存附件ID
    config.globalData.attachmentId = response.data.id
    
    logger.success('上传附件', {
      id: response.data.id,
      fileName: response.data.fileName,
      fileType: response.data.fileType,
      message: response.message
    })
    
    logger.info(`附件ID已保存: ${response.data.id}`)
  } catch (error) {
    logger.fail('上传附件', error)
  }
}

/**
 * 测试获取附件列表
 */
async function testGetAttachments() {
  try {
    if (!config.globalData.logId) {
      throw new Error('未找到日志ID，请先创建监理日志')
    }
    
    const response = await request({
      url: '/api/attachments',
      method: 'GET',
      needAuth: true,
      params: {
        relatedType: 'log',
        relatedId: config.globalData.logId
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!Array.isArray(response.data.list)) {
      throw new Error('list不是数组')
    }
    
    logger.success('获取附件列表', {
      count: response.data.list.length
    })
  } catch (error) {
    logger.fail('获取附件列表', error)
  }
}

/**
 * 测试获取附件详情
 */
async function testGetAttachmentDetail() {
  try {
    if (!config.globalData.attachmentId) {
      throw new Error('未找到附件ID，请先上传附件')
    }
    
    const response = await request({
      url: `/api/attachments/${config.globalData.attachmentId}`,
      method: 'GET',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.id) {
      throw new Error('未返回附件详情')
    }
    
    logger.success('获取附件详情', {
      id: response.data.id,
      fileName: response.data.fileName,
      fileType: response.data.fileType,
      relatedType: response.data.relatedType
    })
  } catch (error) {
    logger.fail('获取附件详情', error)
  }
}

/**
 * 测试删除附件
 */
async function testDeleteAttachment() {
  try {
    if (!config.globalData.attachmentId) {
      throw new Error('未找到附件ID，请先上传附件')
    }
    
    const response = await request({
      url: `/api/attachments/${config.globalData.attachmentId}`,
      method: 'DELETE',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    logger.success('删除附件', { message: response.message })
    
    // 清除附件ID
    config.globalData.attachmentId = null
  } catch (error) {
    logger.fail('删除附件', error)
  }
}

/**
 * 测试批量删除附件
 */
async function testBatchDeleteAttachments() {
  try {
    // 创建多个附件用于批量删除测试
    const attachmentIds = []
    
    for (let i = 0; i < 3; i++) {
      const response = await request({
        url: '/api/attachments/upload',
        method: 'POST',
        needAuth: true,
        data: {
          relatedType: 'log',
          relatedId: config.globalData.logId,
          fileName: `批量测试_${i}_${Date.now()}.jpg`,
          fileType: 'image',
          fileUrl: `https://example.com/batch-test-${i}.jpg`,
          fileSize: 1024000
        }
      })
      
      if (response.code === 0 && response.data.id) {
        attachmentIds.push(response.data.id)
      }
    }
    
    if (attachmentIds.length === 0) {
      throw new Error('未创建测试附件')
    }
    
    // 执行批量删除
    const response = await request({
      url: '/api/attachments/batch-delete',
      method: 'POST',
      needAuth: true,
      data: {
        ids: attachmentIds
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.deletedCount) {
      throw new Error('未返回删除数量')
    }
    
    logger.success('批量删除附件', {
      deletedCount: response.data.deletedCount,
      message: response.message
    })
  } catch (error) {
    logger.fail('批量删除附件', error)
  }
}

module.exports = { runAttachmentTests }

