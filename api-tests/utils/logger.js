/**
 * 日志工具
 * 提供彩色日志输出
 */

const colors = require('colors')

/**
 * 成功日志
 */
function success(message, data = null) {
  console.log(colors.green('✓ ' + message))
  if (data) {
    console.log(colors.gray(JSON.stringify(data, null, 2)))
  }
}

/**
 * 错误日志
 */
function error(message, err = null) {
  console.log(colors.red('✗ ' + message))
  if (err) {
    if (err.message) {
      console.log(colors.red('  ' + err.message))
    }
    if (err.code !== undefined) {
      console.log(colors.red(`  错误码: ${err.code}`))
    }
  }
}

/**
 * 信息日志
 */
function info(message, data = null) {
  console.log(colors.cyan('ℹ ' + message))
  if (data) {
    console.log(colors.gray(JSON.stringify(data, null, 2)))
  }
}

/**
 * 警告日志
 */
function warn(message, data = null) {
  console.log(colors.yellow('⚠ ' + message))
  if (data) {
    console.log(colors.gray(JSON.stringify(data, null, 2)))
  }
}

/**
 * 测试标题
 */
function title(message) {
  console.log('\n' + colors.bold.cyan('═'.repeat(60)))
  console.log(colors.bold.cyan('  ' + message))
  console.log(colors.bold.cyan('═'.repeat(60)) + '\n')
}

/**
 * 模块标题
 */
function moduleTitle(message) {
  console.log('\n' + colors.bold.blue('━━━ ' + message + ' ━━━'))
}

/**
 * 分隔线
 */
function divider() {
  console.log(colors.gray('─'.repeat(60)))
}

module.exports = {
  success,
  error,
  info,
  warn,
  title,
  module: moduleTitle,
  divider
}

