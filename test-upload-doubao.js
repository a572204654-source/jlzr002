/**
 * 测试文件上传和豆包API
 * 测试云托管服务：https://api.yimengpl.com/
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// 云托管服务地址
const BASE_URL = 'https://api.yimengpl.com'

// 测试文件路径
const TEST_FILE_PATH = 'C:\\Users\\admin\\Desktop\\后端 - 副本\\docs\\导出格式.doc'

// 测试用户登录code（使用测试模式）
const TEST_CODE = 'test_wechat_code_upload_test'

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
      logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
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
      logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
    } else {
      logError(`创建会话失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 步骤3: 上传文件并发送给AI
 */
async function uploadFileAndChat(token, sessionId, filePath) {
  try {
    logInfo('步骤3: 正在上传文件并发送给AI...')
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`)
    }

    const fileStats = fs.statSync(filePath)
    logInfo(`文件信息: ${path.basename(filePath)}, 大小: ${(fileStats.size / 1024).toFixed(2)} KB`)

    // 创建FormData
    const formData = new FormData()
    formData.append('file', fs.createReadStream(filePath))
    formData.append('sessionId', sessionId)
    formData.append('message', '请分析这个文件的内容和格式')

    logInfo('正在上传文件到云存储...')
    
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/upload-file`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 120000, // 120秒超时，因为需要上传文件并等待AI响应
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    if (response.data.code === 0) {
      logSuccess('文件上传成功！')
      logInfo('文件信息:')
      console.log(JSON.stringify(response.data.data.fileInfo, null, 2))
      
      logSuccess('AI回复:')
      console.log(response.data.data.aiReply)
      
      return response.data.data
    } else {
      throw new Error(response.data.message || '文件上传失败')
    }
  } catch (error) {
    if (error.response) {
      logError(`文件上传失败: ${error.response.data.message || error.response.statusText}`)
      if (error.response.data) {
        logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
      }
    } else {
      logError(`文件上传失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 步骤4: 测试简单的AI对话（验证豆包API）
 */
async function testSimpleChat(token, sessionId) {
  try {
    logInfo('步骤4: 正在测试简单的AI对话...')
    
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/send`,
      {
        sessionId: sessionId,
        content: '你好，请简单介绍一下你自己'
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
      logSuccess('AI对话测试成功！')
      logInfo('AI回复:')
      console.log(response.data.data.aiReply)
      return response.data.data
    } else {
      throw new Error(response.data.message || 'AI对话失败')
    }
  } catch (error) {
    if (error.response) {
      logError(`AI对话失败: ${error.response.data.message || error.response.statusText}`)
      logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
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
  log('  文件上传和豆包API测试', 'blue')
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

    // 步骤3: 上传文件并测试AI
    logWarning('注意: 文件上传和AI分析可能需要较长时间，请耐心等待...')
    console.log('')
    await uploadFileAndChat(token, sessionId, TEST_FILE_PATH)
    console.log('')

    // 步骤4: 测试简单对话
    await testSimpleChat(token, sessionId)
    console.log('')

    logSuccess('所有测试完成！', 'green')
    log('\n========================================', 'blue')
    log('  测试总结', 'blue')
    log('========================================\n', 'blue')
    logSuccess('✅ 登录成功')
    logSuccess('✅ 会话创建成功')
    logSuccess('✅ 文件上传成功')
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

