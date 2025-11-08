/**
 * 检查云托管服务版本信息
 */

const axios = require('axios')
const { execSync } = require('child_process')

const CLOUDRUN_URL = 'https://api.yimengpl.com'

async function checkVersion() {
  try {
    console.log('=================================================')
    console.log('           检查云托管服务版本')
    console.log('=================================================')
    console.log('云托管URL:', CLOUDRUN_URL)
    
    // 1. 检查health接口
    console.log('\n========== 1. 健康检查 ==========')
    try {
      const healthResponse = await axios.get(`${CLOUDRUN_URL}/health`)
      console.log('✓ 服务运行正常')
      if (healthResponse.data.version) {
        console.log('版本:', healthResponse.data.version)
      }
      if (healthResponse.data.timestamp) {
        console.log('时间戳:', new Date(healthResponse.data.timestamp).toLocaleString('zh-CN'))
      }
    } catch (error) {
      console.log('⚠ 健康检查失败:', error.message)
    }

    // 2. 检查package.json中的依赖
    console.log('\n========== 2. 本地package.json信息 ==========')
    const packageJson = require('./package.json')
    console.log('项目版本:', packageJson.version)
    console.log('docx版本:', packageJson.dependencies.docx || '未安装')
    
    // 3. 获取最新的git commit信息
    console.log('\n========== 3. Git版本信息 ==========')
    try {
      const gitCommit = execSync('git log -1 --format="%H %s %cd" --date=format:"%Y-%m-%d %H:%M:%S"').toString().trim()
      console.log('最新提交:', gitCommit)
      
      const gitStatus = execSync('git status --porcelain').toString().trim()
      if (gitStatus) {
        console.log('⚠ 有未提交的更改')
      } else {
        console.log('✓ 工作区干净')
      }
    } catch (error) {
      console.log('⚠ 获取git信息失败:', error.message)
    }

    console.log('\n=================================================')
    console.log('提示: 云托管通常需要3-5分钟完成自动部署')
    console.log('可以在腾讯云控制台查看部署进度')
    console.log('=================================================')

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message)
  }
}

checkVersion()

