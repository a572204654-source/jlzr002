const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const { query } = require('../config/database');

/**
 * JWT认证中间件
 */
async function authenticate(req, res, next) {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.token;

    if (!token) {
      return unauthorized(res, '请提供认证Token');
    }

    // 验证token
    const decoded = verifyToken(token);
    
    // 查询用户信息
    const users = await query(
      'SELECT id, openid, nickname, avatar, organization FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return unauthorized(res, '用户不存在');
    }

    const user = users[0];

    // 将用户信息挂载到请求对象
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('认证错误:', error.message);
    return unauthorized(res, error.message || '认证失败');
  }
}

/**
 * 可选认证中间件（不强制要求登录）
 */
async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.token;

    if (token) {
      const decoded = verifyToken(token);
      const users = await query(
        'SELECT id, openid, nickname, avatar, organization FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users && users.length > 0) {
        req.user = users[0];
        req.userId = users[0].id;
      }
    }

    next();
  } catch (error) {
    // 可选认证失败不阻止请求
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth
};

