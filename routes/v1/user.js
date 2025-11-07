const express = require('express')
const router = express.Router()
const { success, badRequest, serverError, unauthorized } = require('../../utils/response')
const { code2Session } = require('../../utils/wechat')
const { generateToken } = require('../../utils/jwt')
const { query } = require('../../config/database')
const { authenticate } = require('../../middleware/auth')

/**
 * 微信登录
 * POST /api/v1/auth/wechat-login
 */
router.post('/auth/wechat-login', async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return badRequest(res, '缺少登录code')
    }

    let openid, sessionKey, unionid

    // 🧪 开发环境：支持测试code
    if (process.env.NODE_ENV === 'development' && code.startsWith('test_wechat_code_')) {
      console.log('🧪 [测试模式] 使用测试登录code:', code)
      openid = 'test_openid_888888'
      sessionKey = 'test_session_key'
      unionid = ''
    } else {
      // 生产环境：调用真实微信API
      const result = await code2Session(code)
      openid = result.openid
      sessionKey = result.sessionKey
      unionid = result.unionid
    }

    // 查询用户是否存在
    let users = await query(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    )

    let user
    let isNewUser = false

    if (users.length === 0) {
      // 新用户，创建用户记录
      const result = await query(
        'INSERT INTO users (openid, unionid, nickname) VALUES (?, ?, ?)',
        [openid, unionid || '', `用户${Date.now().toString().slice(-6)}`]
      )

      user = {
        id: result.insertId,
        openid,
        unionid: unionid || '',
        nickname: `用户${Date.now().toString().slice(-6)}`,
        avatar: '',
        organization: ''
      }

      isNewUser = true
    } else {
      user = users[0]
    }

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      openid: user.openid
    })

    // 返回登录信息
    const message = (process.env.NODE_ENV === 'development' && req.body.code.startsWith('test_wechat_code_')) 
      ? '登录成功（测试模式）' 
      : '登录成功'

    return success(res, {
      token,
      isNewUser,
      userInfo: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        organization: user.organization
      }
    }, message)

  } catch (error) {
    console.error('登录错误:', error)
    return serverError(res, error.message || '登录失败')
  }
})

/**
 * 获取用户信息
 * GET /api/v1/user/info
 */
router.get('/user/info', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    // 查询用户信息
    const users = await query(
      'SELECT id, nickname, avatar, organization FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return unauthorized(res, '用户不存在')
    }

    const user = users[0]

    // 查询统计信息
    const [projectStats] = await query(
      `SELECT COUNT(DISTINCT p.id) as projectCount
       FROM projects p 
       WHERE p.creator_id = ?`,
      [userId]
    )

    const [logStats] = await query(
      `SELECT 
        COUNT(*) as logCount,
        COUNT(CASE WHEN DATE_FORMAT(log_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN 1 END) as monthLogCount
       FROM supervision_logs 
       WHERE user_id = ?`,
      [userId]
    )

    // 组装响应数据
    return success(res, {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      organization: user.organization,
      stats: {
        projectCount: projectStats.projectCount || 0,
        logCount: logStats.logCount || 0,
        monthLogCount: logStats.monthLogCount || 0
      }
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    return serverError(res, '获取用户信息失败')
  }
})

/**
 * 更新用户信息
 * PUT /api/v1/user/info
 */
router.put('/user/info', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { nickname, avatar, organization } = req.body

    // 更新用户信息
    await query(
      `UPDATE users SET 
        nickname = COALESCE(?, nickname),
        avatar = COALESCE(?, avatar),
        organization = COALESCE(?, organization),
        updated_at = NOW()
      WHERE id = ?`,
      [nickname ?? null, avatar ?? null, organization ?? null, userId]
    )

    return success(res, {}, '更新成功')

  } catch (error) {
    console.error('更新用户信息错误:', error)
    console.error('错误详情:', {
      message: error.message,
      sql: error.sql,
      sqlMessage: error.sqlMessage
    })
    return serverError(res, '更新用户信息失败')
  }
})

/**
 * 退出登录
 * POST /api/v1/auth/logout
 */
router.post('/auth/logout', authenticate, async (req, res) => {
  try {
    // 这里可以添加token黑名单逻辑
    // 目前只返回成功，前端清除token即可
    return success(res, {}, '退出成功')
  } catch (error) {
    console.error('退出登录错误:', error)
    return serverError(res, '退出登录失败')
  }
})

/**
 * 获取用户参与的项目列表
 * GET /api/v1/user/projects
 */
router.get('/user/projects', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const offset = (page - 1) * pageSize

    // 查询用户创建的项目
    const projects = await query(
      `SELECT 
        p.id, 
        p.project_name as projectName,
        p.project_code as projectCode,
        (SELECT COUNT(*) FROM works WHERE project_id = p.id) as workCount
       FROM projects p
       WHERE p.creator_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    )

    // 查询总数
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM projects WHERE creator_id = ?',
      [userId]
    )

    return success(res, {
      total: countResult.total,
      page,
      pageSize,
      list: projects
    })

  } catch (error) {
    console.error('获取用户项目列表错误:', error)
    return serverError(res, '获取项目列表失败')
  }
})

/**
 * 获取用户日志统计
 * GET /api/v1/user/log-stats
 */
router.get('/user/log-stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const month = req.query.month || new Date().toISOString().slice(0, 7) // YYYY-MM

    // 查询统计信息
    const [stats] = await query(
      `SELECT 
        COUNT(CASE WHEN DATE_FORMAT(log_date, '%Y-%m') = ? THEN 1 END) as monthCount,
        COUNT(*) as totalCount
       FROM supervision_logs 
       WHERE user_id = ?`,
      [month, userId]
    )

    return success(res, {
      monthCount: stats.monthCount || 0,
      totalCount: stats.totalCount || 0,
      submittedCount: stats.totalCount || 0,
      pendingCount: 0,
      passRate: '100%'
    })

  } catch (error) {
    console.error('获取用户日志统计错误:', error)
    return serverError(res, '获取统计信息失败')
  }
})

module.exports = router

