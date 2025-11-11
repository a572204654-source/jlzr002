/**
 * 检查云存储配置环境变量
 */

const config = require('./config')

console.log('=== 云存储配置检查 ===\n')

console.log('环境变量读取结果:')
console.log('CLOUDBASE_ENV_ID:', process.env.CLOUDBASE_ENV_ID || '(未设置)')
console.log('TENCENTCLOUD_SECRET_ID:', process.env.TENCENTCLOUD_SECRET_ID || '(未设置)')
console.log('TENCENTCLOUD_SECRET_KEY:', process.env.TENCENTCLOUD_SECRET_KEY ? '***已设置***' : '(未设置)')
console.log('TENCENT_SECRET_ID:', process.env.TENCENT_SECRET_ID || '(未设置)')
console.log('TENCENT_SECRET_KEY:', process.env.TENCENT_SECRET_KEY ? '***已设置***' : '(未设置)')

console.log('\n配置对象读取结果:')
console.log('config.cloudStorage.envId:', config.cloudStorage.envId || '(未设置)')
console.log('config.cloudStorage.secretId:', config.cloudStorage.secretId || '(未设置)')
console.log('config.cloudStorage.secretKey:', config.cloudStorage.secretKey ? '***已设置***' : '(未设置)')

console.log('\n配置完整性检查:')
const isComplete = config.cloudStorage.envId && config.cloudStorage.secretId && config.cloudStorage.secretKey
if (isComplete) {
  console.log('✅ 配置完整，所有必需的环境变量都已设置')
} else {
  console.log('❌ 配置不完整，缺少以下环境变量:')
  if (!config.cloudStorage.envId) {
    console.log('  - CLOUDBASE_ENV_ID')
  }
  if (!config.cloudStorage.secretId) {
    console.log('  - TENCENTCLOUD_SECRET_ID 或 TENCENT_SECRET_ID')
  }
  if (!config.cloudStorage.secretKey) {
    console.log('  - TENCENTCLOUD_SECRET_KEY 或 TENCENT_SECRET_KEY')
  }
}

