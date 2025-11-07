/**
 * 日志输出工具
 */

const colors = require('colors')

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: null,
  endTime: null
}

// 当前测试模块
let currentModule = ''

/**
 * 开始测试
 */
function startTest() {
  stats.startTime = Date.now()
  console.log('\n' + '='.repeat(60).cyan)
  console.log('  监理日志小程序 C端API 接口测试'.cyan.bold)
  console.log('='.repeat(60).cyan + '\n')
}

/**
 * 开始测试模块
 */
function startModule(moduleName) {
  currentModule = moduleName
  console.log(`\n${'►'.green} ${moduleName.bold}`)
  console.log('-'.repeat(60).gray)
}

/**
 * 测试成功
 */
function success(testName, data) {
  stats.total++
  stats.passed++
  console.log(`  ${'✓'.green} ${testName}`)
  if (data) {
    console.log(`    ${'返回:'.gray} ${JSON.stringify(data).gray}`)
  }
}

/**
 * 测试失败
 */
function fail(testName, error) {
  stats.total++
  stats.failed++
  console.log(`  ${'✗'.red} ${testName}`)
  console.log(`    ${'错误:'.red} ${error.message || JSON.stringify(error)}`.red)
}

/**
 * 信息输出
 */
function info(message) {
  console.log(`    ${'ℹ'.blue} ${message}`)
}

/**
 * 警告输出
 */
function warn(message) {
  console.log(`    ${'⚠'.yellow} ${message}`)
}

/**
 * 结束测试
 */
function endTest() {
  stats.endTime = Date.now()
  const duration = ((stats.endTime - stats.startTime) / 1000).toFixed(2)
  
  console.log('\n' + '='.repeat(60).cyan)
  console.log('  测试完成'.cyan.bold)
  console.log('='.repeat(60).cyan)
  console.log(`  总计: ${stats.total}`)
  console.log(`  通过: ${stats.passed.toString().green}`)
  console.log(`  失败: ${stats.failed.toString().red}`)
  console.log(`  耗时: ${duration}s`)
  console.log('='.repeat(60).cyan + '\n')
  
  // 返回失败数量（用于进程退出码）
  return stats.failed
}

/**
 * 重置统计
 */
function reset() {
  stats.total = 0
  stats.passed = 0
  stats.failed = 0
  stats.startTime = null
  stats.endTime = null
  currentModule = ''
}

module.exports = {
  startTest,
  startModule,
  success,
  fail,
  info,
  warn,
  endTest,
  reset,
  stats
}

