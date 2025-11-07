const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

async function initDatabase() {
  let connection;
  
  try {
    console.log('开始初始化数据库...');
    
    // 创建数据库连接（不指定数据库）
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      charset: config.database.charset,
      multipleStatements: true // 允许执行多条SQL语句
    });

    console.log('✓ 已连接到MySQL服务器');

    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'init-db-new.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // 执行SQL语句
    await connection.query(sql);
    console.log('✓ 数据库表初始化成功');

    console.log('\n数据库初始化完成！');
    console.log(`数据库名称: ${config.database.database}`);
    
  } catch (error) {
    console.error('✗ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;

