/**
 * 云存储工具函数
 * 使用腾讯云 CloudBase 云存储服务
 */

const cloudbase = require('@cloudbase/node-sdk')
const config = require('../config')
const path = require('path')

// 初始化 CloudBase 实例
let app = null

function initCloudBase() {
  if (app) {
    return app
  }

  const { envId, secretId, secretKey } = config.cloudStorage

  if (!envId || !secretId || !secretKey) {
    throw new Error('云存储配置不完整，请检查环境变量 CLOUDBASE_ENV、TENCENTCLOUD_SECRET_ID、TENCENTCLOUD_SECRET_KEY')
  }

  // 根据 CloudBase Node.js SDK 官方文档，服务端初始化使用 env 参数
  // 尝试两种初始化方式：env 和 envId
  try {
    app = cloudbase.init({
      env: envId,  // 使用 env 参数（官方文档推荐）
      secretId: secretId,
      secretKey: secretKey
    })
  } catch (error) {
    // 如果 env 参数失败，尝试使用 envId 参数
    console.warn('使用 env 参数初始化失败，尝试使用 envId 参数:', error.message)
    app = cloudbase.init({
      envId: envId,
      secretId: secretId,
      secretKey: secretKey
    })
  }

  return app
}

/**
 * 上传文件到云存储
 * @param {Buffer|Stream} fileContent - 文件内容（Buffer 或 Stream）
 * @param {string} fileName - 文件名
 * @param {string} folder - 存储文件夹（可选，默认为 uploads）
 * @returns {Promise<{url: string, fileId: string}>}
 */
async function uploadFile(fileContent, fileName, folder = null) {
  try {
    const app = initCloudBase()
    
    // 调试信息：检查配置
    const { envId, secretId, secretKey } = config.cloudStorage
    console.log('云存储配置检查:', {
      hasEnvId: !!envId,
      envIdPrefix: envId ? `${envId.substring(0, 10)}...` : '(未设置)',
      hasSecretId: !!secretId,
      hasSecretKey: !!secretKey
    })

    // 生成文件路径
    const timestamp = Date.now()
    const ext = path.extname(fileName)
    const baseName = path.basename(fileName, ext)
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    const finalFileName = `${sanitizedBaseName}_${timestamp}${ext}`
    
    const folderPath = folder || config.cloudStorage.prefix
    const cloudPath = `${folderPath}/${finalFileName}`

    console.log('准备上传文件:', { cloudPath, fileName: finalFileName, size: fileContent.length })

    // 上传文件（根据 CloudBase Node.js SDK 文档，直接在 app 上调用）
    const result = await app.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileContent
    })

    if (!result.fileID) {
      throw new Error('上传失败，未返回文件ID')
    }

    // 生成访问URL
    const domain = config.cloudStorage.domain
    const url = `https://${domain}/${cloudPath}`

    return {
      url: url,
      fileId: result.fileID,
      cloudPath: cloudPath,
      fileName: finalFileName
    }
  } catch (error) {
    console.error('云存储上传错误:', error)
    throw new Error(`文件上传失败: ${error.message}`)
  }
}

/**
 * 删除云存储文件
 * @param {string} fileId - 文件ID或云存储路径
 * @returns {Promise<boolean>}
 */
async function deleteFile(fileId) {
  try {
    const app = initCloudBase()

    // 如果传入的是URL，提取路径
    let cloudPath = fileId
    if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      const url = new URL(fileId)
      // 移除域名部分，获取路径
      cloudPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
    }

    // 如果传入的是 fileID（cloud:// 格式），直接使用；否则转换为 cloud:// 格式
    let fileID = cloudPath
    if (!cloudPath.startsWith('cloud://')) {
      // 如果不是 cloud:// 格式，需要转换为 fileID 格式
      // 格式：cloud://envId.bucket/path
      const envId = config.cloudStorage.envId
      fileID = `cloud://${envId}.cloudbase/${cloudPath}`
    }

    // 删除文件（根据 CloudBase Node.js SDK 文档，直接在 app 上调用）
    await app.deleteFile({
      fileList: [fileID]
    })

    return true
  } catch (error) {
    console.error('云存储删除错误:', error)
    throw new Error(`文件删除失败: ${error.message}`)
  }
}

/**
 * 批量删除云存储文件
 * @param {string[]} fileIds - 文件ID或云存储路径数组
 * @returns {Promise<{success: number, failed: number}>}
 */
async function deleteFiles(fileIds) {
  try {
    const app = initCloudBase()
    const envId = config.cloudStorage.envId

    // 处理URL，转换为 fileID 格式
    const fileIDList = fileIds.map(fileId => {
      // 如果已经是 cloud:// 格式，直接使用
      if (fileId.startsWith('cloud://')) {
        return fileId
      }
      
      // 如果是URL，提取路径
      let cloudPath = fileId
      if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
        const url = new URL(fileId)
        cloudPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
      }
      
      // 转换为 cloud:// 格式
      return `cloud://${envId}.cloudbase/${cloudPath}`
    })

    // 批量删除文件（根据 CloudBase Node.js SDK 文档，直接在 app 上调用）
    await app.deleteFile({
      fileList: fileIDList
    })

    return {
      success: fileIDList.length,
      failed: 0
    }
  } catch (error) {
    console.error('云存储批量删除错误:', error)
    // 即使部分失败，也返回成功数量为0
    return {
      success: 0,
      failed: fileIds.length
    }
  }
}

/**
 * 获取文件下载URL
 * @param {string} fileId - 文件ID或云存储路径
 * @param {number} expires - 过期时间（秒，默认1小时）
 * @returns {Promise<string>}
 */
async function getFileUrl(fileId, expires = 3600) {
  try {
    const app = initCloudBase()
    const envId = config.cloudStorage.envId

    // 转换为 fileID 格式
    let fileID = fileId
    if (!fileId.startsWith('cloud://')) {
      // 如果传入的是URL，提取路径
      let cloudPath = fileId
      if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
        const url = new URL(fileId)
        cloudPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
      }
      // 转换为 cloud:// 格式
      fileID = `cloud://${envId}.cloudbase/${cloudPath}`
    }

    // 获取临时下载URL（根据 CloudBase Node.js SDK 文档，直接在 app 上调用）
    const result = await app.getTempFileURL({
      fileList: [fileID]
    })

    if (result.fileList && result.fileList.length > 0) {
      const fileInfo = result.fileList[0]
      // 返回临时URL，如果获取失败则返回默认URL
      return fileInfo.tempFileURL || fileInfo.download_url || `https://${config.cloudStorage.domain}/${fileId}`
    }

    // 如果没有临时URL，返回默认URL
    const domain = config.cloudStorage.domain
    let cloudPath = fileId
    if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      const url = new URL(fileId)
      cloudPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
    }
    return `https://${domain}/${cloudPath}`
  } catch (error) {
    console.error('获取文件URL错误:', error)
    // 如果获取临时URL失败，返回默认URL
    const domain = config.cloudStorage.domain
    let cloudPath = fileId
    if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      const url = new URL(fileId)
      cloudPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
    }
    return `https://${domain}/${cloudPath}`
  }
}

/**
 * 验证文件类型
 * @param {string} mimeType - MIME类型
 * @returns {boolean}
 */
function isValidFileType(mimeType) {
  const allowedTypes = config.cloudStorage.allowedTypes
  if (allowedTypes.includes('*')) {
    return true
  }
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.split('/')[0]
      return mimeType.startsWith(prefix + '/')
    }
    return mimeType === type
  })
}

/**
 * 验证文件大小
 * @param {number} fileSize - 文件大小（字节）
 * @returns {boolean}
 */
function isValidFileSize(fileSize) {
  return fileSize <= config.cloudStorage.maxFileSize
}

module.exports = {
  uploadFile,
  deleteFile,
  deleteFiles,
  getFileUrl,
  isValidFileType,
  isValidFileSize
}

