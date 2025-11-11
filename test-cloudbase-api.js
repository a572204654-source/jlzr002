/**
 * 测试 CloudBase SDK 的正确 API 调用方式
 */

const cloudbase = require('@cloudbase/node-sdk')
require('dotenv').config()

const envId = process.env.CLOUDBASE_ENV || 'jlzr1101-5g9kplxza13a780d'
const secretId = process.env.TENCENTCLOUD_SECRET_ID || ''
const secretKey = process.env.TENCENTCLOUD_SECRET_KEY || ''

console.log('🔍 测试 CloudBase SDK API 调用方式...\n')
console.log('环境ID:', envId)
console.log('Secret ID:', secretId ? `${secretId.substring(0, 10)}...` : '(未设置)')
console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 10)}...` : '(未设置)\n')

// 初始化 CloudBase
const app = cloudbase.init({
  env: envId,
  secretId: secretId,
  secretKey: secretKey
})

console.log('✅ CloudBase 初始化成功\n')

// 检查 app 对象的方法
console.log('📋 检查 app 对象的方法:')
console.log('app 类型:', typeof app)
console.log('app 方法:', Object.keys(app).filter(key => typeof app[key] === 'function'))

// 检查是否有 storage 方法
if (typeof app.storage === 'function') {
  console.log('\n✅ 发现 app.storage() 方法')
  const storage = app.storage()
  console.log('storage 方法:', Object.keys(storage).filter(key => typeof storage[key] === 'function'))
}

// 检查是否有 uploadFile 方法
if (typeof app.uploadFile === 'function') {
  console.log('\n✅ 发现 app.uploadFile() 方法')
} else {
  console.log('\n❌ 未发现 app.uploadFile() 方法')
}

// 检查是否有 getStorageManager 方法
if (typeof app.getStorageManager === 'function') {
  console.log('\n✅ 发现 app.getStorageManager() 方法')
  try {
    const storageManager = app.getStorageManager()
    console.log('storageManager 方法:', Object.keys(storageManager).filter(key => typeof storageManager[key] === 'function'))
  } catch (error) {
    console.log('调用 getStorageManager 失败:', error.message)
  }
}

console.log('\n📚 完整的 app 对象结构:')
console.log(JSON.stringify(Object.keys(app), null, 2))

