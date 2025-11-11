/**
 * 文件上传路由
 * 提供直接的文件上传接口，上传到云存储
 */

const express = require('express')
const router = express.Router()
const multer = require('multer')
const { success, badRequest, serverError } = require('../utils/response')
const { authenticate } = require('../middleware/auth')
const { uploadFile, isValidFileType, isValidFileSize } = require('../utils/cloudStorage')
const config = require('../config')

// 配置 multer 内存存储（文件将保存在内存中，然后上传到云存储）
const storage = multer.memoryStorage()

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (isValidFileType(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false)
  }
}

// 创建 multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.cloudStorage.maxFileSize
  }
})

/**
 * 单文件上传
 * POST /api/upload
 * 
 * 请求参数（multipart/form-data）:
 * - file: 文件（必填）
 * - folder: 存储文件夹（可选，默认为 uploads）
 */
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return badRequest(res, '请选择要上传的文件')
    }

    // 验证文件大小
    if (!isValidFileSize(req.file.size)) {
      return badRequest(res, `文件大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
    }

    // 获取存储文件夹
    const folder = req.body.folder || config.cloudStorage.prefix

    // 上传到云存储
    const result = await uploadFile(req.file.buffer, req.file.originalname, folder)

    return success(res, {
      url: result.url,
      fileId: result.fileId,
      fileName: result.fileName,
      cloudPath: result.cloudPath,
      size: req.file.size,
      mimeType: req.file.mimetype
    }, '上传成功')

  } catch (error) {
    console.error('文件上传错误:', error)
    
    // 处理 multer 错误
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return badRequest(res, `文件大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
      }
      return badRequest(res, `上传失败: ${error.message}`)
    }

    // 处理文件类型错误
    if (error.message && error.message.includes('不支持的文件类型')) {
      return badRequest(res, error.message)
    }

    return serverError(res, error.message || '上传失败')
  }
})

/**
 * 多文件上传
 * POST /api/upload/multiple
 * 
 * 请求参数（multipart/form-data）:
 * - files: 文件数组（必填）
 * - folder: 存储文件夹（可选，默认为 uploads）
 */
router.post('/multiple', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return badRequest(res, '请选择要上传的文件')
    }

    // 验证文件大小
    for (const file of req.files) {
      if (!isValidFileSize(file.size)) {
        return badRequest(res, `文件 ${file.originalname} 大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
      }
    }

    // 获取存储文件夹
    const folder = req.body.folder || config.cloudStorage.prefix

    // 批量上传
    const uploadPromises = req.files.map(file => 
      uploadFile(file.buffer, file.originalname, folder)
        .then(result => ({
          url: result.url,
          fileId: result.fileId,
          fileName: result.fileName,
          cloudPath: result.cloudPath,
          size: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname
        }))
        .catch(error => ({
          error: error.message,
          originalName: file.originalname
        }))
    )

    const results = await Promise.all(uploadPromises)

    // 分离成功和失败的结果
    const successFiles = results.filter(r => !r.error)
    const failedFiles = results.filter(r => r.error)

    return success(res, {
      success: successFiles,
      failed: failedFiles,
      total: req.files.length,
      successCount: successFiles.length,
      failedCount: failedFiles.length
    }, `上传完成：成功 ${successFiles.length} 个，失败 ${failedFiles.length} 个`)

  } catch (error) {
    console.error('批量文件上传错误:', error)
    return serverError(res, error.message || '批量上传失败')
  }
})

/**
 * 获取上传配置信息
 * GET /api/upload/config
 */
router.get('/config', authenticate, (req, res) => {
  try {
    return success(res, {
      maxFileSize: config.cloudStorage.maxFileSize,
      maxFileSizeMB: config.cloudStorage.maxFileSize / 1024 / 1024,
      allowedTypes: config.cloudStorage.allowedTypes,
      domain: config.cloudStorage.domain,
      prefix: config.cloudStorage.prefix
    })
  } catch (error) {
    console.error('获取上传配置错误:', error)
    return serverError(res, '获取配置失败')
  }
})

module.exports = router

