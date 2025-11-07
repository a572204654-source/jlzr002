/**
 * API测试主入口
 * 运行所有模块的测试
 */

const authTest = require('./tests/auth.test')
const userTest = require('./tests/user.test')
const projectTest = require('./tests/project.test')
const workTest = require('./tests/work.test')
const supervisionLogTest = require('./tests/supervision-log.test')
const attachmentTest = require('./tests/attachment.test')
const aiChatTest = require('./tests/ai-chat.test')
const weatherTest = require('./tests/weather.test')
const logger = require('./utils/logger')
const http = require('./utils/http')
require('dotenv').config()

/**
 * 主测试函数
 */
async function runAllTests() {
  logger.title('CloudBase 监理日志小程序 - API接口测试')
  
  console.log('测试环境:', process.env.API_BASE_URL || 'http://localhost:80')
  console.log('开始时间:', new Date().toLocaleString())
  console.log('\n')
  
  const results = []
  let projectId = null
  let workId = null
  
  try {
    // 1. 认证模块测试（必须先执行，获取token）
    const authResult = await authTest.runAllTests()
    results.push(authResult)
    
    // 从认证测试中获取token
    if (authTest.testData && authTest.testData.token) {
      http.setToken(authTest.testData.token)
      logger.success('已设置token，后续测试将使用此token')
    }
    
    // 2. 用户模块测试
    const userResult = await userTest.runAllTests()
    results.push(userResult)
    
    // 3. 项目模块测试
    const projectResult = await projectTest.runAllTests()
    results.push(projectResult)
    
    // 获取项目ID供后续测试使用
    if (projectTest.testData && projectTest.testData.projectId) {
      projectId = projectTest.testData.projectId
      logger.info('使用项目ID进行后续测试', { projectId })
    }
    
    // 4. 工程模块测试
    const workResult = await workTest.runAllTests(projectId)
    results.push(workResult)
    
    // 获取工程ID和项目ID供后续测试使用
    if (workTest.testData && workTest.testData.workId) {
      workId = workTest.testData.workId
      projectId = workTest.testData.projectId || projectId
      logger.info('使用工程ID和项目ID进行后续测试', { workId, projectId })
    }
    
    // 5. 监理日志模块测试
    const logResult = await supervisionLogTest.runAllTests(workId, projectId)
    results.push(logResult)
    
    // 6. 附件模块测试
    const attachmentResult = await attachmentTest.runAllTests()
    results.push(attachmentResult)
    
    // 7. AI助手模块测试
    const aiResult = await aiChatTest.runAllTests()
    results.push(aiResult)

    // 8. 气象模块测试
    const weatherResult = await weatherTest.testWeatherModule()
    weatherResult.module = '气象模块'
    results.push(weatherResult)
    
  } catch (error) {
    logger.error('测试过程中发生异常', error)
  }
  
  // 汇总统计
  printSummary(results)
  
  // 返回结果
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
  return totalFailed === 0
}

/**
 * 打印测试汇总
 */
function printSummary(results) {
  console.log('\n')
  logger.title('测试汇总')
  
  const totalTests = results.reduce((sum, r) => sum + r.total, 0)
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
  
  console.log('模块测试结果:')
  console.log('─'.repeat(60))
  
  results.forEach(result => {
    const status = result.failed === 0 ? '✓' : '✗'
    const color = result.failed === 0 ? '\x1b[32m' : '\x1b[31m'
    const reset = '\x1b[0m'
    
    console.log(`${color}${status}${reset} ${result.module.padEnd(20)} 通过: ${result.passed}/${result.total}`)
  })
  
  console.log('─'.repeat(60))
  console.log('\n')
  
  logger.info('总体统计', {
    总测试数: totalTests,
    通过: totalPassed,
    失败: totalFailed,
    通过率: `${((totalPassed / totalTests) * 100).toFixed(2)}%`
  })
  
  console.log('\n结束时间:', new Date().toLocaleString())
  
  if (totalFailed === 0) {
    logger.success('🎉 所有测试通过！')
  } else {
    logger.error(`❌ 有 ${totalFailed} 个测试失败`)
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    logger.error('测试运行失败', error)
    process.exit(1)
  })
}

module.exports = {
  runAllTests
}

