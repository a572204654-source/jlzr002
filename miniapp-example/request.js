/**
 * 小程序端API请求封装示例
 * 使用方法：将此文件放到小程序项目的 utils 目录下
 */

// API基础地址（请根据实际情况修改）
const BASE_URL = 'http://localhost' // 开发环境
// const BASE_URL = 'https://your-domain.com' // 生产环境

/**
 * 通用请求方法
 * @param {String} url - 请求路径
 * @param {Object} options - 请求配置
 * @returns {Promise}
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = wx.getStorageSync('token')

    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success(res) {
        // 统一处理响应
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data.data)
          } else if (res.data.code === 401) {
            // token失效，清除token并跳转登录
            wx.removeStorageSync('token')
            wx.showToast({
              title: '请先登录',
              icon: 'none'
            })
            // 可以跳转到登录页
            // wx.reLaunch({ url: '/pages/login/login' })
            reject(res.data)
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
        } else {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
          reject(res)
        }
      },
      fail(err) {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * GET请求
 */
function get(url, data = {}) {
  return request(url, {
    method: 'GET',
    data
  })
}

/**
 * POST请求
 */
function post(url, data = {}) {
  return request(url, {
    method: 'POST',
    data
  })
}

/**
 * PUT请求
 */
function put(url, data = {}) {
  return request(url, {
    method: 'PUT',
    data
  })
}

/**
 * DELETE请求
 */
function del(url, data = {}) {
  return request(url, {
    method: 'DELETE',
    data
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}

