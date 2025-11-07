/**
 * 小程序登录示例代码
 * 可以在小程序的 app.js 或登录页面中使用
 */

const api = require('./api')  // 引入api模块

/**
 * 小程序登录
 */
function doLogin() {
  return new Promise((resolve, reject) => {
    // 1. 调用wx.login获取code
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            // 2. 发送code到后端换取token
            const data = await api.auth.wechatLogin(res.code)
            
            // 3. 保存token
            wx.setStorageSync('token', data.token)
            wx.setStorageSync('userInfo', data.userInfo)

            console.log('登录成功', data)

            resolve(data)
          } catch (err) {
            console.error('登录失败', err)
            wx.showToast({
              title: '登录失败',
              icon: 'none'
            })
            reject(err)
          }
        } else {
          console.error('获取code失败', res.errMsg)
          reject(res)
        }
      },
      fail: (err) => {
        console.error('wx.login失败', err)
        reject(err)
      }
    })
  })
}

/**
 * 获取用户信息并更新到服务器
 */
async function getUserInfoAndUpdate() {
  try {
    // 获取小程序用户信息（头像昵称）
    const { userInfo } = await wx.getUserProfile({
      desc: '用于完善用户资料'
    })
    
    console.log('获取用户信息成功', userInfo)

    // 更新用户信息到服务器
    await api.user.updateMe({
      nickname: userInfo.nickName,
      avatar: userInfo.avatarUrl,
      gender: userInfo.gender
    })

    // 更新本地缓存
    const localUserInfo = wx.getStorageSync('userInfo')
    wx.setStorageSync('userInfo', {
      ...localUserInfo,
      nickname: userInfo.nickName,
      avatar: userInfo.avatarUrl,
      gender: userInfo.gender
    })

    wx.showToast({
      title: '信息更新成功',
      icon: 'success'
    })
  } catch (err) {
    console.error('更新用户信息失败', err)
  }
}

/**
 * 检查登录状态
 */
function checkLoginStatus() {
  const token = wx.getStorageSync('token')
  return !!token
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')
  wx.showToast({
    title: '已退出登录',
    icon: 'success'
  })
  // 可以跳转到登录页
  // wx.reLaunch({ url: '/pages/login/login' })
}

// 在 app.js 中使用示例
App({
  onLaunch() {
    // 小程序启动时自动登录
    this.autoLogin()
  },

  async autoLogin() {
    try {
      if (!checkLoginStatus()) {
        // 未登录，执行登录
        await doLogin()
      } else {
        console.log('已登录')
        // 可以验证token是否有效
        // 调用一个需要认证的接口，如果返回401则重新登录
      }
    } catch (err) {
      console.error('自动登录失败', err)
    }
  },

  globalData: {
    userInfo: null
  }
})

// 在页面中使用示例
Page({
  data: {
    userInfo: null
  },

  onLoad() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    try {
      // 从服务器获取最新信息
      const profile = await api.user.getMe()
      
      this.setData({ userInfo: profile })
      wx.setStorageSync('userInfo', profile)
    } catch (err) {
      console.error('获取用户信息失败', err)
      if (err.code === 401) {
        // token失效，重新登录
        await doLogin()
        this.loadUserInfo()
      }
    }
  },

  // 手动登录按钮
  async handleLogin() {
    wx.showLoading({ title: '登录中...' })
    try {
      await doLogin()
      wx.hideLoading()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      this.loadUserInfo()
    } catch (err) {
      wx.hideLoading()
    }
  },

  // 退出登录按钮
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
        }
      }
    })
  }
})

module.exports = {
  doLogin,
  getUserInfoAndUpdate,
  checkLoginStatus,
  logout
}

