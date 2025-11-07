const crypto = require('crypto')

/**
 * MD5加密
 * @param {string} str 需要加密的字符串
 * @returns {string} 加密后的字符串（32位小写）
 */
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

/**
 * MD5加密（加盐）
 * @param {string} str 需要加密的字符串
 * @param {string} salt 盐值
 * @returns {string} 加密后的字符串
 */
function md5WithSalt(str, salt = 'cloudbase_miniapp') {
  return md5(str + salt)
}

/**
 * 验证密码
 * @param {string} password 明文密码
 * @param {string} encryptedPassword 加密后的密码
 * @param {string} salt 盐值
 * @returns {boolean} 是否匹配
 */
function verifyPassword(password, encryptedPassword, salt = 'cloudbase_miniapp') {
  return md5WithSalt(password, salt) === encryptedPassword
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @returns {string} 随机字符串
 */
function randomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}

module.exports = {
  md5,
  md5WithSalt,
  verifyPassword,
  randomString
}

