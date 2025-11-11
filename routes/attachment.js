const express = require('express')
const router = express.Router()
const multer = require('multer')
const { success, badRequest, serverError, notFound } = require('../utils/response')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { uploadFile, deleteFile, deleteFiles, isValidFileType, isValidFileSize } = require('../utils/cloudStorage')
const config = require('../config')

// 配置 multer 内存存储
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
 * 上传附件（带文件上传）
 * POST /api/attachments/upload
 * 
 * 请求参数（multipart/form-data）:
 * - file: 文件（必填）
 * - relatedType: 关联类型（log-监理日志, project-项目, work-工程）（必填）
 * - relatedId: 关联ID（必填）
 * - fileType: 文件类型（image-图片, document-文档, video-视频）（必填）
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const userId = req.userId
    const { relatedType, relatedId, fileType } = req.body

    // 参数验证
    if (!req.file) {
      return badRequest(res, '请选择要上传的文件')
    }

    if (!relatedType) {
      return badRequest(res, '关联类型不能为空')
    }
    if (!relatedId) {
      return badRequest(res, '关联ID不能为空')
    }
    if (!fileType) {
      return badRequest(res, '文件类型不能为空')
    }

    // 验证关联类型
    const validTypes = ['log', 'project', 'work']
    if (!validTypes.includes(relatedType)) {
      return badRequest(res, '无效的关联类型')
    }

    // 验证文件大小
    if (!isValidFileSize(req.file.size)) {
      return badRequest(res, `文件大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
    }

    // 生成存储文件夹（根据关联类型）
    const folder = `${config.cloudStorage.prefix}/${relatedType}/${relatedId}`

    // 上传到云存储
    const uploadResult = await uploadFile(req.file.buffer, req.file.originalname, folder)

    // 保存附件记录
    const result = await query(
      `INSERT INTO attachments 
        (related_type, related_id, file_name, file_type, file_url, file_size, upload_user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [relatedType, relatedId, req.file.originalname, fileType, uploadResult.url, req.file.size, userId]
    )

    return success(res, {
      id: result.insertId,
      fileName: req.file.originalname,
      fileType: fileType,
      fileUrl: uploadResult.url,
      fileSize: req.file.size,
      fileId: uploadResult.fileId
    }, '上传成功')

  } catch (error) {
    console.error('上传附件错误:', error)
    
    // 处理 multer 错误
    if (error.code === 'LIMIT_FILE_SIZE') {
      return badRequest(res, `文件大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
    }

    // 处理文件类型错误
    if (error.message && error.message.includes('不支持的文件类型')) {
      return badRequest(res, error.message)
    }

    return serverError(res, error.message || '上传失败')
  }
})

/**
 * 上传附件（仅记录URL，不实际上传文件）
 * POST /api/attachments/upload-url
 * 
 * 请求参数:
 * - relatedType: 关联类型（log-监理日志, project-项目, work-工程）
 * - relatedId: 关联ID
 * - fileName: 文件名
 * - fileType: 文件类型（image-图片, document-文档, video-视频）
 * - fileUrl: 文件URL
 * - fileSize: 文件大小（字节）
 */
router.post('/upload-url', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { relatedType, relatedId, fileName, fileType, fileUrl, fileSize } = req.body

    // 参数验证
    if (!relatedType) {
      return badRequest(res, '关联类型不能为空')
    }
    if (!relatedId) {
      return badRequest(res, '关联ID不能为空')
    }
    if (!fileName) {
      return badRequest(res, '文件名不能为空')
    }
    if (!fileType) {
      return badRequest(res, '文件类型不能为空')
    }
    if (!fileUrl) {
      return badRequest(res, '文件URL不能为空')
    }

    // 验证关联类型
    const validTypes = ['log', 'project', 'work']
    if (!validTypes.includes(relatedType)) {
      return badRequest(res, '无效的关联类型')
    }

    // 保存附件记录
    const result = await query(
      `INSERT INTO attachments 
        (related_type, related_id, file_name, file_type, file_url, file_size, upload_user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [relatedType, relatedId, fileName, fileType, fileUrl, fileSize || 0, userId]
    )

    return success(res, {
      id: result.insertId,
      fileName,
      fileType,
      fileUrl,
      fileSize: fileSize || 0
    }, '上传成功')

  } catch (error) {
    console.error('上传附件错误:', error)
    return serverError(res, '上传失败')
  }
})

/**
 * 获取附件列表
 * GET /api/attachments
 * 
 * 请求参数:
 * - relatedType: 关联类型
 * - relatedId: 关联ID
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const relatedType = req.query.relatedType
    const relatedId = req.query.relatedId

    // 参数验证
    if (!relatedType) {
      return badRequest(res, '关联类型不能为空')
    }
    if (!relatedId) {
      return badRequest(res, '关联ID不能为空')
    }

    // 查询附件列表
    const attachments = await query(
      `SELECT 
        a.id,
        a.file_name,
        a.file_type,
        a.file_url,
        a.file_size,
        a.created_at,
        u.nickname as uploader_name
       FROM attachments a
       LEFT JOIN users u ON a.upload_user_id = u.id
       WHERE a.related_type = ? AND a.related_id = ?
       ORDER BY a.created_at ASC`,
      [relatedType, relatedId]
    )

    // 转换为驼峰命名
    const list = attachments.map(att => ({
      id: att.id,
      fileName: att.file_name,
      fileType: att.file_type,
      fileUrl: att.file_url,
      fileSize: att.file_size,
      createdAt: att.created_at,
      uploaderName: att.uploader_name
    }))

    return success(res, { list })

  } catch (error) {
    console.error('获取附件列表错误:', error)
    return serverError(res, '获取附件列表失败')
  }
})

/**
 * 获取附件详情
 * GET /api/attachments/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // 查询附件详情
    const attachments = await query(
      `SELECT 
        a.id,
        a.related_type,
        a.related_id,
        a.file_name,
        a.file_type,
        a.file_url,
        a.file_size,
        a.created_at,
        u.nickname as uploader_name
       FROM attachments a
       LEFT JOIN users u ON a.upload_user_id = u.id
       WHERE a.id = ?`,
      [id]
    )

    if (attachments.length === 0) {
      return notFound(res, '附件不存在')
    }

    const att = attachments[0]

    // 转换为驼峰命名
    return success(res, {
      id: att.id,
      relatedType: att.related_type,
      relatedId: att.related_id,
      fileName: att.file_name,
      fileType: att.file_type,
      fileUrl: att.file_url,
      fileSize: att.file_size,
      createdAt: att.created_at,
      uploaderName: att.uploader_name
    })

  } catch (error) {
    console.error('获取附件详情错误:', error)
    return serverError(res, '获取附件详情失败')
  }
})

/**
 * 删除附件
 * DELETE /api/attachments/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    // 查询附件
    const attachments = await query(
      'SELECT * FROM attachments WHERE id = ?',
      [id]
    )

    if (attachments.length === 0) {
      return notFound(res, '附件不存在')
    }

    const attachment = attachments[0]

    // 权限验证：只能删除自己上传的附件（可选，根据业务需求调整）
    // if (attachment.upload_user_id !== userId) {
    //   return forbidden(res, '无权删除此附件')
    // }

    // 删除云存储上的文件
    if (attachment.file_url) {
      try {
        await deleteFile(attachment.file_url)
      } catch (deleteError) {
        console.error('删除云存储文件失败:', deleteError)
        // 即使云存储删除失败，也继续删除数据库记录
      }
    }

    // 删除附件记录
    await query('DELETE FROM attachments WHERE id = ?', [id])

    return success(res, {}, '删除成功')

  } catch (error) {
    console.error('删除附件错误:', error)
    return serverError(res, '删除失败')
  }
})

/**
 * 批量删除附件
 * POST /api/attachments/batch-delete
 * 
 * 请求参数:
 * - ids: 附件ID数组
 */
router.post('/batch-delete', authenticate, async (req, res) => {
  try {
    const { ids } = req.body

    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return badRequest(res, '附件ID列表不能为空')
    }

    // 查询附件
    const placeholders = ids.map(() => '?').join(',')
    const attachments = await query(
      `SELECT * FROM attachments WHERE id IN (${placeholders})`,
      ids
    )

    if (attachments.length === 0) {
      return notFound(res, '附件不存在')
    }

    // 批量删除云存储上的文件
    const fileUrls = attachments
      .map(att => att.file_url)
      .filter(url => url) // 过滤掉空URL

    if (fileUrls.length > 0) {
      try {
        await deleteFiles(fileUrls)
      } catch (deleteError) {
        console.error('批量删除云存储文件失败:', deleteError)
        // 即使云存储删除失败，也继续删除数据库记录
      }
    }

    // 批量删除附件记录
    await query(
      `DELETE FROM attachments WHERE id IN (${placeholders})`,
      ids
    )

    return success(res, {
      deletedCount: ids.length
    }, '批量删除成功')

  } catch (error) {
    console.error('批量删除附件错误:', error)
    return serverError(res, '批量删除失败')
  }
})

module.exports = router

