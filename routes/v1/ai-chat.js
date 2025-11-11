const express = require('express')
const router = express.Router()
const multer = require('multer')
const { success, badRequest, serverError } = require('../../utils/response')
const { query } = require('../../config/database')
const { authenticate } = require('../../middleware/auth')
const { randomString } = require('../../utils/crypto')
const { chatWithContext, chatWithFile } = require('../../utils/doubao')
const { uploadFile, getFileUrl, isValidFileType, isValidFileSize } = require('../../utils/cloudStorage')
const config = require('../../config')

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
 * 创建新会话
 * POST /api/v1/ai-chat/session
 */
router.post('/ai-chat/session', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    
    // 生成会话ID
    const sessionId = 'session_' + Date.now() + '_' + randomString(8)

    // 可以选择性地在数据库中记录会话创建
    // 目前仅返回会话ID
    
    return success(res, {
      sessionId
    })

  } catch (error) {
    console.error('创建会话错误:', error)
    return serverError(res, '创建会话失败')
  }
})

/**
 * 发送消息
 * POST /api/v1/ai-chat/send
 */
router.post('/ai-chat/send', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { sessionId, content } = req.body

    // 参数验证
    if (!sessionId) {
      return badRequest(res, '会话ID不能为空')
    }
    if (!content) {
      return badRequest(res, '消息内容不能为空')
    }

    // 保存用户消息
    const userMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'user', ?, 'doubao')`,
      [userId, sessionId, content]
    )

    // 获取对话历史（最近10条消息作为上下文）
    const historyMessages = await query(
      `SELECT message_type, content 
       FROM ai_chat_logs
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, sessionId]
    )

    // 构建对话上下文（时间倒序，需要翻转）
    const conversationHistory = historyMessages
      .reverse()
      .filter(msg => msg.message_type === 'user' || msg.message_type === 'ai')
      .map(msg => ({
        role: msg.message_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

    // 调用豆包AI API获取回复
    let aiReply
    try {
      aiReply = await chatWithContext(conversationHistory, content)
    } catch (error) {
      console.error('豆包API调用失败:', error.message)
      // 如果API调用失败，返回友好的错误提示
      aiReply = `抱歉，AI服务暂时无法响应。错误信息：${error.message}`
    }

    // 保存AI回复
    const aiMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'ai', ?, 'doubao')`,
      [userId, sessionId, aiReply]
    )

    return success(res, {
      sessionId,
      messageId: aiMessageResult.insertId,
      aiReply
    })

  } catch (error) {
    console.error('发送消息错误:', error)
    return serverError(res, '发送消息失败')
  }
})

/**
 * 获取对话历史
 * GET /api/v1/ai-chat/history
 */
router.get('/ai-chat/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const sessionId = req.query.sessionId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 50
    const offset = (page - 1) * pageSize

    // 参数验证
    if (!sessionId) {
      return badRequest(res, '会话ID不能为空')
    }

    // 查询对话历史
    const messages = await query(
      `SELECT 
        id,
        message_type as messageType,
        content,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as createdAt
       FROM ai_chat_logs
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at ASC
       LIMIT ? OFFSET ?`,
      [userId, sessionId, pageSize, offset]
    )

    // 查询总数
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM ai_chat_logs WHERE user_id = ? AND session_id = ?',
      [userId, sessionId]
    )

    return success(res, {
      sessionId,
      total: countResult.total,
      list: messages
    })

  } catch (error) {
    console.error('获取对话历史错误:', error)
    return serverError(res, '获取对话历史失败')
  }
})

/**
 * 删除会话
 * DELETE /api/v1/ai-chat/session/:sessionId
 */
router.delete('/ai-chat/session/:sessionId', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { sessionId } = req.params

    // 删除会话的所有消息
    await query(
      'DELETE FROM ai_chat_logs WHERE user_id = ? AND session_id = ?',
      [userId, sessionId]
    )

    return success(res, {}, '删除成功')

  } catch (error) {
    console.error('删除会话错误:', error)
    return serverError(res, '删除会话失败')
  }
})

/**
 * 获取用户的会话列表
 * GET /api/v1/ai-chat/sessions
 */
router.get('/ai-chat/sessions', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const offset = (page - 1) * pageSize

    // 查询会话列表（按最后消息时间分组）
    const sessions = await query(
      `SELECT 
        session_id as sessionId,
        COUNT(*) as messageCount,
        MAX(created_at) as lastMessageTime,
        (SELECT content FROM ai_chat_logs 
         WHERE user_id = ? AND session_id = acl.session_id AND message_type = 'user'
         ORDER BY created_at DESC LIMIT 1) as lastUserMessage
       FROM ai_chat_logs acl
       WHERE user_id = ?
       GROUP BY session_id
       ORDER BY MAX(created_at) DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, pageSize, offset]
    )

    // 查询总数
    const [countResult] = await query(
      `SELECT COUNT(DISTINCT session_id) as total 
       FROM ai_chat_logs 
       WHERE user_id = ?`,
      [userId]
    )

    return success(res, {
      total: countResult.total,
      page,
      pageSize,
      list: sessions
    })

  } catch (error) {
    console.error('获取会话列表错误:', error)
    return serverError(res, '获取会话列表失败')
  }
})

/**
 * 上传文件并发送给AI
 * POST /api/v1/ai-chat/upload-file
 * 
 * 请求参数（multipart/form-data）:
 * - file: 文件（必填）
 * - sessionId: 会话ID（必填）
 * - message: 用户消息（可选，默认为"请分析这个文件"）
 */
router.post('/ai-chat/upload-file', authenticate, upload.single('file'), async (req, res) => {
  try {
    const userId = req.userId
    const { sessionId, message } = req.body

    // 参数验证
    if (!sessionId) {
      return badRequest(res, '会话ID不能为空')
    }

    if (!req.file) {
      return badRequest(res, '请选择要上传的文件')
    }

    // 验证文件大小
    if (!isValidFileSize(req.file.size)) {
      return badRequest(res, `文件大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
    }

    // 上传文件到云存储
    const uploadResult = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'ai-files' // 使用专门的文件夹存储AI文件
    )

    // 生成临时访问链接（有效期1小时）
    const tempFileUrl = await getFileUrl(uploadResult.fileId, 3600)

    // 构建用户消息（包含文件信息）
    const userMessage = message || '请分析这个文件'
    const messageWithFile = `${userMessage}\n\n文件信息：\n- 文件名：${req.file.originalname}\n- 文件类型：${req.file.mimetype}\n- 文件大小：${(req.file.size / 1024).toFixed(2)} KB`

    // 保存用户消息（包含文件URL）
    const userMessageContent = `${messageWithFile}\n\n文件链接：${tempFileUrl}`
    const userMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'user', ?, 'doubao')`,
      [userId, sessionId, userMessageContent]
    )

    // 获取对话历史（最近10条消息作为上下文）
    const historyMessages = await query(
      `SELECT message_type, content 
       FROM ai_chat_logs
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, sessionId]
    )

    // 构建对话上下文（时间倒序，需要翻转）
    const conversationHistory = historyMessages
      .reverse()
      .filter(msg => msg.message_type === 'user' || msg.message_type === 'ai')
      .map(msg => ({
        role: msg.message_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

    // 调用豆包AI API，传入文件URL
    let aiReply
    try {
      aiReply = await chatWithFile(conversationHistory, userMessage, tempFileUrl)
    } catch (error) {
      console.error('豆包API调用失败:', error.message)
      // 如果API调用失败，返回友好的错误提示
      aiReply = `抱歉，AI服务暂时无法响应。错误信息：${error.message}`
    }

    // 保存AI回复
    const aiMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'ai', ?, 'doubao')`,
      [userId, sessionId, aiReply]
    )

    return success(res, {
      sessionId,
      messageId: aiMessageResult.insertId,
      aiReply,
      fileInfo: {
        url: tempFileUrl,
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        cloudPath: uploadResult.cloudPath,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    }, '文件上传成功，AI已开始分析')

  } catch (error) {
    console.error('AI文件上传错误:', error)
    
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

    return serverError(res, error.message || '文件上传失败')
  }
})

/**
 * 批量上传文件并发送给AI
 * POST /api/v1/ai-chat/upload-files
 * 
 * 请求参数（multipart/form-data）:
 * - files: 文件数组（必填，最多5个）
 * - sessionId: 会话ID（必填）
 * - message: 用户消息（可选，默认为"请分析这些文件"）
 */
router.post('/ai-chat/upload-files', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    const userId = req.userId
    const { sessionId, message } = req.body

    // 参数验证
    if (!sessionId) {
      return badRequest(res, '会话ID不能为空')
    }

    if (!req.files || req.files.length === 0) {
      return badRequest(res, '请选择要上传的文件')
    }

    // 验证文件大小
    for (const file of req.files) {
      if (!isValidFileSize(file.size)) {
        return badRequest(res, `文件 ${file.originalname} 大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
      }
    }

    // 批量上传文件到云存储
    const uploadPromises = req.files.map(file => 
      uploadFile(file.buffer, file.originalname, 'ai-files')
        .then(async (uploadResult) => {
          // 生成临时访问链接
          const tempFileUrl = await getFileUrl(uploadResult.fileId, 3600)
          return {
            url: tempFileUrl,
            fileId: uploadResult.fileId,
            fileName: uploadResult.fileName,
            cloudPath: uploadResult.cloudPath,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          }
        })
        .catch(error => ({
          error: error.message,
          originalName: file.originalname
        }))
    )

    const uploadResults = await Promise.all(uploadPromises)

    // 分离成功和失败的结果
    const successFiles = uploadResults.filter(r => !r.error)
    const failedFiles = uploadResults.filter(r => r.error)

    if (successFiles.length === 0) {
      return badRequest(res, '所有文件上传失败')
    }

    // 构建用户消息（包含文件信息）
    const userMessage = message || '请分析这些文件'
    const fileInfoText = successFiles.map((file, index) => 
      `文件${index + 1}：${file.originalName}（${(file.size / 1024).toFixed(2)} KB）\n链接：${file.url}`
    ).join('\n\n')
    const messageWithFiles = `${userMessage}\n\n文件信息：\n${fileInfoText}`

    // 保存用户消息
    const userMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'user', ?, 'doubao')`,
      [userId, sessionId, messageWithFiles]
    )

    // 获取对话历史
    const historyMessages = await query(
      `SELECT message_type, content 
       FROM ai_chat_logs
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, sessionId]
    )

    // 构建对话上下文
    const conversationHistory = historyMessages
      .reverse()
      .filter(msg => msg.message_type === 'user' || msg.message_type === 'ai')
      .map(msg => ({
        role: msg.message_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

    // 获取所有成功上传的文件URL
    const fileUrls = successFiles.map(file => file.url)

    // 调用豆包AI API，传入所有文件URL
    let aiReply
    try {
      aiReply = await chatWithFile(conversationHistory, userMessage, fileUrls)
    } catch (error) {
      console.error('豆包API调用失败:', error.message)
      aiReply = `抱歉，AI服务暂时无法响应。错误信息：${error.message}`
    }

    // 保存AI回复
    const aiMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'ai', ?, 'doubao')`,
      [userId, sessionId, aiReply]
    )

    return success(res, {
      sessionId,
      messageId: aiMessageResult.insertId,
      aiReply,
      files: {
        success: successFiles,
        failed: failedFiles,
        total: req.files.length,
        successCount: successFiles.length,
        failedCount: failedFiles.length
      }
    }, `文件上传完成：成功 ${successFiles.length} 个，失败 ${failedFiles.length} 个，AI已开始分析`)

  } catch (error) {
    console.error('AI批量文件上传错误:', error)
    
    // 处理 multer 错误
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return badRequest(res, `文件大小超过限制（最大 ${config.cloudStorage.maxFileSize / 1024 / 1024}MB）`)
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return badRequest(res, '文件数量超过限制（最多5个）')
      }
      return badRequest(res, `上传失败: ${error.message}`)
    }

    // 处理文件类型错误
    if (error.message && error.message.includes('不支持的文件类型')) {
      return badRequest(res, error.message)
    }

    return serverError(res, error.message || '文件上传失败')
  }
})

module.exports = router

