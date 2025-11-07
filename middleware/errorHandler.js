const { serverError } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('服务器错误:', err);

  // 如果响应已经发送，则交给默认错误处理
  if (res.headersSent) {
    return next(err);
  }

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      code: 400,
      message: '数据已存在',
      data: null,
      timestamp: Date.now()
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: 'Token无效或已过期',
      data: null,
      timestamp: Date.now()
    });
  }

  // 默认服务器错误
  return serverError(res, err.message || '服务器内部错误');
}

/**
 * 404错误处理
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    data: null,
    timestamp: Date.now()
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};

