/**
 * 综合测试：文件上传 + 豆包AI
 * 测试云托管服务：https://api.yimengpl.com/
 * 
 * 测试流程：
 * 1. 登录获取token
 * 2. 创建AI会话
 * 3. 上传文件到云存储（/api/upload）
 * 4. 上传文件并发送给AI（/api/v1/ai-chat/upload-file）
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
const TEST_CODE = 'test_wechat_code_upload_doubao_test'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

function logStep(message) {
  log(`\n📋 ${message}`, 'magenta')
}

/**
 * 步骤1: 登录获取token
 */
async function login() {
  try {
    logStep('步骤1: 登录获取token')
    logInfo('正在连接云托管服务...')
    
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
      if (error.response.data) {
        logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
      }
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
    logStep('步骤2: 创建AI会话')
    logInfo('正在创建AI对话会话...')
    
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
      if (error.response.data) {
        logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
      }
    } else {
      logError(`创建会话失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 步骤3: 上传文件到云存储（测试基础上传功能）
 */
async function uploadFileToStorage(token, filePath) {
  try {
    logStep('步骤3: 上传文件到云存储（基础测试）')
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`)
    }

    const fileStats = fs.statSync(filePath)
    logInfo(`文件信息:`)
    logInfo(`  文件名: ${path.basename(filePath)}`)
    logInfo(`  大小: ${(fileStats.size / 1024).toFixed(2)} KB`)
    logInfo(`  类型: ${path.extname(filePath)}`)

    // 创建FormData
    const formData = new FormData()
    formData.append('file', fs.createReadStream(filePath))
    formData.append('folder', 'test-uploads')

    logInfo('正在上传文件到云存储...')
    
    const response = await axios.post(
      `${BASE_URL}/api/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    if (response.data.code === 0) {
      logSuccess('文件上传成功！')
      logInfo('上传结果:')
      console.log(JSON.stringify(response.data.data, null, 2))
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
 * 步骤4: 上传文件并发送给AI（测试豆包功能）
 */
async function uploadFileToAI(token, sessionId, filePath) {
  try {
    logStep('步骤4: 上传文件并发送给AI（测试豆包返回数据）')
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`)
    }

    const fileStats = fs.statSync(filePath)
    logInfo(`文件信息:`)
    logInfo(`  文件名: ${path.basename(filePath)}`)
    logInfo(`  大小: ${(fileStats.size / 1024).toFixed(2)} KB`)

    // 创建FormData
    const formData = new FormData()
    formData.append('file', fs.createReadStream(filePath))
    formData.append('sessionId', sessionId)
    formData.append('message', '请分析这个文件的内容，并简要说明文件的主要内容和格式。')

    logInfo('正在上传文件并发送给AI...')
    logInfo('等待豆包AI分析文件...')
    
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/upload-file`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 180000, // 3分钟超时，因为AI分析可能需要较长时间
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    if (response.data.code === 0) {
      logSuccess('文件上传成功，AI已开始分析！')
      logInfo('\n📄 文件信息:')
      console.log(JSON.stringify(response.data.data.fileInfo, null, 2))
      logInfo('\n🤖 豆包AI回复:')
      log(response.data.data.aiReply, 'cyan')
      logInfo('\n📊 完整响应数据:')
      console.log(JSON.stringify(response.data.data, null, 2))
      return response.data.data
    } else {
      throw new Error(response.data.message || '文件上传失败')
    }
  } catch (error) {
    if (error.response) {
      logError(`文件上传并发送给AI失败: ${error.response.data.message || error.response.statusText}`)
      if (error.response.data) {
        logError(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`)
      }
    } else {
      logError(`文件上传并发送给AI失败: ${error.message}`)
    }
    throw error
  }
}

/**
 * 步骤5: 测试普通AI对话（验证豆包API正常）
 */
async function testNormalChat(token, sessionId) {
  try {
    logStep('步骤5: 测试普通AI对话（验证豆包API）')
    
    const testMessage = '你好，请简单介绍一下你自己'
    logInfo(`发送消息: "${testMessage}"`)
    logInfo('等待豆包AI回复...')
    
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/send`,
      {
        sessionId: sessionId,
        content: testMessage
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
      logSuccess('AI对话成功！')
      logInfo('\n🤖 豆包AI回复:')
      log(response.data.data.aiReply, 'cyan')
      return response.data.data
    } else {
      throw new Error(response.data.message || 'AI对话失败')
    }
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
  log('\n' + '='.repeat(60), 'blue')
  log('  综合测试：文件上传 + 豆包AI', 'blue')
  log('  云托管服务：https://api.yimengpl.com/', 'blue')
  log('='.repeat(60) + '\n', 'blue')

  let token = null
  let sessionId = null

  try {
    // 步骤1: 登录
    token = await login()
    console.log('')

    // 步骤2: 创建会话
    sessionId = await createSession(token)
    console.log('')

    // 步骤3: 上传文件到云存储（基础测试）
    await uploadFileToStorage(token, TEST_FILE_PATH)
    console.log('')

    // 步骤4: 上传文件并发送给AI（测试豆包功能）
    await uploadFileToAI(token, sessionId, TEST_FILE_PATH)
    console.log('')

    // 步骤5: 测试普通AI对话（验证豆包API正常）
    await testNormalChat(token, sessionId)
    console.log('')

    // 测试总结
    logSuccess('所有测试完成！')
    log('\n' + '='.repeat(60), 'blue')
    log('  测试总结', 'blue')
    log('='.repeat(60) + '\n', 'blue')
    logSuccess('✅ 登录成功')
    logSuccess('✅ AI会话创建成功')
    logSuccess('✅ 文件上传到云存储成功')
    logSuccess('✅ 文件上传并发送给AI成功')
    logSuccess('✅ 豆包AI返回数据正常')
    logSuccess('✅ 普通AI对话功能正常')
    log('\n' + '='.repeat(60) + '\n', 'blue')

  } catch (error) {
    logError('\n测试过程中出现错误:')
    logError(error.message)
    if (error.stack) {
      logError('\n错误堆栈:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// 运行测试
runTests().catch(error => {
  logError('测试执行失败:')
  console.error(error)
  process.exit(1)
})
