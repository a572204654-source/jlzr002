/**
 * HTTP请求工具
 * 基于axios封装，提供统一的请求和响应处理
 */

const axios = require('axios')
require('dotenv').config()

// 全局token存储
let globalToken = process.env.TEST_TOKEN || ''

/**
 * 设置全局token
 */
function setToken(token) {
  globalToken = token
}

/**
 * 获取全局token
 */
function getToken() {
  return globalToken
}

/**
 * 创建axios实例
 */
const instance = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:80',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器 - 自动添加token
 */
instance.interceptors.request.use(
  (config) => {
    if (globalToken) {
      config.headers['Authorization'] = `Bearer ${globalToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器 - 统一处理响应
 */
instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  }
)

/**
 * GET请求
 */
async function get(url, params = {}) {
  return instance.get(url, { params })
}

/**
 * POST请求
 */
async function post(url, data = {}) {
  return instance.post(url, data)
}

/**
 * PUT请求
 */
async function put(url, data = {}) {
  return instance.put(url, data)
}

/**
 * DELETE请求
 */
async function del(url, data = {}) {
  return instance.delete(url, { data })
}

/**
 * 下载文件（用于测试Word导出等）
 */
async function download(url) {
  return axios({
    method: 'get',
    url: `${process.env.API_BASE_URL}${url}`,
    responseType: 'arraybuffer',
    headers: {
      'Authorization': `Bearer ${globalToken}`
    }
  })
}

module.exports = {
  get,
  post,
  put,
  del,
  download,
  setToken,
  getToken
}

