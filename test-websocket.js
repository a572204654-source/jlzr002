/**
 * WebSocket 连接测试脚本
 * 测试云托管环境的 WebSocket 连接
 */

const WebSocket = require('ws')

// 测试配置
const TEST_CONFIGS = [
  {
    name: '自定义域名 - WSS - /test-ws',
    url: 'wss://api.yimengpl.com/test-ws'
  },
  {
    name: '自定义域名 - WS - /test-ws',
    url: 'ws://api.yimengpl.com/test-ws'
  },
  {
    name: '默认域名 - WSS (ap-shanghai) - /test-ws',
    url: 'wss://jlzr1101-5g9kplxza13a780d-1302271970.ap-shanghai.app.tcloudbase.com/test-ws'
  },
  {
    name: '默认域名 - WSS (tcloudbaseapp) - /test-ws',
    url: 'wss://jlzr1101-5g9kplxza13a780d-1302271970.tcloudbaseapp.com/test-ws'
  },
  {
    name: '自定义域名 - WSS - 根路径',
    url: 'wss://api.yimengpl.com'
  }
]

/**
 * 测试单个 WebSocket 连接
 */
function testWebSocketConnection(config) {
  return new Promise((resolve) => {
    console.log(`\n========================================`)
    console.log(`🧪 测试: ${config.name}`)
    console.log(`🔗 URL: ${config.url}`)
    console.log(`========================================`)

    const startTime = Date.now()
    let ws

    try {
      ws = new WebSocket(config.url, {
        headers: {
          'User-Agent': 'WebSocket-Test-Client/1.0'
        },
        handshakeTimeout: 10000 // 10秒超时
      })

      // 连接成功
      ws.on('open', () => {
        const connectTime = Date.now() - startTime
        console.log(`✅ 连接成功! (耗时: ${connectTime}ms)`)
        
        // 发送测试消息
        const testMessage = {
          type: 'ping',
          timestamp: Date.now(),
          message: '测试消息'
        }
        
        console.log(`📤 发送消息:`, JSON.stringify(testMessage))
        ws.send(JSON.stringify(testMessage))
        
        // 等待响应后关闭
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            console.log(`⏱️  5秒后关闭连接...`)
            ws.close()
          }
        }, 5000)
      })

      // 接收消息
      ws.on('message', (data) => {
        console.log(`📥 收到消息:`, data.toString())
        try {
          const parsed = JSON.parse(data.toString())
          console.log(`📋 解析后:`, parsed)
        } catch (e) {
          console.log(`⚠️  无法解析为 JSON`)
        }
      })

      // 连接关闭
      ws.on('close', (code, reason) => {
        const totalTime = Date.now() - startTime
        console.log(`🔌 连接关闭`)
        console.log(`   - 状态码: ${code}`)
        console.log(`   - 原因: ${reason || '无'}`)
        console.log(`   - 总耗时: ${totalTime}ms`)
        
        resolve({
          success: true,
          config: config.name,
          url: config.url,
          connectTime: totalTime,
          code,
          reason: reason || '正常关闭'
        })
      })

      // 连接错误
      ws.on('error', (error) => {
        console.log(`❌ 连接失败!`)
        console.log(`   - 错误类型: ${error.name}`)
        console.log(`   - 错误信息: ${error.message}`)
        console.log(`   - 错误代码: ${error.code || '无'}`)
        
        resolve({
          success: false,
          config: config.name,
          url: config.url,
          error: error.message,
          errorCode: error.code
        })
      })

      // 超时处理
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log(`⏰ 连接超时 (15秒)`)
          ws.terminate()
          resolve({
            success: false,
            config: config.name,
            url: config.url,
            error: '连接超时'
          })
        }
      }, 15000)

    } catch (error) {
      console.log(`❌ 创建连接失败:`, error.message)
      resolve({
        success: false,
        config: config.name,
        url: config.url,
        error: error.message
      })
    }
  })
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log(`\n🚀 开始 WebSocket 连接测试`)
  console.log(`⏰ 测试时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log(`📊 测试数量: ${TEST_CONFIGS.length} 个配置\n`)

  const results = []

  // 依次测试每个配置
  for (const config of TEST_CONFIGS) {
    const result = await testWebSocketConnection(config)
    results.push(result)
    
    // 等待一下再测试下一个
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // 输出测试总结
  console.log(`\n\n========================================`)
  console.log(`📊 测试总结`)
  console.log(`========================================`)

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  console.log(`\n✅ 成功: ${successCount} 个`)
  console.log(`❌ 失败: ${failCount} 个\n`)

  // 成功的连接
  const successResults = results.filter(r => r.success)
  if (successResults.length > 0) {
    console.log(`\n✅ 成功的连接:`)
    successResults.forEach(r => {
      console.log(`   - ${r.config}`)
      console.log(`     URL: ${r.url}`)
      console.log(`     耗时: ${r.connectTime}ms`)
    })
  }

  // 失败的连接
  const failResults = results.filter(r => !r.success)
  if (failResults.length > 0) {
    console.log(`\n❌ 失败的连接:`)
    failResults.forEach(r => {
      console.log(`   - ${r.config}`)
      console.log(`     URL: ${r.url}`)
      console.log(`     错误: ${r.error}`)
      if (r.errorCode) {
        console.log(`     错误代码: ${r.errorCode}`)
      }
    })
  }

  // 推荐配置
  if (successResults.length > 0) {
    const fastest = successResults.reduce((prev, curr) => 
      curr.connectTime < prev.connectTime ? curr : prev
    )
    console.log(`\n🏆 推荐使用:`)
    console.log(`   - ${fastest.config}`)
    console.log(`   - URL: ${fastest.url}`)
    console.log(`   - 原因: 连接最快 (${fastest.connectTime}ms)`)
  }

  console.log(`\n========================================`)
  console.log(`✅ 测试完成!`)
  console.log(`========================================\n`)
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试过程出错:', error)
  process.exit(1)
})

