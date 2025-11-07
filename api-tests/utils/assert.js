/**
 * 断言工具
 * 提供简单的测试断言功能
 */

const logger = require('./logger')

/**
 * 断言相等
 */
function assertEqual(actual, expected, message) {
  if (actual === expected) {
    logger.success(message || `断言通过: ${actual} === ${expected}`)
    return true
  } else {
    logger.error(message || `断言失败: ${actual} !== ${expected}`)
    return false
  }
}

/**
 * 断言真值
 */
function assertTrue(value, message) {
  if (value) {
    logger.success(message || '断言通过: 值为真')
    return true
  } else {
    logger.error(message || '断言失败: 值为假')
    return false
  }
}

/**
 * 断言存在
 */
function assertExists(value, message) {
  if (value !== undefined && value !== null) {
    logger.success(message || '断言通过: 值存在')
    return true
  } else {
    logger.error(message || '断言失败: 值不存在')
    return false
  }
}

/**
 * 断言响应成功
 */
function assertSuccess(response, message) {
  if (response && response.code === 0) {
    logger.success(message || '接口调用成功')
    return true
  } else {
    logger.error(message || '接口调用失败', response)
    return false
  }
}

/**
 * 断言包含字段
 */
function assertHasField(obj, field, message) {
  if (obj && obj.hasOwnProperty(field)) {
    logger.success(message || `断言通过: 包含字段 ${field}`)
    return true
  } else {
    logger.error(message || `断言失败: 缺少字段 ${field}`)
    return false
  }
}

/**
 * 断言数组不为空
 */
function assertNotEmpty(arr, message) {
  if (Array.isArray(arr) && arr.length > 0) {
    logger.success(message || `断言通过: 数组长度为 ${arr.length}`)
    return true
  } else {
    logger.error(message || '断言失败: 数组为空')
    return false
  }
}

module.exports = {
  assertEqual,
  assertTrue,
  assertExists,
  assertSuccess,
  assertHasField,
  assertNotEmpty
}

