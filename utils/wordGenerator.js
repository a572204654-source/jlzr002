const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, VerticalAlign, BorderStyle, TextDirection, TextRun, PageBreak } = require('docx')

/**
 * 生成监理日志Word文档（按照标准格式1:1还原）
 * @param {Object} logData - 监理日志数据
 * @returns {Promise<Buffer>} Word文档Buffer
 */
async function generateSupervisionLogWord(logData) {
  try {
    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          // ============== 第一页：封面页 ==============
          // 附录标识
          new Paragraph({
            text: '附录 11-5 表',
            alignment: AlignmentType.LEFT,
            spacing: {
              after: 400
            },
            children: [
              new TextRun({
                text: '附录 11-5 表',
                size: 24,
                font: '宋体'
              })
            ]
          }),

          // 封面主表格（包含标题）
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
            },
            rows: [
              // 第1行：项目名称
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('项目名称')]
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 3,
                    children: [createLeftParagraph(logData.project_name || '')]
                  })
                ]
              }),

              // 第2行：项目编号
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('项目编号')]
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 3,
                    children: [createLeftParagraph(logData.project_code || '')]
                  })
                ]
              }),

              // 第3行：单项工程名称和编号
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单项工程名称')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph('')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单项工程编号')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph('')]
                  })
                ]
              }),

              // 第4行：单位工程名称和编号
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单位工程名称')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph(logData.work_name || '')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单位工程编号')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph(logData.work_code || '')]
                  })
                ]
              }),

              // 第5行：空白区域 + "监理日志"大标题
              new TableRow({
                height: { value: 7000, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 4,
                    children: [
                      new Paragraph({
                        text: '监理日志',
                        alignment: AlignmentType.CENTER,
                        spacing: {
                          before: 2000,
                          after: 2000
                        },
                        children: [
                          new TextRun({
                            text: '监理日志',
                            size: 72,
                            bold: true,
                            font: '宋体'
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({
            text: '',
            spacing: { after: 400 }
          }),

          // 项目监理机构标题
          new Paragraph({
            text: '项目监理机构',
            alignment: AlignmentType.LEFT,
            spacing: {
              after: 200,
              before: 200
            },
            children: [
              new TextRun({
                text: '项目监理机构',
                size: 24,
                font: '宋体'
              })
            ]
          }),

          // 底部签名表格
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
            },
            rows: [
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('总监理工程师')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph('')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('专业监理工程师')]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph('')]
                  })
                ]
              }),
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 2,
                    children: [createCenteredParagraph('监理日志起止时间')]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 2,
                    children: [createLeftParagraph('')]
                  })
                ]
              })
            ]
          }),

          // 分页符
          new Paragraph({
            children: [new PageBreak()]
          }),

          // ============== 第二页：日志内容页 ==============
          new Paragraph({
            text: '监理日志',
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
              before: 200
            },
            children: [
              new TextRun({
                text: '监理日志',
                size: 44,
                bold: true,
                font: '宋体'
              })
            ]
          }),

          // 主内容表格
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
            },
            rows: [
              // 第1行：单位工程名称和编号
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单位工程名称')]
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph(logData.work_name || '')]
                  }),
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单位工程编号')]
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph(logData.work_code || '')]
                  })
                ]
              }),

              // 第2行：日期
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('日    期')]
                  }),
                  new TableCell({
                    width: { size: 80, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 3,
                    children: [createLeftParagraph(formatDate(logData.log_date))]
                  })
                ]
              }),

              // 第3行：气象
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('气    象')]
                  }),
                  new TableCell({
                    width: { size: 80, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 3,
                    children: [createLeftParagraph(logData.weather || '')]
                  })
                ]
              }),

              // 第4行：工程动态
              new TableRow({
                height: { value: 2800, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                    children: [createVerticalParagraph('工程动态')]
                  }),
                  new TableCell({
                    width: { size: 92, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    columnSpan: 3,
                    children: [createContentParagraph(logData.project_dynamics || '')]
                  })
                ]
              }),

              // 第5行：监理工作情况
              new TableRow({
                height: { value: 2800, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                    children: [createVerticalParagraph('监理工作情况')]
                  }),
                  new TableCell({
                    width: { size: 92, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    columnSpan: 3,
                    children: [createContentParagraph(logData.supervision_work || '')]
                  })
                ]
              }),

              // 第6行：安全监理工作情况
              new TableRow({
                height: { value: 2800, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                    children: [createVerticalParagraph('安全监理工作情况')]
                  }),
                  new TableCell({
                    width: { size: 92, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    columnSpan: 3,
                    children: [createContentParagraph(logData.safety_work || '')]
                  })
                ]
              }),

              // 第7行：签名区
              new TableRow({
                height: { value: 1000, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('记录人')]
                  }),
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph(logData.recorder_name || '')]
                  }),
                  new TableCell({
                    width: { size: 17, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('年   月   日')]
                  }),
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('审核人')]
                  }),
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph(logData.reviewer_name || '')]
                  }),
                  new TableCell({
                    width: { size: 17, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('年   月   日')]
                  })
                ]
              })
            ]
          })
        ]
      }]
    })

    // 生成Buffer
    const buffer = await Packer.toBuffer(doc)
    return buffer

  } catch (error) {
    console.error('生成Word文档错误:', error)
    throw error
  }
}

/**
 * 创建居中对齐的段落
 * @param {string} text - 文本内容
 * @param {boolean} bold - 是否加粗
 * @returns {Paragraph}
 */
function createCenteredParagraph(text, bold = false) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: text,
        size: 24,
        bold: bold,
        font: '宋体'
      })
    ]
  })
}

/**
 * 创建左对齐的段落
 * @param {string} text - 文本内容
 * @returns {Paragraph}
 */
function createLeftParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text,
        size: 24,
        font: '宋体'
      })
    ]
  })
}

/**
 * 创建纵向文字段落
 * @param {string} text - 文本内容
 * @returns {Paragraph}
 */
function createVerticalParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: text,
        size: 24,
        font: '宋体'
      })
    ]
  })
}

/**
 * 创建内容段落（带缩进）
 * @param {string} text - 文本内容
 * @returns {Paragraph}
 */
function createContentParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: {
      left: 400,
      right: 200
    },
    spacing: {
      line: 360,
      before: 100,
      after: 100
    },
    children: [
      new TextRun({
        text: text,
        size: 24,
        font: '宋体'
      })
    ]
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
