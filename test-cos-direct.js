/**
 * 直接测试COS上传（不通过API）
 */

const { uploadFile } = require('./utils/cloudStorageCOS')
const fs = require('fs')
const path = require('path')

// 测试文件路径
const TEST_FILE_PATH = 'C:\\Users\\admin\\Desktop\\后端 - 副本\\docs\\导出格式.doc'

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

async function testCOSUpload() {
  log('\n========================================', 'blue')
  log('  直接测试COS上传', 'blue')
  log('========================================\n', 'blue')

  try {
    // 检查文件是否存在
    if (!fs.existsSync(TEST_FILE_PATH)) {
      logError(`文件不存在: ${TEST_FILE_PATH}`)
      process.exit(1)
    }

    const fileStats = fs.statSync(TEST_FILE_PATH)
    logInfo(`文件信息: ${path.basename(TEST_FILE_PATH)}, 大小: ${(fileStats.size / 1024).toFixed(2)} KB`)

    // 读取文件
    const fileContent = fs.readFileSync(TEST_FILE_PATH)
    logInfo('文件读取成功')

    // 上传文件
    logInfo('正在上传文件到COS...')
    const result = await uploadFile(fileContent, path.basename(TEST_FILE_PATH), 'test-uploads')

    logSuccess('文件上传成功！')
    logInfo('上传结果:')
    console.log(JSON.stringify(result, null, 2))

  } catch (error) {
    logError('上传失败:')
    logError(error.message)
    console.error(error)
    process.exit(1)
  }
}

testCOSUpload()

