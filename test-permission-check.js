/**
 * 检查 CloudBase 权限配置
 * 用于诊断 SIGN_PARAM_INVALID 错误
 */

require('dotenv').config()

const secretId = process.env.TENCENTCLOUD_SECRET_ID || process.env.TENCENT_SECRET_ID || ''
const secretKey = process.env.TENCENTCLOUD_SECRET_KEY || process.env.TENCENT_SECRET_KEY || ''
const envId = process.env.CLOUDBASE_ENV || process.env.CLOUDBASE_ENV_ID || ''

console.log('🔍 CloudBase 权限检查\n')
console.log('='.repeat(60))

// 1. 检查环境变量
console.log('\n1️⃣ 环境变量检查:')
console.log('  环境ID:', envId || '(未设置)')
console.log('  Secret ID:', secretId ? `${secretId.substring(0, 15)}...` : '(未设置)')
console.log('  Secret Key:', secretKey ? `${secretKey.substring(0, 15)}...` : '(未设置)')

if (!envId || !secretId || !secretKey) {
  console.log('\n❌ 环境变量配置不完整！')
  process.exit(1)
}

// 2. 检查权限要求
console.log('\n2️⃣ 所需权限检查:')
console.log('  CloudBase 云存储上传需要以下权限:')
console.log('  - QcloudTCBFullAccess (CloudBase 全读写权限)')
console.log('  - 或至少包含以下操作权限:')
console.log('    * tcb:InvokeFunction (调用云函数)')
console.log('    * tcb:GetUploadMetadata (获取上传元数据)')
console.log('    * tcb:UploadFile (上传文件)')
console.log('    * cos:PutObject (COS 上传对象)')
console.log('    * cos:GetObject (COS 获取对象)')

// 3. 权限检查步骤
console.log('\n3️⃣ 权限检查步骤:')
console.log('  步骤1: 登录腾讯云控制台')
console.log('    https://console.cloud.tencent.com/')
console.log('  步骤2: 进入"访问管理 > API密钥管理"')
console.log('    https://console.cloud.tencent.com/cam/capi')
console.log('  步骤3: 找到 Secret ID:', secretId.substring(0, 15) + '...')
console.log('  步骤4: 检查该密钥的权限策略')
console.log('  步骤5: 确保包含以下权限之一:')
console.log('    - QcloudTCBFullAccess (推荐)')
console.log('    - 或自定义策略包含上述操作权限')

// 4. 解决方案
console.log('\n4️⃣ 解决方案:')
console.log('  方案A: 添加权限（推荐）')
console.log('    1. 在腾讯云控制台为 Secret ID 添加 QcloudTCBFullAccess 权限')
console.log('    2. 等待权限生效（通常立即生效）')
console.log('    3. 重新测试文件上传')
console.log('')
console.log('  方案B: 使用 CloudBase 环境密钥')
console.log('    1. 登录 CloudBase 控制台')
console.log('       https://console.cloud.tencent.com/tcb')
console.log('    2. 进入环境:', envId)
console.log('    3. 在"环境设置 > 安全配置"中获取环境绑定的密钥')
console.log('    4. 使用环境密钥替换当前的通用密钥')
console.log('')
console.log('  方案C: 使用 COS SDK 直接上传（无需 CloudBase 权限）')
console.log('    1. 从 CloudBase 获取 COS 临时密钥')
console.log('    2. 使用 cos-nodejs-sdk-v5 直接上传到 COS')
console.log('    3. 参考: utils/cloudStorageCOS.js')

// 5. 测试建议
console.log('\n5️⃣ 测试建议:')
console.log('  运行以下命令测试权限:')
console.log('    node test-upload-debug.js')
console.log('')
console.log('  如果仍然失败，请:')
console.log('    1. 检查控制台中的权限配置')
console.log('    2. 确认 Secret ID 和 Secret Key 是否正确')
console.log('    3. 确认环境ID是否正确')
console.log('    4. 尝试使用方案C（COS SDK）')

console.log('\n' + '='.repeat(60))
console.log('✅ 权限检查完成')
console.log('\n💡 提示: 如果权限配置正确但仍然失败，可能是密钥类型问题')
console.log('   建议使用 CloudBase 环境绑定的专用密钥，而不是通用 API 密钥')

