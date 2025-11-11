/**
 * 测试文件上传API（使用 /api/upload 接口）
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
 * 步骤2: 上传文件（使用 /api/upload 接口）
 */
async function uploadFile(token, filePath) {
  try {
    logInfo('步骤2: 正在上传文件...')
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`)
    }

    const fileStats = fs.statSync(filePath)
    logInfo(`文件信息: ${path.basename(filePath)}, 大小: ${(fileStats.size / 1024).toFixed(2)} KB`)

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
 * 主测试函数
 */
async function runTests() {
  log('\n========================================', 'blue')
  log('  文件上传API测试', 'blue')
  log('========================================\n', 'blue')

  let token = null

  try {
    // 步骤1: 登录
    token = await login()
    console.log('')

    // 步骤2: 上传文件
    await uploadFile(token, TEST_FILE_PATH)
    console.log('')

    logSuccess('所有测试完成！', 'green')
    log('\n========================================', 'blue')
    log('  测试总结', 'blue')
    log('========================================\n', 'blue')
    logSuccess('✅ 登录成功')
    logSuccess('✅ 文件上传成功')

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

