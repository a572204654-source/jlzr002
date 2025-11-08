/**
 * 本地测试监理日志导出Word功能
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// 本地服务器URL
const LOCAL_URL = 'http://localhost:80'

// 测试配置
const testConfig = {
  testOpenid: 'test_openid_888888',
  outputDir: './test-output'
}

let token = null

/**
 * 登录获取token
 */
async function login() {
  try {
    console.log('========== 登录 ==========')
    const response = await axios.post(`${LOCAL_URL}/api/auth/test-login`, {
      openid: testConfig.testOpenid
    })

    if (response.data.code === 0) {
      token = response.data.data.token
      console.log('✓ 登录成功')
      console.log('用户:', response.data.data.userInfo.nickname)
      return true
    }
    return false
  } catch (error) {
    console.error('✗ 登录失败:', error.message)
    return false
  }
}

/**
 * 获取监理日志列表
 */
async function getSupervisionLogs() {
  try {
    console.log('\n========== 获取监理日志列表 ==========')
    const response = await axios.get(`${LOCAL_URL}/api/supervision-logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        pageSize: 5
      }
    })

    if (response.data.code === 0) {
      const logs = response.data.data.list
      console.log(`✓ 获取成功，共 ${logs.length} 条`)
      return logs
    }
    return []
  } catch (error) {
    console.error('✗ 获取失败:', error.message)
    return []
  }
}

/**
 * 导出Word
 */
async function exportWord(logId) {
  try {
    console.log(`\n========== 导出日志 ID: ${logId} ==========`)
    const response = await axios.get(`${LOCAL_URL}/api/supervision-logs/${logId}/export`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    })

    // 确保输出目录存在
    if (!fs.existsSync(testConfig.outputDir)) {
      fs.mkdirSync(testConfig.outputDir, { recursive: true })
    }

    // 保存文件
    const filename = `监理日志_本地测试_${logId}_${Date.now()}.docx`
    const filepath = path.join(testConfig.outputDir, filename)
    fs.writeFileSync(filepath, response.data)

    console.log('✓ 导出成功')
    console.log('文件:', filepath)
    console.log('大小:', (response.data.length / 1024).toFixed(2), 'KB')
    return true
  } catch (error) {
    console.error('✗ 导出失败:', error.message)
    if (error.response && error.response.data) {
      try {
        const errorData = JSON.parse(Buffer.from(error.response.data).toString())
        console.error('错误信息:', errorData)
      } catch (e) {
        console.error('状态码:', error.response.status)
      }
    }
    return false
  }
}

/**
 * 主测试流程
 */
async function runTest() {
  console.log('=================================================')
  console.log('  监理日志导出Word功能测试（本地环境）')
  console.log('=================================================')

  // 登录
  const loginSuccess = await login()
  if (!loginSuccess) {
    console.log('\n❌ 测试失败：登录失败')
    return
  }

  // 获取日志列表
  const logs = await getSupervisionLogs()
  if (logs.length === 0) {
    console.log('\n⚠ 没有监理日志数据')
    return
  }

  // 测试导出第一条
  const success = await exportWord(logs[0].id)
  
  console.log('\n=================================================')
  console.log('测试结果:', success ? '✅ 成功' : '❌ 失败')
  console.log('=================================================')
}

// 运行测试
setTimeout(() => {
  runTest().catch(error => {
    console.error('\n❌ 测试失败:', error)
    process.exit(1)
  })
}, 3000) // 等待3秒让服务器启动

