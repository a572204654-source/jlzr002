/**
 * 测试监理日志导出Word功能
 * 连接云托管环境进行测试
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// 云托管环境URL
const CLOUDRUN_URL = 'https://api.yimengpl.com'

// 测试配置
const testConfig = {
  // 测试账号openid（从数据库中获取已存在的用户）
  testOpenid: 'test_openid_888888',  // 测试openid
  // 输出目录
  outputDir: './test-output'
}

let token = null

/**
 * 步骤0: 创建测试用户（如果不存在）
 */
async function createTestUser() {
  try {
    console.log('\n========== 步骤0: 创建测试用户 ==========')
    console.log('请求URL:', `${CLOUDRUN_URL}/api/auth/login`)
    console.log('使用测试code创建用户...')
    
    const response = await axios.post(`${CLOUDRUN_URL}/api/auth/login`, {
      code: 'test_wechat_code_888888'
    })

    if (response.data.code === 0) {
      console.log('✓ 测试用户创建/登录成功')
      return true
    } else {
      console.log('⚠ 创建用户响应:', response.data.message)
      return false
    }
  } catch (error) {
    // 这个错误是预期的，因为生产环境不支持测试code
    console.log('⚠ 注意: 云托管环境可能不支持测试code，将尝试使用已存在的用户')
    return true  // 继续执行
  }
}

/**
 * 步骤1: 登录获取token（使用test-login接口）
 */
async function login() {
  try {
    console.log('\n========== 步骤1: 测试登录 ==========')
    console.log('请求URL:', `${CLOUDRUN_URL}/api/auth/test-login`)
    console.log('使用openid:', testConfig.testOpenid)
    
    const response = await axios.post(`${CLOUDRUN_URL}/api/auth/test-login`, {
      openid: testConfig.testOpenid
    })

    if (response.data.code === 0) {
      token = response.data.data.token
      console.log('✓ 登录成功')
      console.log('用户信息:', response.data.data.userInfo.nickname)
      console.log('Token:', token.substring(0, 20) + '...')
      return true
    } else {
      console.log('✗ 登录失败:', response.data.message)
      console.log('提示: 需要在数据库中有对应openid的用户')
      return false
    }
  } catch (error) {
    console.error('✗ 登录错误:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
    return false
  }
}

/**
 * 步骤2: 获取监理日志列表
 */
async function getSupervisionLogs() {
  try {
    console.log('\n========== 步骤2: 获取监理日志列表 ==========')
    
    const response = await axios.get(`${CLOUDRUN_URL}/api/supervision-logs`, {
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
      console.log(`✓ 获取成功，共 ${logs.length} 条记录`)
      
      if (logs.length > 0) {
        console.log('\n日志列表:')
        logs.forEach((log, index) => {
          console.log(`${index + 1}. ID: ${log.id}, 项目: ${log.projectName}, 工程: ${log.workName}, 日期: ${log.logDateText}`)
        })
        return logs
      } else {
        console.log('⚠ 没有找到监理日志')
        return []
      }
    } else {
      console.log('✗ 获取失败:', response.data.message)
      return []
    }
  } catch (error) {
    console.error('✗ 获取错误:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
    return []
  }
}

/**
 * 步骤3: 测试导出Word
 */
async function exportWord(logId) {
  try {
    console.log(`\n========== 步骤3: 导出监理日志 ID: ${logId} ==========`)
    
    const response = await axios.get(`${CLOUDRUN_URL}/api/supervision-logs/${logId}/export`, {
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
    const filename = `监理日志_${logId}_${Date.now()}.docx`
    const filepath = path.join(testConfig.outputDir, filename)
    fs.writeFileSync(filepath, response.data)

    console.log('✓ 导出成功')
    console.log('文件路径:', filepath)
    console.log('文件大小:', (response.data.length / 1024).toFixed(2), 'KB')
    
    return true
  } catch (error) {
    console.error('✗ 导出错误:', error.message)
    if (error.response) {
      // 如果是错误响应，尝试解析错误信息
      try {
        const errorData = JSON.parse(Buffer.from(error.response.data).toString())
        console.error('错误详情:', errorData)
      } catch (e) {
        console.error('响应状态:', error.response.status)
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
  console.log('     监理日志导出Word功能测试（云托管环境）')
  console.log('=================================================')
  console.log('测试环境:', CLOUDRUN_URL)
  console.log('测试时间:', new Date().toLocaleString('zh-CN'))

  // 步骤0: 尝试创建测试用户
  await createTestUser()

  // 步骤1: 登录
  const loginSuccess = await login()
  if (!loginSuccess) {
    console.log('\n❌ 测试失败：登录失败')
    console.log('💡 提示: 请确保数据库中存在openid为 "test_openid_888888" 的用户')
    return
  }

  // 步骤2: 获取监理日志列表
  const logs = await getSupervisionLogs()
  if (logs.length === 0) {
    console.log('\n⚠ 无法继续测试：没有监理日志数据')
    return
  }

  // 步骤3: 测试导出前3条（或更少）
  console.log('\n========== 开始批量导出测试 ==========')
  const testCount = Math.min(3, logs.length)
  let successCount = 0

  for (let i = 0; i < testCount; i++) {
    const log = logs[i]
    const success = await exportWord(log.id)
    if (success) {
      successCount++
    }
    // 等待1秒避免请求过快
    if (i < testCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // 测试总结
  console.log('\n=================================================')
  console.log('                  测试总结')
  console.log('=================================================')
  console.log(`测试数量: ${testCount}`)
  console.log(`成功: ${successCount}`)
  console.log(`失败: ${testCount - successCount}`)
  console.log(`成功率: ${((successCount / testCount) * 100).toFixed(2)}%`)
  
  if (successCount === testCount) {
    console.log('\n✅ 所有测试通过！')
    console.log(`导出的文件保存在: ${path.resolve(testConfig.outputDir)}`)
  } else {
    console.log('\n⚠ 部分测试失败，请检查错误信息')
  }
}

// 运行测试
runTest().catch(error => {
  console.error('\n❌ 测试执行失败:', error)
  process.exit(1)
})

