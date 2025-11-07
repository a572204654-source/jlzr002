/**
 * 天气查询API测试
 * 对应文档：docx/c-api/天气查询API文档.md
 */

const request = require('../utils/request')
const logger = require('../utils/logger')

/**
 * 运行天气查询测试
 */
async function runWeatherTests() {
  logger.startModule('天气查询API测试')
  
  // 1. 获取当前气象信息
  await testGetCurrentWeather()
  
  // 2. 获取气象缓存统计
  await testGetWeatherStats()
}

/**
 * 测试获取当前气象信息
 */
async function testGetCurrentWeather() {
  try {
    // 使用上海的经纬度
    const response = await request({
      url: '/api/weather/current',
      method: 'GET',
      needAuth: true,
      params: {
        latitude: 31.2304,
        longitude: 121.4737
      }
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (!response.data.weather) {
      throw new Error('未返回weather字段')
    }
    
    if (typeof response.data.temperature === 'undefined') {
      throw new Error('未返回temperature字段')
    }
    
    logger.success('获取当前气象信息', {
      weather: response.data.weather,
      temperature: response.data.temperature,
      humidity: response.data.humidity,
      isMock: response.data.isMock || false
    })
    
    if (response.data.isMock) {
      logger.info('当前使用模拟气象数据')
    }
  } catch (error) {
    logger.fail('获取当前气象信息', error)
  }
}

/**
 * 测试获取气象缓存统计
 */
async function testGetWeatherStats() {
  try {
    const response = await request({
      url: '/api/weather/stats',
      method: 'GET',
      needAuth: true
    })
    
    if (response.code !== 0) {
      throw new Error(`响应码错误: ${response.code}`)
    }
    
    if (typeof response.data.cacheSize === 'undefined') {
      throw new Error('未返回cacheSize')
    }
    
    if (!response.data.stats) {
      throw new Error('未返回stats')
    }
    
    logger.success('获取气象缓存统计', {
      cacheSize: response.data.cacheSize,
      hits: response.data.stats.hits,
      misses: response.data.stats.misses
    })
  } catch (error) {
    logger.fail('获取气象缓存统计', error)
  }
}

module.exports = { runWeatherTests }

