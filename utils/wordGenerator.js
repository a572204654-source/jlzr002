const officegen = require('officegen')

/**
 * 生成监理日志Word文档
 * @param {Object} logData - 监理日志数据
 * @returns {Promise<Buffer>} Word文档Buffer
 */
async function generateSupervisionLogWord(logData) {
  return new Promise((resolve, reject) => {
    try {
      // 创建Word文档对象
      const docx = officegen({
        type: 'docx',
        subject: '监理日志',
        keywords: '监理,日志,工程',
        description: '监理日志导出文档'
      })

      // ============== 标题 ==============
      const titleParagraph = docx.createP({ align: 'center' })
      titleParagraph.addText('监理日志', {
        font_size: 18,
        bold: true,
        font_face: '宋体'
      })

      // 添加空行
      docx.createP()

      // ============== 基本信息表格 ==============
      const infoTable = [
        [
          { val: '项目名称', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: logData.project_name || '', opts: { sz: 24 } },
          { val: '项目编号', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: logData.project_code || '', opts: { sz: 24 } }
        ],
        [
          { val: '工程名称', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: logData.work_name || '', opts: { sz: 24 } },
          { val: '工程编号', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: logData.work_code || '', opts: { sz: 24 } }
        ],
        [
          { val: '日志日期', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: formatDate(logData.log_date), opts: { sz: 24 } },
          { val: '气象情况', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: logData.weather || '', opts: { sz: 24 } }
        ]
      ]

      docx.createTable(infoTable, {
        tableColWidth: [2000, 4000, 2000, 4000],
        tableSize: 24,
        tableAlign: 'center',
        tableFontFamily: '宋体',
        borders: true
      })

      // 添加空行
      docx.createP()

      // ============== 工程动态 ==============
      const dynamicsTitleParagraph = docx.createP()
      dynamicsTitleParagraph.addText('一、工程动态', {
        font_size: 14,
        bold: true,
        font_face: '宋体'
      })

      const dynamicsContent = docx.createP()
      dynamicsContent.addText(logData.project_dynamics || '无', {
        font_size: 12,
        font_face: '宋体'
      })

      // 添加空行
      docx.createP()

      // ============== 监理工作情况 ==============
      const supervisionTitleParagraph = docx.createP()
      supervisionTitleParagraph.addText('二、监理工作情况', {
        font_size: 14,
        bold: true,
        font_face: '宋体'
      })

      const supervisionContent = docx.createP()
      supervisionContent.addText(logData.supervision_work || '无', {
        font_size: 12,
        font_face: '宋体'
      })

      // 添加空行
      docx.createP()

      // ============== 安全监理工作情况 ==============
      const safetyTitleParagraph = docx.createP()
      safetyTitleParagraph.addText('三、安全监理工作情况', {
        font_size: 14,
        bold: true,
        font_face: '宋体'
      })

      const safetyContent = docx.createP()
      safetyContent.addText(logData.safety_work || '无', {
        font_size: 12,
        font_face: '宋体'
      })

      // 添加空行
      docx.createP()
      docx.createP()

      // ============== 签名信息表格 ==============
      const signTable = [
        [
          { val: '记录人', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: logData.recorder_name || '', opts: { sz: 24 } },
          { val: '记录日期', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: formatDate(logData.recorder_date), opts: { sz: 24 } }
        ],
        [
          { val: '审核人', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: logData.reviewer_name || '', opts: { sz: 24 } },
          { val: '审核日期', opts: { b: true, sz: 24, shd: { fill: 'f0f0f0' } } },
          { val: formatDate(logData.reviewer_date), opts: { sz: 24 } }
        ]
      ]

      docx.createTable(signTable, {
        tableColWidth: [2000, 4000, 2000, 4000],
        tableSize: 24,
        tableAlign: 'center',
        tableFontFamily: '宋体',
        borders: true
      })

      // 如果有附件信息，添加附件列表
      if (logData.attachments && logData.attachments.length > 0) {
        docx.createP()
        docx.createP()

        const attachmentTitleParagraph = docx.createP()
        attachmentTitleParagraph.addText('附件列表', {
          font_size: 14,
          bold: true,
          font_face: '宋体'
        })

        logData.attachments.forEach((attachment, index) => {
          const attachmentParagraph = docx.createP()
          attachmentParagraph.addText(`${index + 1}. ${attachment.file_name || attachment.fileName} (${formatFileSize(attachment.file_size || attachment.fileSize)})`, {
            font_size: 12,
            font_face: '宋体'
          })
        })
      }

      // 生成文档Buffer
      const chunks = []
      
      // 创建可写流收集数据
      const { Writable } = require('stream')
      const outputStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      outputStream.on('finish', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer)
      })

      outputStream.on('error', (err) => {
        reject(err)
      })

      // 生成文档
      docx.generate(outputStream)

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}年${month}月${day}日`
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

module.exports = {
  generateSupervisionLogWord
}

