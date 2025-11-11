/**
 * 测试文件上传和豆包AI返回数据
 * 使用云托管自定义域名进行测试
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// 云托管自定义域名
const BASE_URL = 'https://api.yimengpl.com'

// 测试文件路径
const TEST_FILE_PATH = 'C:\\Users\\admin\\Desktop\\后端 - 副本\\docs\\导出格式.doc'

// 测试用的登录code（测试模式）
const TEST_CODE = 'test_wechat_code_upload_test'

// 全局变量存储token和sessionId
let token = ''
let sessionId = ''

/**
 * 步骤1: 登录获取token
 */
async function login() {
  try {
    console.log('\n=== 步骤1: 登录获取token ===')
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      code: TEST_CODE
    })
    
    if (response.data.code === 0) {
      token = response.data.data.token
      console.log('✅ 登录成功')
      console.log('Token:', token.substring(0, 50) + '...')
      console.log('用户信息:', {
        userId: response.data.data.userInfo.id,
        nickname: response.data.data.userInfo.nickname,
        isNewUser: response.data.data.isNewUser
      })
      return true
    } else {
      console.error('❌ 登录失败:', response.data.message)
      return false
    }
  } catch (error) {
    console.error('❌ 登录错误:', error.response?.data || error.message)
    return false
  }
}

/**
 * 步骤2: 创建AI会话
 */
async function createSession() {
  try {
    console.log('\n=== 步骤2: 创建AI会话 ===')
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/session`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.data.code === 0) {
      sessionId = response.data.data.sessionId
      console.log('✅ 会话创建成功')
      console.log('Session ID:', sessionId)
      return true
    } else {
      console.error('❌ 创建会话失败:', response.data.message)
      return false
    }
  } catch (error) {
    console.error('❌ 创建会话错误:', error.response?.data || error.message)
    return false
  }
}

/**
 * 步骤3: 上传文件并测试AI返回
 */
async function uploadFileAndTestAI() {
  try {
    console.log('\n=== 步骤3: 上传文件并测试AI返回 ===')
    
    // 检查文件是否存在
    if (!fs.existsSync(TEST_FILE_PATH)) {
      console.error('❌ 文件不存在:', TEST_FILE_PATH)
      return false
    }
    
    console.log('文件路径:', TEST_FILE_PATH)
    const fileStats = fs.statSync(TEST_FILE_PATH)
    console.log('文件大小:', (fileStats.size / 1024).toFixed(2), 'KB')
    
    // 创建FormData
    const formData = new FormData()
    formData.append('file', fs.createReadStream(TEST_FILE_PATH))
    formData.append('sessionId', sessionId)
    formData.append('message', '请分析这个文件的内容，并总结文件的主要信息')
    
    console.log('\n正在上传文件并调用AI分析...')
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/upload-file`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 120000 // 120秒超时，因为AI分析可能需要较长时间
      }
    )
    
    if (response.data.code === 0) {
      console.log('\n✅ 文件上传成功，AI分析完成')
      console.log('\n--- 文件信息 ---')
      console.log(JSON.stringify(response.data.data.fileInfo, null, 2))
      console.log('\n--- AI回复内容 ---')
      console.log(response.data.data.aiReply)
      console.log('\n--- 完整响应 ---')
      console.log(JSON.stringify(response.data, null, 2))
      return true
    } else {
      console.error('❌ 上传失败:', response.data.message)
      console.error('错误详情:', response.data)
      return false
    }
  } catch (error) {
    console.error('❌ 上传错误:')
    if (error.response) {
      console.error('状态码:', error.response.status)
      console.error('错误信息:', error.response.data)
    } else {
      console.error('错误:', error.message)
    }
    return false
  }
}

/**
 * 步骤4: 测试普通AI对话（不带文件）
 */
async function testNormalChat() {
  try {
    console.log('\n=== 步骤4: 测试普通AI对话 ===')
    
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-chat/send`,
      {
        sessionId: sessionId,
        content: '你好，请介绍一下你自己'
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
      console.log('✅ AI对话成功')
      console.log('\n--- AI回复 ---')
      console.log(response.data.data.aiReply)
      return true
    } else {
      console.error('❌ AI对话失败:', response.data.message)
      return false
    }
  } catch (error) {
    console.error('❌ AI对话错误:', error.response?.data || error.message)
    return false
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始测试文件上传和豆包AI返回数据')
  console.log('云托管域名:', BASE_URL)
  console.log('测试文件:', TEST_FILE_PATH)
  
  // 步骤1: 登录
  const loginSuccess = await login()
  if (!loginSuccess) {
    console.error('\n❌ 登录失败，测试终止')
    process.exit(1)
  }
  
  // 步骤2: 创建会话
  const sessionSuccess = await createSession()
  if (!sessionSuccess) {
    console.error('\n❌ 创建会话失败，测试终止')
    process.exit(1)
  }
  
  // 步骤3: 上传文件并测试AI
  const uploadSuccess = await uploadFileAndTestAI()
  if (!uploadSuccess) {
    console.error('\n❌ 文件上传测试失败')
  }
  
  // 步骤4: 测试普通AI对话
  await testNormalChat()
  
  console.log('\n✅ 测试完成')
}

// 运行测试
main().catch(error => {
  console.error('❌ 测试过程中发生错误:', error)
  process.exit(1)
})

