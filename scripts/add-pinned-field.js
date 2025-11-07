/**
 * 为项目、工程、监理日志表添加置顶字段
 * 执行方式: node scripts/add-pinned-field.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

async function addPinnedField() {
  let connection
  
  try {
    console.log('📡 连接数据库...')
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })
    
    console.log('✅ 数据库连接成功\n')
    
    // 1. 为项目表添加 is_pinned 字段
    console.log('1️⃣ 为 projects 表添加 is_pinned 字段...')
    try {
      await connection.query(`
        ALTER TABLE projects 
        ADD COLUMN is_pinned tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否置顶：0-未置顶, 1-已置顶' AFTER creator_id
      `)
      await connection.query(`ALTER TABLE projects ADD INDEX idx_is_pinned (is_pinned)`)
      console.log('   ✅ projects 表字段添加成功')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ℹ️  projects 表已存在 is_pinned 字段，跳过')
      } else {
        throw error
      }
    }
    
    // 2. 为单项工程表添加 is_pinned 字段
    console.log('2️⃣ 为 works 表添加 is_pinned 字段...')
    try {
      await connection.query(`
        ALTER TABLE works 
        ADD COLUMN is_pinned tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否置顶：0-未置顶, 1-已置顶' AFTER creator_id
      `)
      await connection.query(`ALTER TABLE works ADD INDEX idx_is_pinned (is_pinned)`)
      console.log('   ✅ works 表字段添加成功')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ℹ️  works 表已存在 is_pinned 字段，跳过')
      } else {
        throw error
      }
    }
    
    // 3. 为监理日志表添加 is_pinned 字段
    console.log('3️⃣ 为 supervision_logs 表添加 is_pinned 字段...')
    try {
      await connection.query(`
        ALTER TABLE supervision_logs 
        ADD COLUMN is_pinned tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否置顶：0-未置顶, 1-已置顶' AFTER reviewer_date
      `)
      await connection.query(`ALTER TABLE supervision_logs ADD INDEX idx_is_pinned (is_pinned)`)
      console.log('   ✅ supervision_logs 表字段添加成功')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ℹ️  supervision_logs 表已存在 is_pinned 字段，跳过')
      } else {
        throw error
      }
    }
    
    console.log('\n🎉 所有字段添加完成！')
    console.log('现在可以使用置顶功能了：')
    console.log('  - POST /api/projects/:id/pin')
    console.log('  - POST /api/projects/:id/unpin')
    console.log('  - POST /api/works/:id/pin')
    console.log('  - POST /api/works/:id/unpin')
    console.log('  - POST /api/supervision-logs/:id/pin')
    console.log('  - POST /api/supervision-logs/:id/unpin')
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 提示: 无法连接到数据库，请检查：')
      console.error('   1. 数据库是否已启动')
      console.error('   2. .env 文件中的数据库配置是否正确')
      console.error('   3. 网络连接是否正常')
    }
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 执行
addPinnedField()

