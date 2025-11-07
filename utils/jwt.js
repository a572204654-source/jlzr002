const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 生成JWT Token
 * @param {Object} payload - 载荷数据
 * @returns {String} token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

/**
 * 验证JWT Token
 * @param {String} token - JWT token
 * @returns {Object} 解密后的数据
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Token无效或已过期');
  }
}

/**
 * 解码JWT Token（不验证）
 * @param {String} token - JWT token
 * @returns {Object} 解密后的数据
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};

