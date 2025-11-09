/**
 * 云端 WebSocket 连接测试工具
 * 专门用于测试腾讯云托管环境的 WebSocket 连接
 */

const WebSocket = require('ws')
const https = require('https')

const CLOUD_URL = 'https://api.yimengpl.com'

console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║       云端 WebSocket 连接测试                            ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

// 测试1：检查云端服务是否运行
async function testCloudService() {
  console.log('🧪 测试1: 检查云端服务')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  return new Promise((resolve) => {
    https.get(CLOUD_URL + '/health', (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ 云端服务运行正常')
          console.log('   响应:', data)
          resolve(true)
        } else {
          console.log('❌ 云端服务响应异常')
          console.log('   状态码:', res.statusCode)
          resolve(false)
        }
      })
    }).on('error', (err) => {
      console.log('❌ 云端服务连接失败')
      console.log('   错误:', err.message)
      resolve(false)
    })
  })
}

// 测试2：测试简单的 WebSocket 连接（根路径）
async function testSimpleWebSocket() {
  console.log('\n🧪 测试2: 测试简单 WebSocket 连接')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const wsUrl = 'wss://api.yimengpl.com/test-ws'
  console.log('   测试地址:', wsUrl)
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(wsUrl)
      
      const timeout = setTimeout(() => {
        console.log('❌ 连接超时（10秒）')
        ws.close()
        resolve(false)
      }, 10000)
      
      ws.on('open', () => {
        clearTimeout(timeout)
        console.log('✅ WebSocket 连接成功！')
        
        // 发送测试消息
        ws.send('Hello from test client')
      })
      
      ws.on('message', (data) => {
        console.log('✅ 收到服务器消息:', data.toString())
        ws.close()
        resolve(true)
      })
      
      ws.on('error', (err) => {
        clearTimeout(timeout)
        console.log('❌ WebSocket 连接错误')
        console.log('   错误:', err.message)
        resolve(false)
      })
      
      ws.on('close', (code, reason) => {
        clearTimeout(timeout)
        if (code !== 1000) {
          console.log('⚠️  连接异常关闭')
          console.log('   关闭码:', code)
          console.log('   原因:', reason.toString() || '无')
        }
      })
    } catch (error) {
      console.log('❌ 创建连接失败')
      console.log('   错误:', error.message)
      resolve(false)
    }
  })
}

// 测试3：测试实时语音识别的 WebSocket 路由
async function testRealtimeVoiceWebSocket() {
  console.log('\n🧪 测试3: 测试实时语音识别 WebSocket')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const wsUrl = 'wss://api.yimengpl.com/api/realtime-voice/stream'
  console.log('   测试地址:', wsUrl)
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(wsUrl)
      
      const timeout = setTimeout(() => {
        console.log('❌ 连接超时（10秒）')
        ws.close()
        resolve(false)
      }, 10000)
      
      ws.on('open', () => {
        clearTimeout(timeout)
        console.log('✅ WebSocket 连接成功！')
        
        // 发送初始化消息
        ws.send(JSON.stringify({
          type: 'start',
          userId: 1,
          token: 'test_token',
          engineType: '16k_zh'
        }))
        
        console.log('   已发送初始化消息')
      })
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString())
        console.log('✅ 收到服务器消息:', message)
        
        if (message.type === 'ready') {
          console.log('✅ 识别服务已就绪！')
          
          // 发送停止消息
          setTimeout(() => {
            ws.send(JSON.stringify({ type: 'stop' }))
          }, 500)
        }
        
        if (message.type === 'stopped') {
          console.log('✅ 测试完成！')
          ws.close()
          resolve(true)
        }
      })
      
      ws.on('error', (err) => {
        clearTimeout(timeout)
        console.log('❌ WebSocket 连接错误')
        console.log('   错误:', err.message)
        console.log('\n可能的原因:')
        console.log('   1. 云托管环境未启用 WebSocket 支持')
        console.log('   2. 路由配置问题')
        console.log('   3. 负载均衡器不支持 WebSocket')
        resolve(false)
      })
      
      ws.on('close', (code, reason) => {
        clearTimeout(timeout)
        if (code === 1006) {
          console.log('❌ 连接异常关闭 (code: 1006)')
          console.log('   这通常表示服务器没有正确响应 WebSocket 握手')
          console.log('\n可能的解决方案:')
          console.log('   1. 检查云托管是否支持 WebSocket')
          console.log('   2. 检查是否需要特殊的配置或端口')
          console.log('   3. 查看云托管控制台的日志')
          resolve(false)
        } else if (code !== 1000) {
          console.log('⚠️  连接异常关闭')
          console.log('   关闭码:', code)
          console.log('   原因:', reason.toString() || '无')
          resolve(false)
        }
      })
    } catch (error) {
      console.log('❌ 创建连接失败')
      console.log('   错误:', error.message)
      resolve(false)
    }
  })
}

// 运行所有测试
async function runTests() {
  const result1 = await testCloudService()
  
  if (!result1) {
    console.log('\n❌ 云端服务未运行，无法继续测试')
    return
  }
  
  const result2 = await testSimpleWebSocket()
  const result3 = await testRealtimeVoiceWebSocket()
  
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║         测试结果总结                                      ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()
  console.log('云端服务:', result1 ? '✅ 正常' : '❌ 异常')
  console.log('简单 WebSocket:', result2 ? '✅ 正常' : '❌ 异常')
  console.log('实时语音 WebSocket:', result3 ? '✅ 正常' : '❌ 异常')
  console.log()
  
  if (!result2 && !result3) {
    console.log('⚠️  所有 WebSocket 连接都失败了！')
    console.log()
    console.log('📋 可能的原因和解决方案:')
    console.log()
    console.log('1️⃣  腾讯云托管 WebSocket 配置问题')
    console.log('   - 检查云托管是否启用了 WebSocket 支持')
    console.log('   - 查看云托管文档关于 WebSocket 的配置说明')
    console.log('   - 可能需要在云托管控制台中开启 WebSocket 功能')
    console.log()
    console.log('2️⃣  负载均衡器配置')
    console.log('   - 云托管的负载均衡器可能不支持 WebSocket')
    console.log('   - 需要配置支持 WebSocket 的负载均衡策略')
    console.log()
    console.log('3️⃣  端口和协议问题')
    console.log('   - 确保使用 wss:// 协议（不是 ws://）')
    console.log('   - 检查防火墙和安全组配置')
    console.log()
    console.log('4️⃣  查看云托管日志')
    console.log('   - 登录腾讯云托管控制台')
    console.log('   - 查看实时日志，看是否有 WebSocket 连接请求')
    console.log('   - 如果没有日志，说明请求没有到达服务器')
    console.log()
    console.log('📞 建议操作:')
    console.log('   1. 先在本地测试 WebSocket 功能（运行 npm start）')
    console.log('   2. 确认本地功能正常后，再排查云端配置')
    console.log('   3. 联系腾讯云支持，确认 WebSocket 支持情况')
    console.log()
  } else if (result2 && !result3) {
    console.log('⚠️  简单 WebSocket 可以连接，但实时语音路由失败')
    console.log()
    console.log('这可能是路由配置问题，请检查:')
    console.log('   1. routes/realtime-voice.js 是否正确部署')
    console.log('   2. app.js 中路由注册是否正确')
    console.log('   3. 查看云托管日志中的错误信息')
    console.log()
  } else if (result2 && result3) {
    console.log('🎉 所有测试通过！WebSocket 功能正常！')
    console.log()
    console.log('现在可以在小程序中使用实时语音识别功能了。')
    console.log('记得在微信小程序后台配置 socket 合法域名:')
    console.log('   wss://api.yimengpl.com')
    console.log()
  }
}

// 运行测试
runTests().catch(err => {
  console.error('测试过程出错:', err)
})

