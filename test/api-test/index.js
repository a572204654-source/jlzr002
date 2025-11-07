/**
 * API测试主入口
 * 
 * 使用方法：
 * 1. 安装依赖：cd test/api-test && npm install
 * 2. 确保服务已启动：npm start (在项目根目录)
 * 3. 运行测试：npm test (在test/api-test目录)
 */

const config = require('./config')
const logger = require('./utils/logger')
const { runAuthTests } = require('./tests/auth.test')
const { runUserTests } = require('./tests/user.test')
const { runProjectTests } = require('./tests/project.test')
const { runWorkTests } = require('./tests/work.test')
const { runSupervisionLogTests } = require('./tests/supervision-log.test')
const { runAttachmentTests } = require('./tests/attachment.test')
const { runAiChatTests } = require('./tests/ai-chat.test')
const { runWeatherTests } = require('./tests/weather.test')

/**
 * 运行所有测试
 */
async function runAllTests() {
  // 设置AI Mock模式环境变量
  if (config.aiMockMode) {
    process.env.AI_MOCK_MODE = 'true'
  }
  
  // 开始测试
  logger.startTest()
  
  try {
    // 1. 认证测试（必须最先执行，获取token）
    await runAuthTests()
    
    // 2. 用户测试
    await runUserTests()
    
    // 3. 项目管理测试
    await runProjectTests()
    
    // 4. 工程管理测试（依赖项目）
    await runWorkTests()
    
    // 5. 监理日志测试（依赖项目和工程）
    await runSupervisionLogTests()
    
    // 6. 附件管理测试（依赖监理日志）
    await runAttachmentTests()
    
    // 7. AI对话测试
    await runAiChatTests()
    
    // 8. 天气查询测试
    await runWeatherTests()
    
  } catch (error) {
    console.error('\n测试过程中发生严重错误:'.red, error)
  }
  
  // 结束测试并输出统计
  const failedCount = logger.endTest()
  
  // 退出进程（失败数作为退出码）
  process.exit(failedCount > 0 ? 1 : 0)
}

// 运行测试
runAllTests()

