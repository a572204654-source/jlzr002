/**
 * 诊断云托管导出错误
 */

const axios = require('axios')

const CLOUDRUN_URL = 'https://api.yimengpl.com'
const testOpenid = 'test_openid_888888'

async function diagnose() {
  try {
    console.log('=================================================')
    console.log('        诊断云托管导出功能错误')
    console.log('=================================================')

    // 1. 登录
    console.log('\n========== 1. 登录 ==========')
    const loginRes = await axios.post(`${CLOUDRUN_URL}/api/auth/test-login`, {
      openid: testOpenid
    })
    const token = loginRes.data.data.token
    console.log('✓ 登录成功')

    // 2. 获取一条监理日志
    console.log('\n========== 2. 获取监理日志 ==========')
    const logsRes = await axios.get(`${CLOUDRUN_URL}/api/supervision-logs`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { page: 1, pageSize: 1 }
    })
    const logs = logsRes.data.data.list
    if (logs.length === 0) {
      console.log('❌ 没有监理日志数据')
      return
    }
    const logId = logs[0].id
    console.log(`✓ 获取到日志 ID: ${logId}`)

    // 3. 获取日志详情
    console.log('\n========== 3. 获取日志详情 ==========')
    const detailRes = await axios.get(`${CLOUDRUN_URL}/api/supervision-logs/${logId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('✓ 详情获取成功')
    const logData = detailRes.data.data
    console.log('项目名称:', logData.projectName || '无')
    console.log('项目编号:', logData.projectCode || '无')
    console.log('工程名称:', logData.workName || '无')
    console.log('工程编号:', logData.workCode || '无')

    // 4. 尝试导出（捕获详细错误）
    console.log('\n========== 4. 尝试导出Word ==========')
    try {
      const exportRes = await axios.get(`${CLOUDRUN_URL}/api/supervision-logs/${logId}/export`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'arraybuffer',
        timeout: 30000
      })
      console.log('✅ 导出成功！')
      console.log('文件大小:', (exportRes.data.length / 1024).toFixed(2), 'KB')
    } catch (error) {
      console.log('❌ 导出失败')
      console.log('错误信息:', error.message)
      
      if (error.response) {
        console.log('状态码:', error.response.status)
        
        // 尝试解析错误响应
        if (error.response.data) {
          try {
            const errorText = Buffer.from(error.response.data).toString('utf-8')
            const errorJson = JSON.parse(errorText)
            console.log('错误详情:', JSON.stringify(errorJson, null, 2))
          } catch (e) {
            console.log('无法解析错误响应')
          }
        }
      }
      
      console.log('\n可能的原因:')
      console.log('1. docx包未正确安装（检查package.json）')
      console.log('2. 云托管环境未重新部署')
      console.log('3. Node.js版本不兼容')
      console.log('4. 内存不足')
      console.log('\n建议:')
      console.log('1. 在云托管控制台查看服务日志')
      console.log('2. 手动触发重新部署')
      console.log('3. 检查构建日志确认依赖安装成功')
    }

    console.log('\n=================================================')

  } catch (error) {
    console.error('\n❌ 诊断过程出错:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
  }
}

diagnose()

