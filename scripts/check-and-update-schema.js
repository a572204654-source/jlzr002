/**
 * 检查并更新数据库表结构
 * 添加缺失的字段
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function updateSchema() {
  let connection;
  
  try {
    console.log('🔍 开始检查数据库表结构...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      charset: config.database.charset
    });

    console.log('✓ 已连接到数据库');

    // 检查 users 表的列
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [config.database.database]
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('✓ 当前 users 表的字段:', existingColumns.join(', '));

    // 需要的字段
    const requiredColumns = {
      'gender': "ADD COLUMN `gender` tinyint(1) DEFAULT 0 COMMENT '性别：0未知，1男，2女' AFTER `avatar`",
      'country': "ADD COLUMN `country` varchar(50) DEFAULT NULL COMMENT '国家' AFTER `gender`",
      'province': "ADD COLUMN `province` varchar(50) DEFAULT NULL COMMENT '省份' AFTER `country`",
      'city': "ADD COLUMN `city` varchar(50) DEFAULT NULL COMMENT '城市' AFTER `province`",
      'phone': "ADD COLUMN `phone` varchar(20) DEFAULT NULL COMMENT '手机号' AFTER `city`"
    };

    // 检查并添加缺失的字段
    let updated = false;
    for (const [columnName, alterSQL] of Object.entries(requiredColumns)) {
      if (!existingColumns.includes(columnName)) {
        console.log(`\n⚠️  缺少字段: ${columnName}`);
        console.log(`   正在添加...`);
        
        await connection.query(`ALTER TABLE users ${alterSQL}`);
        console.log(`✓ 已添加字段: ${columnName}`);
        updated = true;
      } else {
        console.log(`✓ 字段已存在: ${columnName}`);
      }
    }

    if (updated) {
      console.log('\n🎉 数据库表结构更新完成！');
    } else {
      console.log('\n✓ 数据库表结构已是最新，无需更新');
    }

    // 显示最终的表结构
    console.log('\n📋 最终的 users 表结构:');
    const [finalColumns] = await connection.query(
      "SHOW COLUMNS FROM users"
    );
    
    console.table(finalColumns.map(col => ({
      字段: col.Field,
      类型: col.Type,
      允许空值: col.Null,
      默认值: col.Default,
      注释: col.Comment || ''
    })));
    
  } catch (error) {
    console.error('\n❌ 更新失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行更新
if (require.main === module) {
  updateSchema();
}

module.exports = updateSchema;

