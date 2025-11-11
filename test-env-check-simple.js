/**
 * 简单检查环境变量配置
 */

const axios = require('axios')

const CLOUD_URL = 'https://api.yimengpl.com'

async function checkEnv() {
  try {
    console.log('🔍 检查环境变量配置...\n')
    
    const response = await axios.get(`${CLOUD_URL}/diagnose`, { timeout: 5000 })
    const data = response.data
    
    console.log('=== 环境变量检查 ===')
    console.log('CLOUDBASE_ENV:', data.environment.CLOUDBASE_ENV)
    console.log()
    
    // 检查云存储配置（兼容新旧数据结构）
    console.log('=== 云存储配置检查 ===')
    const cloudStorage = data.cloudStorage || {}
    const envId = cloudStorage.envId || data.environment.CLOUDBASE_ENV
    
    if (envId && envId !== '(未设置)') {
      console.log('✅ CLOUDBASE_ENV 已配置:', envId)
    } else {
      console.log('❌ CLOUDBASE_ENV 未配置')
      console.log('   注意：云托管会自动注入 CLOUDBASE_ENV，如果未设置请检查云托管配置')
    }
    
    const hasSecretId = cloudStorage.hasSecretId !== undefined 
      ? cloudStorage.hasSecretId 
      : (data.tencentCloud && data.tencentCloud.hasSecretId)
    const hasSecretKey = cloudStorage.hasSecretKey !== undefined 
      ? cloudStorage.hasSecretKey 
      : (data.tencentCloud && data.tencentCloud.hasSecretKey)
    
    if (hasSecretId) {
      console.log('✅ TENCENTCLOUD_SECRET_ID 已配置')
    } else {
      console.log('❌ TENCENTCLOUD_SECRET_ID 未配置')
    }
    
    if (hasSecretKey) {
      console.log('✅ TENCENTCLOUD_SECRET_KEY 已配置')
    } else {
      console.log('❌ TENCENTCLOUD_SECRET_KEY 未配置')
    }
    
    if (cloudStorage.note) {
      console.log('⚠️', cloudStorage.note)
    }
    
    console.log()
    
    // 总结
    const isConfigured = cloudStorage.isConfigured !== undefined
      ? cloudStorage.isConfigured
      : (envId && envId !== '(未设置)' && hasSecretId && hasSecretKey)
    
    if (isConfigured) {
      console.log('✅ 所有云存储环境变量已配置，可以测试文件上传')
    } else {
      console.log('❌ 云存储环境变量配置不完整，请检查上述配置')
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
  }
}

checkEnv()

