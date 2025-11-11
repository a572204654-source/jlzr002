/**
 * 检查云托管环境中的配置
 */

const axios = require('axios')

const CLOUD_URL = 'https://api.yimengpl.com'

async function checkCloudConfig() {
  console.log('🔍 检查云托管环境配置...\n')
  console.log(`云托管地址: ${CLOUD_URL}\n`)

  try {
    // 1. 检查健康状态
    console.log('=== 步骤1: 健康检查 ===')
    const healthRes = await axios.get(`${CLOUD_URL}/health`, { timeout: 5000 })
    console.log('✅ 服务健康:', healthRes.data)
    console.log()

    // 2. 检查环境诊断
    console.log('=== 步骤2: 环境诊断 ===')
    const diagnoseRes = await axios.get(`${CLOUD_URL}/diagnose`, { timeout: 5000 })
    console.log('环境信息:', JSON.stringify(diagnoseRes.data, null, 2))
    console.log()

    // 3. 尝试创建一个测试接口来检查云存储配置
    // 先登录获取token
    console.log('=== 步骤3: 登录获取token ===')
    const loginRes = await axios.post(`${CLOUD_URL}/api/auth/login`, {
      code: 'test_wechat_code_config_check'
    })
    const token = loginRes.data.data.token
    console.log('✅ 登录成功')
    console.log()

    // 4. 创建一个测试接口来检查配置（如果存在）
    // 或者直接尝试上传一个很小的测试文件
    console.log('=== 步骤4: 测试云存储配置 ===')
    try {
      // 创建一个很小的测试图片文件（1x1像素的PNG）
      const FormData = require('form-data')
      
      // 创建一个最小的PNG图片（1x1像素，透明）
      // PNG文件头 + IHDR + IDAT + IEND
      const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG签名
        0x00, 0x00, 0x00, 0x0D, // IHDR块长度
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // 宽度: 1
        0x00, 0x00, 0x00, 0x01, // 高度: 1
        0x08, 0x06, 0x00, 0x00, 0x00, // 位深度、颜色类型等
        0x1F, 0x15, 0xC4, 0x89, // CRC
        0x00, 0x00, 0x00, 0x0A, // IDAT块长度
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // 压缩数据
        0x0D, 0x0A, 0x2D, 0xB4, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND块长度
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
      ])
      
      const form = new FormData()
      form.append('file', pngData, {
        filename: 'test.png',
        contentType: 'image/png'
      })
      form.append('sessionId', 'test_session')
      form.append('message', 'test')

      const uploadRes = await axios.post(
        `${CLOUD_URL}/api/v1/ai-chat/upload-file`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        }
      )

      console.log('✅ 文件上传成功:', uploadRes.data)
    } catch (uploadError) {
      if (uploadError.response) {
        console.log('❌ 文件上传失败:')
        console.log('状态码:', uploadError.response.status)
        console.log('错误信息:', uploadError.response.data)
        
        // 分析错误信息
        const errorMsg = uploadError.response.data?.message || ''
        if (errorMsg.includes('CLOUDBASE_ENV')) {
          console.log('\n⚠️  问题分析: 缺少 CLOUDBASE_ENV 环境变量')
          console.log('解决方案: CLOUDBASE_ENV 由云托管自动注入，如果缺失请检查云托管环境配置')
        } else if (errorMsg.includes('TENCENTCLOUD_SECRET_ID')) {
          console.log('\n⚠️  问题分析: 缺少 TENCENTCLOUD_SECRET_ID 或 TENCENTCLOUD_SECRET_KEY 环境变量')
          console.log('解决方案: 在云托管控制台添加这两个环境变量')
        } else if (errorMsg.includes('配置不完整')) {
          console.log('\n⚠️  问题分析: 云存储配置不完整')
          console.log('需要配置的环境变量:')
          console.log('  - CLOUDBASE_ENV: 由云托管自动注入（通常无需手动配置）')
          console.log('  - TENCENTCLOUD_SECRET_ID: 腾讯云API密钥ID（必需）')
          console.log('  - TENCENTCLOUD_SECRET_KEY: 腾讯云API密钥Key（必需）')
          console.log('\n⚠️  注意: 配置后需要重启服务才能生效！')
        }
      } else {
        console.log('❌ 请求失败:', uploadError.message)
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
  }
}

checkCloudConfig()

