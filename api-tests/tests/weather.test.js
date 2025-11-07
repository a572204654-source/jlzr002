/**
 * 气象模块测试
 * 测试接口：
 * - GET /api/v1/weather/current - 根据位置获取气象信息
 */

const http = require('../utils/http')
const logger = require('../utils/logger')
const assert = require('../utils/assert')
require('dotenv').config()

/**
 * 气象模块测试
 */
async function testWeatherModule() {
  logger.title('气象模块测试')

  let testResults = {
    module: '气象模块',
    total: 0,
    passed: 0,
    failed: 0
  }

  const tests = [
    test1_getWeatherByLocation,
    test2_getWeatherInvalidParams,
    test3_getWeatherCache
  ]

  for (const test of tests) {
    const result = await test()
    testResults.total++
    if (result) {
      testResults.passed++
    } else {
      testResults.failed++
    }
  }

  logger.info('测试完成', testResults)

  return testResults
}

/**
 * 测试1: 根据位置获取气象信息
 */
async function test1_getWeatherByLocation() {
  logger.module('测试1: 根据位置获取气象信息')

  try {
    // 使用北京的经纬度
    const params = {
      latitude: 39.9042,
      longitude: 116.4074
    }

    logger.info('请求参数', params)

    const response = await http.get('/api/v1/weather/current', params)

    logger.info('响应数据', response)

    // 验证响应
    assert.assertSuccess(response, '获取气象信息成功')
    assert.assertExists(response.data, '返回数据存在')
    assert.assertHasField(response.data, 'weather', '包含weather字段')
    assert.assertHasField(response.data, 'weatherText', '包含weatherText字段')
    assert.assertHasField(response.data, 'temperature', '包含temperature字段')
    assert.assertHasField(response.data, 'temperatureMin', '包含temperatureMin字段')
    assert.assertHasField(response.data, 'temperatureMax', '包含temperatureMax字段')

    logger.success(`气象信息: ${response.data.weather}`)
    logger.success(`当前温度: ${response.data.temperature}℃`)
    logger.success(`温度范围: ${response.data.temperatureMin}℃ - ${response.data.temperatureMax}℃`)

    if (response.data.humidity !== undefined) {
      logger.success(`湿度: ${response.data.humidity}%`)
    }

    if (response.data.windDirection) {
      logger.success(`风向: ${response.data.windDirection}`)
    }

    if (response.data.windScale) {
      logger.success(`风力: ${response.data.windScale}级`)
    }

    logger.divider()
    return true

  } catch (error) {
    logger.error('测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试2: 测试无效参数
 */
async function test2_getWeatherInvalidParams() {
  logger.module('测试2: 测试无效参数')

  try {
    // 测试缺少参数
    try {
      await http.get('/api/v1/weather/current', {})
      logger.error('缺少参数时应该返回错误')
      return false
    } catch (error) {
      if (error.response && error.response.code === 400) {
        logger.success('缺少参数时返回400错误')
      } else {
        throw error
      }
    }

    // 测试无效经纬度
    try {
      await http.get('/api/v1/weather/current', {
        latitude: 999,
        longitude: 999
      })
      logger.error('无效经纬度时应该返回错误')
      return false
    } catch (error) {
      if (error.response && error.response.code === 400) {
        logger.success('无效经纬度时返回400错误')
      } else {
        throw error
      }
    }

    logger.divider()
    return true

  } catch (error) {
    logger.error('测试失败', error)
    logger.divider()
    return false
  }
}

/**
 * 测试3: 测试缓存功能
 */
async function test3_getWeatherCache() {
  logger.module('测试3: 测试缓存功能')

  try {
    const params = {
      latitude: 31.2304,
      longitude: 121.4737
    }

    // 第一次请求（不会使用缓存）
    logger.info('第一次请求（应该调用和风天气API）')
    const startTime1 = Date.now()
    const res1 = await http.get('/api/v1/weather/current', params)
    const time1 = Date.now() - startTime1

    assert.assertSuccess(res1, '第一次请求成功')
    logger.success(`第一次请求耗时: ${time1}ms`)

    // 等待1秒后第二次请求（应该使用缓存）
    await new Promise(resolve => setTimeout(resolve, 1000))

    logger.info('第二次请求（应该使用缓存）')
    const startTime2 = Date.now()
    const res2 = await http.get('/api/v1/weather/current', params)
    const time2 = Date.now() - startTime2

    assert.assertSuccess(res2, '第二次请求成功')
    logger.success(`第二次请求耗时: ${time2}ms`)

    // 缓存命中时，响应应该更快
    if (time2 < time1) {
      logger.success('缓存生效（第二次请求更快）')
    } else {
      logger.warn('缓存可能未生效（第二次请求耗时相近）')
    }

    // 验证数据一致性
    if (res1.data.weather === res2.data.weather) {
      logger.success('缓存数据一致')
    } else {
      logger.error('缓存数据不一致')
      return false
    }

    logger.divider()
    return true

  } catch (error) {
    logger.error('测试失败', error)
    logger.divider()
    return false
  }
}

module.exports = {
  testWeatherModule
}

