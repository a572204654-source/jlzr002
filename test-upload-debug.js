/**
 * 详细诊断文件上传签名问题
 */

const cloudbase = require('@cloudbase/node-sdk')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const envId = process.env.CLOUDBASE_ENV || process.env.CLOUDBASE_ENV_ID || 'jlzr1101-5g9kplxza13a780d'
const secretId = process.env.TENCENTCLOUD_SECRET_ID || process.env.TENCENT_SECRET_ID || ''
const secretKey = process.env.TENCENTCLOUD_SECRET_KEY || process.env.TENCENT_SECRET_KEY || ''

console.log('🔍 详细诊断文件上传签名问题...\n')
console.log('配置信息:')
console.log('  环境ID:', envId)
console.log('  Secret ID:', secretId ? `${secretId.substring(0, 15)}...` : '(未设置)')
console.log('  Secret Key:', secretKey ? `${secretKey.substring(0, 15)}...` : '(未设置)')
console.log('')

// 初始化 CloudBase
console.log('📦 初始化 CloudBase SDK...')
let app
try {
  app = cloudbase.init({
    env: envId,
    secretId: secretId,
    secretKey: secretKey
  })
  console.log('✅ CloudBase 初始化成功\n')
} catch (error) {
  console.error('❌ CloudBase 初始化失败:', error.message)
  process.exit(1)
}

// 测试获取上传元数据
async function testGetUploadMetadata() {
  console.log('📤 测试获取上传元数据...')
  const testCloudPath = 'test/upload-test.txt'
  
  try {
    const metadata = await app.getUploadMetadata({
      cloudPath: testCloudPath
    })
    
    console.log('✅ 获取上传元数据成功')
    console.log('  返回数据:', {
      hasUrl: !!metadata.data?.url,
      hasToken: !!metadata.data?.token,
      hasAuthorization: !!metadata.data?.authorization,
      hasFileId: !!metadata.data?.fileId,
      hasCosFileId: !!metadata.data?.cosFileId,
      urlPrefix: metadata.data?.url ? metadata.data.url.substring(0, 50) + '...' : '(无)',
      authorizationPrefix: metadata.data?.authorization ? metadata.data.authorization.substring(0, 30) + '...' : '(无)'
    })
    console.log('')
    
    return metadata
  } catch (error) {
    console.error('❌ 获取上传元数据失败:', error.message)
    console.error('  错误详情:', error)
    console.log('')
    return null
  }
}

// 测试上传小文件
async function testUploadFile() {
  console.log('📤 测试上传文件...')
  const testContent = Buffer.from('Hello CloudBase!')
  const testCloudPath = `test/upload-test-${Date.now()}.txt`
  
  try {
    console.log('  文件路径:', testCloudPath)
    console.log('  文件大小:', testContent.length, 'bytes')
    
    const result = await app.uploadFile({
      cloudPath: testCloudPath,
      fileContent: testContent
    })
    
    console.log('✅ 文件上传成功')
    console.log('  文件ID:', result.fileID)
    console.log('')
    
    return result
  } catch (error) {
    console.error('❌ 文件上传失败:', error.message)
    console.error('  错误详情:', error)
    
    // 分析错误信息
    if (error.message && error.message.includes('signature')) {
      console.log('\n🔍 签名错误分析:')
      console.log('  1. 检查 Secret ID 和 Secret Key 是否正确')
      console.log('  2. 检查 Secret ID 是否有云存储权限')
      console.log('  3. 检查环境ID是否正确')
      console.log('  4. 检查系统时间是否同步')
    }
    console.log('')
    return null
  }
}

// 主函数
async function main() {
  // 先测试获取上传元数据
  const metadata = await testGetUploadMetadata()
  
  if (metadata) {
    // 如果获取元数据成功，再测试上传
    await testUploadFile()
  }
  
  console.log('✅ 诊断完成')
}

main().catch(error => {
  console.error('❌ 诊断过程出错:', error)
  process.exit(1)
})

