/**
 * API测试配置文件
 */

module.exports = {
  // 测试环境API地址
  baseURL: 'http://localhost:80',
  
  // 超时时间
  timeout: 10000,
  
  // 测试账号（使用测试登录接口，直接用openid登录）
  testOpenid: 'test_openid_001',
  
  // AI Mock模式（避免真实API调用超时）
  aiMockMode: true,
  
  // 全局变量存储（用于存储token、创建的资源ID等）
  globalData: {
    token: null,
    userId: null,
    projectId: null,
    workId: null,
    logId: null,
    attachmentId: null,
    sessionId: null
  }
}

