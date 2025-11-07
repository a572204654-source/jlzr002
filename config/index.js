require('dotenv').config();

module.exports = {
  // CloudBase云托管环境配置
  cloudbase: {
    env: process.env.CLOUDBASE_ENV || 'production',
    envId: process.env.CLOUDBASE_ENV_ID || '',
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'express_miniapp',
    connectionLimit: 10, // 连接池大小
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
    // 字符集配置
    charset: 'utf8mb4'
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    appSecret: process.env.WECHAT_APPSECRET || '',
    // 微信登录API
    loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',
    // 获取AccessToken API
    tokenUrl: 'https://api.weixin.qq.com/cgi-bin/token'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '7d' // token有效期
  },

  // 豆包AI配置
  doubao: {
    apiKey: process.env.DOUBAO_API_KEY || '',
    endpointId: process.env.DOUBAO_ENDPOINT_ID || '',  // 推理接入点ID
    apiUrl: process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    maxTokens: 2048,
    temperature: 0.8
  },

  // 服务配置
  server: {
    port: parseInt(process.env.PORT) || 80,
    serviceName: process.env.SERVICE_NAME || 'supervision-log-api',
    domain: process.env.SERVICE_DOMAIN || 'http://localhost'
  },

  // 和风天气配置
  qweather: {
    apiKey: process.env.QWEATHER_API_KEY || '',
    apiUrl: 'https://devapi.qweather.com/v7',
    timeout: 8000,
    cacheTime: 300 // 缓存5分钟
  }
};

