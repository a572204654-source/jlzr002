/**
 * 仅测试豆包API（不测试文件上传）
 * 测试云托管服务：https://api.yimengpl.com/
 */

const axios = require('axios')

// 云托管服务地址
const BASE_URL = 'https://api.yimengpl.com'

// 测试用户登录code（使用测试模式）
const TEST_CODE = 'test_wechat_code_doubao_test'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

/**
 * 步骤1: 登录获取token
 */
async function login() {
  try {
    logInfo('步骤1: 正在登录获取token...')
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      code: TEST_CODE
    }, {
      timeout: 10000
    })

    if (response.data.code === 0 && response.data.data.token) {
      logSuccess(`登录成功，获取到token: ${response.data.data.token.substring(0, 20)}...`)
      return response.data.data.token
    } else {
      throw new Error(response.data.message || '登录失败')
    }
  } catch (error) {
    if (error.response) {
      logError(`登录失败: ${error.response.data.message || error.response.statusText}`)
    } else {
      logError(`登录失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 步骤2: 创建AI会话
 */
async function createSession(token) {
  try {
    logInfo('步骤2: 正在创建AI会话...')
    
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/session`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    if (response.data.code === 0 && response.data.data.sessionId) {
      logSuccess(`会话创建成功: ${response.data.data.sessionId}`)
      return response.data.data.sessionId
    } else {
      throw new Error(response.data.message || '创建会话失败')
    }
  } catch (error) {
    if (error.response) {
      logError(`创建会话失败: ${error.response.data.message || error.response.statusText}`)
    } else {
      logError(`创建会话失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 步骤3: 测试AI对话（验证豆包API）
 */
async function testChat(token, sessionId) {
  try {
    logInfo('步骤3: 正在测试AI对话...')
    
    const testMessages = [
      '你好，请简单介绍一下你自己',
      '请用一句话说明你的功能',
      '1+1等于几？'
    ]

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i]
      logInfo(`\n测试消息 ${i + 1}/${testMessages.length}: "${message}"`)
      
      const response = await axios.post(
        `${BASE_URL}/api/v1/ai-chat/send`,
        {
          sessionId: sessionId,
          content: message
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      )

      if (response.data.code === 0) {
        logSuccess('AI回复:')
        console.log(response.data.data.aiReply)
        console.log('')
      } else {
        throw new Error(response.data.message || 'AI对话失败')
      }
    }

    return true
  } catch (error) {
    if (error.response) {
      logError(`AI对话失败: ${error.response.data.message || error.response.statusText}`)
      if (error.response.data) {
        logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
      }
    } else {
      logError(`AI对话失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  log('\n========================================', 'blue')
  log('  豆包API测试（不测试文件上传）', 'blue')
  log('========================================\n', 'blue')

  let token = null
  let sessionId = null

  try {
    // 步骤1: 登录
    token = await login()
    console.log('')

    // 步骤2: 创建会话
    sessionId = await createSession(token)
    console.log('')

    // 步骤3: 测试AI对话
    await testChat(token, sessionId)
    console.log('')

    logSuccess('所有测试完成！', 'green')
    log('\n========================================', 'blue')
    log('  测试总结', 'blue')
    log('========================================\n', 'blue')
    logSuccess('✅ 登录成功')
    logSuccess('✅ 会话创建成功')
    logSuccess('✅ 豆包API调用成功')
    logSuccess('✅ AI对话功能正常')

  } catch (error) {
    logError('\n测试过程中出现错误:')
    logError(error.message)
    console.error(error)
    process.exit(1)
  }
}

// 运行测试
runTests().catch(error => {
  logError('测试执行失败:')
  console.error(error)
  process.exit(1)
})

