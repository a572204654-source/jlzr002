/**
 * 云存储工具函数（使用 COS SDK 直接上传）
 * 此方案可以绕过 CloudBase API 权限问题，直接使用 COS 上传
 * 
 * 注意：需要先通过 CloudBase 获取 COS 临时密钥
 * 或者使用具有 COS 权限的 Secret ID/Key
 */

const COS = require('cos-nodejs-sdk-v5')
const config = require('../config')
const path = require('path')

// 初始化 COS 实例
let cosClient = null

function initCOS() {
  if (cosClient) {
    return cosClient
  }

  const { envId, secretId, secretKey } = config.cloudStorage

  if (!envId || !secretId || !secretKey) {
    throw new Error('云存储配置不完整，请检查环境变量')
  }

  // 从环境ID中提取区域信息
  // CloudBase 环境ID格式: {envId}-{region}
  // 例如: jlzr1101-5g9kplxza13a780d
  // 默认使用上海区域
  const region = process.env.COS_REGION || 'ap-shanghai'

  // 构建 COS Bucket 名称
  // CloudBase 云存储的 Bucket 格式: {envId}-{数字}.tcb.qcloud.la
  // 需要从域名中提取，或者使用环境变量
  const bucket = process.env.COS_BUCKET || `cloudbase-${envId}-${region}`

  // 初始化 COS 客户端
  cosClient = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
    Region: region
  })

  return cosClient
}

/**
 * 从 CloudBase 获取 COS 临时密钥
 * 如果 CloudBase SDK 可用，使用此方法获取临时密钥
 */
async function getCOSTempCredentials() {
  try {
    const cloudbase = require('@cloudbase/node-sdk')
    const { envId, secretId, secretKey } = config.cloudStorage

    const app = cloudbase.init({
      env: envId,
      secretId: secretId,
      secretKey: secretKey
    })

    // 尝试获取 COS 临时密钥
    // 注意：这个方法可能也需要权限，如果失败则使用永久密钥
    const result = await app.getStorageManager().getTempFileURL({
      fileList: []
    })

    return result
  } catch (error) {
    console.warn('获取 COS 临时密钥失败，使用永久密钥:', error.message)
    return null
  }
}

/**
 * 上传文件到 COS
 * @param {Buffer|Stream} fileContent - 文件内容
 * @param {string} fileName - 文件名
 * @param {string} folder - 存储文件夹（可选）
 * @returns {Promise<{url: string, fileId: string, cloudPath: string, fileName: string}>}
 */
async function uploadFile(fileContent, fileName, folder = null) {
  try {
    const cos = initCOS()
    const { envId } = config.cloudStorage

    // 生成文件路径
    const timestamp = Date.now()
    const ext = path.extname(fileName)
    const baseName = path.basename(fileName, ext)
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    const finalFileName = `${sanitizedBaseName}_${timestamp}${ext}`

    const folderPath = folder || config.cloudStorage.prefix
    const key = `${folderPath}/${finalFileName}`

    // 从域名中提取 Bucket 名称
    // 域名格式: 6a6c-{envId}-{appid}.tcb.qcloud.la
    // Bucket 名称格式: {name}-{appid}，例如: 6a6c-jlzr1101-5g9kplxza13a780d-1302271970
    const storageDomain = config.cloudStorage.domain
    // 提取域名前缀部分（去掉 .tcb.qcloud.la）
    const bucketMatch = storageDomain.match(/^([^.]+)\.tcb\.qcloud\.la$/)
    const bucket = bucketMatch ? bucketMatch[1] : `cloudbase-${envId}`

    // 确定区域（从域名或配置中获取）
    const region = process.env.COS_REGION || 'ap-shanghai'

    console.log('准备上传文件到 COS:', {
      bucket,
      region,
      key,
      size: fileContent.length
    })

    // 上传文件到 COS
    // 使用Promise包装确保正确处理
    let result
    try {
      console.log('开始调用COS putObject...')
      
      // 使用Promise包装，确保正确处理
      result = await new Promise((resolve, reject) => {
        cos.putObject({
          Bucket: bucket,
          Region: region,
          Key: key,
          Body: fileContent,
          ContentLength: fileContent.length
        }, (err, data) => {
          if (err) {
            console.error('COS putObject 回调错误:', err)
            reject(err)
          } else {
            console.log('COS putObject 回调成功:', {
              hasData: !!data,
              dataType: typeof data,
              keys: data ? Object.keys(data) : []
            })
            resolve(data)
          }
        })
      })
      
      console.log('COS putObject Promise返回结果:', {
        hasResult: !!result,
        resultType: typeof result,
        keys: result ? Object.keys(result) : [],
        statusCode: result?.statusCode,
        etag: result?.ETag,
        location: result?.Location
      })
    } catch (putError) {
      console.error('COS putObject 调用异常:', {
        message: putError.message,
        code: putError.code,
        statusCode: putError.statusCode,
        error: putError
      })
      throw new Error(`COS上传调用失败: ${putError.message || putError.code || '未知错误'}`)
    }

    // COS SDK 成功时返回 ETag 或 statusCode，不一定会返回 Location
    // 检查是否有错误或返回结果
    if (!result) {
      console.error('COS putObject 返回 undefined，可能的原因:')
      console.error('1. Bucket名称不正确:', bucket)
      console.error('2. Region不正确:', region)
      console.error('3. 权限不足或Secret ID/Key无效')
      throw new Error('上传失败，COS未返回结果。请检查Bucket名称、Region和权限配置')
    }

    // 检查状态码（如果存在）
    if (result.statusCode !== undefined) {
      if (result.statusCode >= 200 && result.statusCode < 300) {
        // 上传成功
        console.log('COS上传成功:', {
          statusCode: result.statusCode,
          etag: result.ETag,
          location: result.Location
        })
      } else {
        throw new Error(`上传失败，状态码: ${result.statusCode}`)
      }
    } else if (result.ETag) {
      // 有ETag说明上传成功
      console.log('COS上传成功（通过ETag判断）:', {
        etag: result.ETag,
        location: result.Location
      })
    } else {
      // 没有状态码也没有ETag，可能有问题
      console.warn('COS上传返回结果异常，但继续处理:', result)
    }

    // 生成访问URL
    const url = `https://${storageDomain}/${key}`

    return {
      url: url,
      fileId: `cloud://${envId}.cloudbase/${key}`,
      cloudPath: key,
      fileName: finalFileName,
      etag: result.ETag || ''
    }
  } catch (error) {
    console.error('COS 上传错误:', error)
    throw new Error(`文件上传失败: ${error.message}`)
  }
}

/**
 * 删除 COS 文件
 * @param {string} fileId - 文件ID或路径
 * @returns {Promise<boolean>}
 */
async function deleteFile(fileId) {
  try {
    const cos = initCOS()
    const { envId } = config.cloudStorage

    // 提取文件路径
    let key = fileId
    if (fileId.startsWith('cloud://')) {
      // cloud://envId.cloudbase/path -> path
      const match = fileId.match(/cloud:\/\/[^/]+\/(.+)/)
      key = match ? match[1] : fileId
    } else if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      const url = new URL(fileId)
      key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
    }

    // 获取 Bucket
    // 从域名中提取 Bucket 名称（与上传函数保持一致）
    const storageDomain = config.cloudStorage.domain
    const bucketMatch = storageDomain.match(/^([^.]+)\.tcb\.qcloud\.la$/)
    const bucket = bucketMatch ? bucketMatch[1] : `cloudbase-${envId}`
    const region = process.env.COS_REGION || 'ap-shanghai'

    await cos.deleteObject({
      Bucket: bucket,
      Region: region,
      Key: key
    })

    return true
  } catch (error) {
    console.error('COS 删除错误:', error)
    throw new Error(`文件删除失败: ${error.message}`)
  }
}

/**
 * 获取文件下载URL
 * @param {string} fileId - 文件ID或路径
 * @param {number} expires - 过期时间（秒，默认1小时）
 * @returns {Promise<string>}
 */
async function getFileUrl(fileId, expires = 3600) {
  try {
    const cos = initCOS()
    const { envId } = config.cloudStorage

    // 提取文件路径
    let key = fileId
    if (fileId.startsWith('cloud://')) {
      const match = fileId.match(/cloud:\/\/[^/]+\/(.+)/)
      key = match ? match[1] : fileId
    } else if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      const url = new URL(fileId)
      key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
    }

    // 获取 Bucket
    // 从域名中提取 Bucket 名称（与上传函数保持一致）
    const storageDomain = config.cloudStorage.domain
    const bucketMatch = storageDomain.match(/^([^.]+)\.tcb\.qcloud\.la$/)
    const bucket = bucketMatch ? bucketMatch[1] : `cloudbase-${envId}`
    const region = process.env.COS_REGION || 'ap-shanghai'

    // 获取预签名URL
    const url = cos.getObjectUrl({
      Bucket: bucket,
      Region: region,
      Key: key,
      Expires: expires,
      Sign: true
    })

    return url
  } catch (error) {
    console.error('获取文件URL错误:', error)
    // 如果获取失败，返回默认URL
    const storageDomain = config.cloudStorage.domain
    let key = fileId
    if (fileId.startsWith('cloud://')) {
      const match = fileId.match(/cloud:\/\/[^/]+\/(.+)/)
      key = match ? match[1] : fileId
    } else if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      const url = new URL(fileId)
      key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
    }
    return `https://${storageDomain}/${key}`
  }
}

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
  // 复用原有的验证函数
  isValidFileType: require('./cloudStorage').isValidFileType,
  isValidFileSize: require('./cloudStorage').isValidFileSize
}

