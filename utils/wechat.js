const axios = require('axios');
const config = require('../config');

/**
 * 微信小程序登录 - 通过code获取openid和session_key
 * @param {String} code - 小程序登录code
 * @returns {Object} 包含openid, session_key等信息
 */
async function code2Session(code) {
  try {
    const response = await axios.get(config.wechat.loginUrl, {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const data = response.data;

    if (data.errcode) {
      throw new Error(data.errmsg || '微信登录失败');
    }

    return {
      openid: data.openid,
      sessionKey: data.session_key,
      unionid: data.unionid
    };
  } catch (error) {
    console.error('微信登录错误:', error.message);
    throw new Error('微信登录失败');
  }
}

/**
 * 获取微信Access Token
 * @returns {String} access_token
 */
async function getAccessToken() {
  try {
    const response = await axios.get(config.wechat.tokenUrl, {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        grant_type: 'client_credential'
      }
    });

    const data = response.data;

    if (data.errcode) {
      throw new Error(data.errmsg || '获取AccessToken失败');
    }

    return data.access_token;
  } catch (error) {
    console.error('获取AccessToken错误:', error.message);
    throw new Error('获取AccessToken失败');
  }
}

module.exports = {
  code2Session,
  getAccessToken
};

