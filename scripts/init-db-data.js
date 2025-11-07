const mysql = require('mysql2/promise')
const config = require('../config')

async function initTestData() {
  let connection
  
  try {
    console.log('开始初始化测试数据...')
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      charset: config.database.charset
    })

    console.log('✓ 已连接到数据库')

    // 清空现有数据（可选）
    console.log('清理现有测试数据...')
    await connection.query('DELETE FROM attachments')
    await connection.query('DELETE FROM ai_chat_logs')
    await connection.query('DELETE FROM supervision_logs')
    await connection.query('DELETE FROM works')
    await connection.query('DELETE FROM projects')
    await connection.query('DELETE FROM users')

    // 插入测试用户
    console.log('插入测试用户数据...')
    await connection.query(`
      INSERT INTO users (id, openid, unionid, nickname, avatar, organization) VALUES
      (1, 'test_openid_001', 'test_unionid_001', '张三', 'https://example.com/avatar1.jpg', '华建监理有限公司'),
      (2, 'test_openid_002', 'test_unionid_002', '李四', 'https://example.com/avatar2.jpg', '中建监理集团'),
      (3, 'test_openid_003', 'test_unionid_003', '王五', 'https://example.com/avatar3.jpg', '华建监理有限公司')
    `)

    // 插入测试项目
    console.log('插入测试项目数据...')
    await connection.query(`
      INSERT INTO projects (id, project_name, project_code, organization, chief_engineer, description, address, start_date, end_date, creator_id) VALUES
      (1, '城市综合体建设项目', 'CTZH-2024-001', '华建监理有限公司', '李建国', '上海市浦东新区大型商业综合体项目，总建筑面积约15万平方米', '上海市浦东新区世纪大道XXX号', '2024-01-01', '2024-12-31', 1),
      (2, '高速公路改扩建工程', 'GSGLS-2024-002', '中建监理集团', '赵明', '某高速公路改扩建工程，全长约50公里', '江苏省南京市', '2024-03-01', '2025-03-01', 2),
      (3, '住宅小区建设项目', 'ZZZQ-2024-003', '华建监理有限公司', '李建国', '高端住宅小区开发项目', '上海市闵行区', '2024-06-01', '2025-06-01', 1)
    `)

    // 插入测试工程
    console.log('插入测试工程数据...')
    await connection.query(`
      INSERT INTO works (id, project_id, work_name, work_code, unit_work, start_date, end_date, color, description, creator_id) VALUES
      (1, 1, '主体结构工程', 'CTZH-2024-001-ZTJ', '第一施工段', '2024-01-01', '2024-06-30', '#0d9488', '主体结构施工监理', 1),
      (2, 1, '装饰装修工程', 'CTZH-2024-001-ZSZX', '第二施工段', '2024-07-01', '2024-12-31', '#2563eb', '装饰装修施工监理', 1),
      (3, 1, '机电安装工程', 'CTZH-2024-001-JDAZ', '第三施工段', '2024-08-01', '2024-12-31', '#dc2626', '机电设备安装监理', 1),
      (4, 2, '路基工程', 'GSGLS-2024-002-LJ', '全线', '2024-03-01', '2024-08-31', '#7c3aed', '路基施工监理', 2),
      (5, 2, '路面工程', 'GSGLS-2024-002-LM', '全线', '2024-09-01', '2025-03-01', '#ea580c', '路面施工监理', 2)
    `)

    // 插入测试监理日志
    console.log('插入测试监理日志数据...')
    await connection.query(`
      INSERT INTO supervision_logs (project_id, work_id, user_id, log_date, weather, project_dynamics, supervision_work, safety_work, recorder_name, recorder_date, reviewer_name, reviewer_date) VALUES
      (1, 1, 1, '2024-10-21', '晴 16-24℃ 南风2级', '今日完成主体结构第三层混凝土浇筑，浇筑量约350立方米。施工单位组织3个作业班组，投入60名工人进行施工。混凝土质量经检查符合设计要求。', '1. 检查模板支撑系统，符合规范要求。\n2. 旁站混凝土浇筑全过程，振捣密实。\n3. 检查钢筋绑扎质量，合格率100%。\n4. 监督施工单位做好养护准备工作。', '1. 检查高处作业防护措施，安全网、防护栏杆齐全有效。\n2. 发现3处电缆线路未规范敷设，要求立即整改。\n3. 检查特种作业人员持证情况，均持证上岗。', '张三', '2024-10-21', '李建国', '2024-10-22'),
      (1, 1, 1, '2024-10-22', '多云 15-22℃ 东风3级', '继续进行第三层混凝土养护工作，检查养护措施落实情况。开始第四层钢筋绑扎施工，完成约30%。', '1. 检查混凝土养护措施，覆盖及洒水养护到位。\n2. 审核第四层钢筋加工配料单，符合设计要求。\n3. 检查钢筋原材料质保书，材料合格。', '1. 检查施工现场临时用电，配电箱防护良好。\n2. 检查脚手架搭设质量，符合规范要求。\n3. 督促施工单位完善安全标识标牌。', '张三', '2024-10-22', '李建国', '2024-10-23'),
      (1, 1, 1, '2024-10-23', '晴 17-25℃ 南风2级', '第四层钢筋绑扎完成约80%，质量检查合格。模板加工准备就绪。', '1. 检查钢筋绑扎质量，间距、搭接长度符合要求。\n2. 复核钢筋数量及规格，与设计一致。\n3. 检查预埋件位置，准确无误。', '1. 对施工人员进行安全教育，提高安全意识。\n2. 检查安全帽佩戴情况，全员正确佩戴。\n3. 检查消防器材配置，满足要求。', '张三', '2024-10-23', '李建国', '2024-10-24'),
      (1, 2, 3, '2024-10-21', '晴 16-24℃ 南风2级', '开始进行二层外墙抹灰施工，完成约200平方米。', '1. 检查抹灰砂浆配合比，符合要求。\n2. 检查基层处理质量，清洁、湿润到位。\n3. 检查抹灰厚度及平整度，符合规范。', '1. 检查外脚手架稳固性，符合要求。\n2. 检查安全网设置，密目网完整有效。', '王五', '2024-10-21', '李建国', '2024-10-22'),
      (2, 4, 2, '2024-10-21', '阴 12-18℃ 北风4级', '完成K3+200至K3+500段路基土方填筑，填筑量约5000立方米。', '1. 检查填料质量，符合设计要求。\n2. 旁站压实度检测，合格率98%。\n3. 检查路基边坡整修质量，坡度符合要求。', '1. 检查施工车辆运行安全，限速标志明显。\n2. 检查交通导改措施，安全有效。\n3. 巡查施工区域警示标识，完善齐全。', '李四', '2024-10-21', '赵明', '2024-10-22')
    `)

    // 插入测试AI对话记录
    console.log('插入测试AI对话记录数据...')
    const sessionId = 'session_' + Date.now()
    await connection.query(`
      INSERT INTO ai_chat_logs (user_id, session_id, message_type, content) VALUES
      (1, '${sessionId}', 'user', '帮我优化今天的监理日志内容'),
      (1, '${sessionId}', 'ai', '好的，我来帮您优化监理日志内容。请提供您今天记录的具体内容，我会从专业角度为您完善。')
    `)

    // 插入系统配置
    console.log('插入系统配置数据...')
    await connection.query(`
      INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
      ('doubao_api_key', '', 'string', '豆包AI API密钥'),
      ('doubao_model', 'doubao-pro', 'string', '豆包AI模型'),
      ('max_upload_size', '10485760', 'number', '文件上传最大大小（字节）'),
      ('allowed_file_types', '["image/jpeg","image/png","image/gif","application/pdf","application/msword"]', 'json', '允许上传的文件类型')
    `)

    console.log('✓ 测试数据初始化成功')
    console.log('\n初始化统计：')
    
    // 统计数据
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users')
    const [projects] = await connection.query('SELECT COUNT(*) as count FROM projects')
    const [works] = await connection.query('SELECT COUNT(*) as count FROM works')
    const [logs] = await connection.query('SELECT COUNT(*) as count FROM supervision_logs')
    
    console.log(`用户数: ${users[0].count}`)
    console.log(`项目数: ${projects[0].count}`)
    console.log(`工程数: ${works[0].count}`)
    console.log(`监理日志数: ${logs[0].count}`)
    
  } catch (error) {
    console.error('✗ 测试数据初始化失败:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initTestData()
}

module.exports = initTestData

