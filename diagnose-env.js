/**
 * 环境变量诊断脚本
 * 用于检查云托管环境中的环境变量是否正确加载
 */

require('dotenv').config();

console.log('========================================');
console.log('环境变量诊断报告');
console.log('========================================');
console.log('生成时间:', new Date().toLocaleString('zh-CN'));
console.log('');

console.log('【核心环境变量】');
console.log(`NODE_ENV = ${process.env.NODE_ENV || '(未设置)'}`);
console.log(`CLOUDBASE_ENV = ${process.env.CLOUDBASE_ENV || '(未设置)'}`);
console.log('');

console.log('【数据库配置 - 内网】');
console.log(`DB_HOST_INTERNAL = ${process.env.DB_HOST_INTERNAL || '(未设置)'}`);
console.log(`DB_PORT_INTERNAL = ${process.env.DB_PORT_INTERNAL || '(未设置)'}`);
console.log('');

console.log('【数据库配置 - 外网】');
console.log(`DB_HOST_EXTERNAL = ${process.env.DB_HOST_EXTERNAL || '(未设置)'}`);
console.log(`DB_PORT_EXTERNAL = ${process.env.DB_PORT_EXTERNAL || '(未设置)'}`);
console.log('');

console.log('【数据库配置 - 通用】');
console.log(`DB_USER = ${process.env.DB_USER || '(未设置)'}`);
console.log(`DB_PASSWORD = ${process.env.DB_PASSWORD ? '******' : '(未设置)'}`);
console.log(`DB_NAME = ${process.env.DB_NAME || '(未设置)'}`);
console.log('');

console.log('【微信配置】');
console.log(`WECHAT_APPID = ${process.env.WECHAT_APPID || '(未设置)'}`);
console.log(`WECHAT_APPSECRET = ${process.env.WECHAT_APPSECRET ? '******' : '(未设置)'}`);
console.log('');

console.log('【其他配置】');
console.log(`JWT_SECRET = ${process.env.JWT_SECRET ? '******' : '(未设置)'}`);
console.log(`QWEATHER_API_KEY = ${process.env.QWEATHER_API_KEY || '(未设置)'}`);
console.log(`DOUBAO_API_KEY = ${process.env.DOUBAO_API_KEY ? '******' : '(未设置)'}`);
console.log('');

console.log('【计算后的数据库地址】');
const config = require('./config/index');
console.log(`实际使用的host = ${config.database.host}`);
console.log(`实际使用的port = ${config.database.port}`);
console.log(`实际使用的database = ${config.database.database}`);
console.log(`实际使用的user = ${config.database.user}`);
console.log('');

console.log('【判断逻辑】');
console.log(`NODE_ENV === 'production' ? ${process.env.NODE_ENV === 'production'}`);
if (process.env.NODE_ENV === 'production') {
  console.log('→ 应该使用内网地址');
  console.log(`→ 内网地址是否设置: ${!!process.env.DB_HOST_INTERNAL}`);
  console.log(`→ 最终地址: ${config.database.host}:${config.database.port}`);
} else {
  console.log('→ 应该使用外网地址');
  console.log(`→ 外网地址是否设置: ${!!process.env.DB_HOST_EXTERNAL}`);
  console.log(`→ 最终地址: ${config.database.host}:${config.database.port}`);
}
console.log('');

console.log('【问题诊断】');
if (!process.env.NODE_ENV) {
  console.log('❌ NODE_ENV 未设置！这会导致使用外网地址');
  console.log('   解决方案: 在云托管控制台添加环境变量 NODE_ENV=production');
}

if (process.env.NODE_ENV === 'production' && !process.env.DB_HOST_INTERNAL) {
  console.log('❌ DB_HOST_INTERNAL 未设置！');
  console.log('   解决方案: 在云托管控制台添加环境变量 DB_HOST_INTERNAL=10.27.100.151');
}

if (process.env.NODE_ENV !== 'production' && !process.env.DB_HOST_EXTERNAL) {
  console.log('❌ DB_HOST_EXTERNAL 未设置！');
  console.log('   解决方案: 在云托管控制台添加环境变量 DB_HOST_EXTERNAL=sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com');
}

if (config.database.host === 'localhost' || config.database.host === '127.0.0.1') {
  console.log('❌ 数据库地址是本地地址！这肯定会连接失败！');
  console.log('   原因: 环境变量未正确设置');
  console.log('   解决方案: 检查云托管控制台的环境变量配置');
}

if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.log('❌ 数据库认证信息不完整！');
  console.log('   请确保设置了: DB_USER, DB_PASSWORD, DB_NAME');
}

console.log('========================================');

