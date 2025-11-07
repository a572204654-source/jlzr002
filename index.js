/**
 * CloudBase 云函数入口
 * 用于在云函数环境中查询数据库
 */

const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: 'jlzr1101-5g9kplxza13a780d',
  region: 'ap-shanghai' // 不指定 region 时，默认使用 ap-shanghai
})

/**
 * 云函数主入口
 * @param {Object} event - 触发事件对象
 * @param {Object} context - 云函数运行上下文
 * @returns {Object} 返回查询结果
 */
exports.main = async (event, context) => {
  const db = app.mysql()
  const { data } = await db.from('todos').select('*')
  return {
    records: data
  }
}

