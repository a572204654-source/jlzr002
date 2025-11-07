/**
 * HTTP请求工具
 */

const axios = require('axios')
const config = require('../config')

// 创建axios实例
const request = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 如果有token，自动添加到请求头
    if (config.needAuth && global.testToken) {
      config.headers['Authorization'] = `Bearer ${global.testToken}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  }
)

module.exports = request

