/**
 * 项目初始化脚本
 * 用于快速配置和启动项目
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log('CloudBase 小程序后端项目初始化');
console.log('========================================\n');

// 检查.env文件
function checkEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');

  if (!fs.existsSync(envPath)) {
    console.log('⚠️  未找到 .env 文件，正在复制 .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✓ 已创建 .env 文件');
    console.log('⚠️  请编辑 .env 文件，配置正确的环境变量\n');
    return false;
  } else {
    console.log('✓ .env 文件已存在\n');
    return true;
  }
}

// 检查依赖
function checkDependencies() {
  console.log('检查项目依赖...');
  const packagePath = path.join(__dirname, '../package.json');
  const nodeModulesPath = path.join(__dirname, '../node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  未安装依赖，正在安装...');
    try {
      execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      console.log('✓ 依赖安装完成\n');
    } catch (error) {
      console.error('✗ 依赖安装失败:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✓ 依赖已安装\n');
  }
}

// 测试数据库连接
async function testDatabase() {
  console.log('测试数据库连接...');
  try {
    const { testConnection } = require('../config/database');
    const connected = await testConnection();
    
    if (connected) {
      console.log('✓ 数据库连接成功\n');
      return true;
    } else {
      console.log('✗ 数据库连接失败');
      console.log('⚠️  请检查 .env 文件中的数据库配置\n');
      return false;
    }
  } catch (error) {
    console.log('✗ 数据库连接测试失败:', error.message);
    console.log('⚠️  请检查 .env 文件中的数据库配置\n');
    return false;
  }
}

// 初始化数据库
async function initDatabase() {
  console.log('初始化数据库...');
  try {
    const initDb = require('./init-db');
    await initDb();
    console.log('✓ 数据库初始化成功\n');
    return true;
  } catch (error) {
    console.log('⚠️  数据库初始化失败:', error.message);
    console.log('提示: 如果数据库已初始化，可以忽略此错误\n');
    return false;
  }
}

// 显示下一步操作
function showNextSteps() {
  console.log('========================================');
  console.log('初始化完成！');
  console.log('========================================\n');
  console.log('下一步操作：');
  console.log('1. 检查并配置 .env 文件中的环境变量');
  console.log('2. 运行 npm run dev 启动开发服务器');
  console.log('3. 访问 http://localhost/api 查看API信息');
  console.log('4. 访问 http://localhost/health 检查服务健康状态\n');
  console.log('相关文档：');
  console.log('- README.md - 项目说明');
  console.log('- API.md - API接口文档');
  console.log('- DEPLOY.md - 部署指南\n');
  console.log('小程序端示例代码：');
  console.log('- miniapp-example/ 目录\n');
}

// 主函数
async function main() {
  try {
    // 1. 检查.env文件
    const envExists = checkEnvFile();

    // 2. 检查依赖
    checkDependencies();

    if (!envExists) {
      console.log('⚠️  请先配置 .env 文件，然后重新运行此脚本');
      console.log('或者手动运行以下命令：');
      console.log('  node scripts/init-db.js  # 初始化数据库');
      console.log('  npm run dev              # 启动开发服务器\n');
      return;
    }

    // 3. 测试数据库连接
    const dbConnected = await testDatabase();

    // 4. 初始化数据库（如果连接成功）
    if (dbConnected) {
      await initDatabase();
    }

    // 5. 显示下一步操作
    showNextSteps();

  } catch (error) {
    console.error('初始化过程出错:', error);
    process.exit(1);
  }
}

// 运行
main();

