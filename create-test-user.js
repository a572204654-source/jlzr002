/**
 * 创建测试用户脚本
 * 连接云托管外网数据库，插入测试用户和测试数据
 */

const mysql = require('mysql2/promise')

// 云托管数据库配置（外网）
const dbConfig = {
  host: 'sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com',
  port: 22087,
  user: 'a572204654',
  password: '572204654aA',
  database: 'jlzr1101-5g9kplxza13a780d'
}

async function createTestUser() {
  let connection

  try {
    console.log('=================================================')
    console.log('          创建测试用户和测试数据')
    console.log('=================================================')
    console.log('连接数据库...')
    console.log('主机:', dbConfig.host)
    console.log('数据库:', dbConfig.database)

    // 连接数据库
    connection = await mysql.createConnection(dbConfig)
    console.log('✓ 数据库连接成功\n')

    // 1. 创建测试用户
    console.log('========== 步骤1: 创建测试用户 ==========')
    const testOpenid = 'test_openid_888888'
    
    // 检查用户是否已存在
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE openid = ?',
      [testOpenid]
    )

    let userId
    if (existingUsers.length > 0) {
      console.log('⚠ 测试用户已存在')
      userId = existingUsers[0].id
      console.log('用户ID:', userId)
      console.log('昵称:', existingUsers[0].nickname)
    } else {
      // 插入测试用户
      const [result] = await connection.execute(
        'INSERT INTO users (openid, nickname, avatar, organization) VALUES (?, ?, ?, ?)',
        [testOpenid, '测试用户888888', '', '测试组织']
      )
      userId = result.insertId
      console.log('✓ 测试用户创建成功')
      console.log('用户ID:', userId)
    }

    // 2. 创建测试项目
    console.log('\n========== 步骤2: 创建测试项目 ==========')
    const [existingProjects] = await connection.execute(
      'SELECT * FROM projects WHERE project_name = ?',
      ['测试项目-监理日志导出测试']
    )

    let projectId
    if (existingProjects.length > 0) {
      console.log('⚠ 测试项目已存在')
      projectId = existingProjects[0].id
      console.log('项目ID:', projectId)
    } else {
      const [result] = await connection.execute(
        'INSERT INTO projects (project_name, project_code, description, organization, chief_engineer, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['测试项目-监理日志导出测试', 'TEST-2024-001', '用于测试监理日志导出功能的项目', '测试监理机构', '李总监', userId]
      )
      projectId = result.insertId
      console.log('✓ 测试项目创建成功')
      console.log('项目ID:', projectId)
      console.log('项目编号: TEST-2024-001')
    }

    // 3. 创建测试工程
    console.log('\n========== 步骤3: 创建测试工程 ==========')
    const [existingWorks] = await connection.execute(
      'SELECT * FROM works WHERE work_name = ? AND project_id = ?',
      ['测试工程-主体结构', projectId]
    )

    let workId
    if (existingWorks.length > 0) {
      console.log('⚠ 测试工程已存在')
      workId = existingWorks[0].id
      console.log('工程ID:', workId)
    } else {
      const [result] = await connection.execute(
        'INSERT INTO works (project_id, work_name, work_code, description, unit_work, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
        [projectId, '测试工程-主体结构', 'WORK-001', '主体结构工程', '主体结构', userId]
      )
      workId = result.insertId
      console.log('✓ 测试工程创建成功')
      console.log('工程ID:', workId)
      console.log('工程编号: WORK-001')
    }

    // 4. 创建测试监理日志
    console.log('\n========== 步骤4: 创建测试监理日志 ==========')
    
    // 删除该工程的旧测试日志
    await connection.execute(
      'DELETE FROM supervision_logs WHERE work_id = ? AND user_id = ?',
      [workId, userId]
    )

    // 创建3条测试日志
    const testLogs = [
      {
        logDate: '2025-11-08',
        weather: '晴天，温度15-25℃，东北风3级',
        projectDynamics: '今日施工内容：\n1. 完成3层楼板混凝土浇筑，浇筑量约200m³\n2. 4层柱子钢筋绑扎完成60%\n3. 外墙保温材料进场验收合格\n\n施工人员：\n- 木工班组：15人\n- 钢筋工班组：12人\n- 混凝土班组：8人\n\n施工进度：按计划进度执行，无延误',
        supervisionWork: '监理工作记录：\n1. 上午巡视现场，检查3层楼板模板安装质量，符合要求\n2. 监督混凝土浇筑过程，检查坍落度180mm，符合设计要求\n3. 下午检查4层柱子钢筋绑扎质量，发现2处箍筋间距偏差，已要求整改\n4. 检查进场保温材料质量证明文件，齐全有效\n5. 召开监理例会，协调解决材料堆放问题',
        safetyWork: '安全监理情况：\n1. 检查施工现场安全防护措施，临边防护栏杆完好\n2. 检查施工人员安全帽佩戴情况，全员佩戴\n3. 检查脚手架搭设质量，发现1处剪刀撑缺失，已要求立即整改并整改完成\n4. 检查施工用电线路，电箱防护门完好\n5. 组织安全教育培训，15人参加\n6. 无安全事故发生',
        recorderName: '张监理',
        reviewerName: '李总监'
      },
      {
        logDate: '2025-11-07',
        weather: '多云，温度12-22℃，北风2级',
        projectDynamics: '今日施工内容：\n1. 3层楼板模板安装完成\n2. 3层楼板钢筋绑扎完成并验收\n3. 4层柱子模板安装完成80%\n4. 地下室防水施工完成\n\n施工人员：\n- 木工班组：15人\n- 钢筋工班组：10人\n- 防水班组：6人\n\n施工进度：整体进度正常',
        supervisionWork: '监理工作记录：\n1. 检查3层楼板钢筋绑扎质量，钢筋规格、间距、保护层厚度均符合设计要求\n2. 组织钢筋隐蔽工程验收，验收合格，同意浇筑混凝土\n3. 检查4层柱子模板安装质量，垂直度和平整度满足要求\n4. 检查地下室防水施工质量，基层处理到位，涂刷均匀\n5. 审批材料进场报验单3份',
        safetyWork: '安全监理情况：\n1. 全面检查施工现场安全生产情况\n2. 检查塔吊运行状况，运行正常\n3. 检查高处作业安全措施，安全网设置符合要求\n4. 检查消防器材配置情况，灭火器数量充足\n5. 督促整改安全隐患2处，已全部整改完成\n6. 无安全事故发生',
        recorderName: '张监理',
        reviewerName: '李总监'
      },
      {
        logDate: '2025-11-06',
        weather: '阴天，温度10-18℃，无风',
        projectDynamics: '今日施工内容：\n1. 3层柱子混凝土拆模并养护\n2. 3层楼板支撑体系搭设完成\n3. 3层楼板钢筋绑扎开始\n4. 外墙砌筑完成2层\n\n施工人员：\n- 木工班组：18人\n- 钢筋工班组：10人\n- 砌筑班组：8人\n\n施工进度：符合计划要求',
        supervisionWork: '监理工作记录：\n1. 检查3层柱子混凝土外观质量，无明显缺陷\n2. 检查楼板支撑体系搭设质量，立杆间距、扫地杆设置符合规范\n3. 旁站3层楼板钢筋绑扎，提醒施工单位注意钢筋保护层厚度\n4. 检查2层外墙砌筑质量，砂浆饱满度良好\n5. 审核施工技术交底记录',
        safetyWork: '安全监理情况：\n1. 检查施工现场安全标识标牌设置情况\n2. 检查施工电梯运行状况，安全装置有效\n3. 检查作业层临边防护，防护严密\n4. 检查施工机械设备，保养记录齐全\n5. 参加每日班前安全教育\n6. 无安全事故发生',
        recorderName: '张监理',
        reviewerName: '李总监'
      }
    ]

    console.log(`准备创建 ${testLogs.length} 条测试监理日志...`)
    let logCount = 0

    for (const log of testLogs) {
      const [result] = await connection.execute(
        `INSERT INTO supervision_logs 
          (project_id, work_id, user_id, log_date, weather, project_dynamics, 
           supervision_work, safety_work, recorder_name, reviewer_name) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectId, workId, userId, log.logDate, log.weather, log.projectDynamics,
         log.supervisionWork, log.safetyWork, log.recorderName, log.reviewerName]
      )
      logCount++
      console.log(`✓ 创建测试日志 ${logCount}/${testLogs.length} (ID: ${result.insertId}, 日期: ${log.logDate})`)
    }

    console.log(`\n✓ 成功创建 ${logCount} 条测试监理日志`)

    // 5. 总结
    console.log('\n=================================================')
    console.log('                 创建完成总结')
    console.log('=================================================')
    console.log('测试用户openid:', testOpenid)
    console.log('用户ID:', userId)
    console.log('项目ID:', projectId)
    console.log('项目名称: 测试项目-监理日志导出测试')
    console.log('工程ID:', workId)
    console.log('工程名称: 测试工程-主体结构')
    console.log('监理日志数量:', logCount)
    console.log('\n✅ 测试数据创建完成！')
    console.log('💡 现在可以运行测试脚本: node test-export-word.js')

  } catch (error) {
    console.error('\n❌ 创建失败:', error.message)
    console.error('错误详情:', error)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n数据库连接已关闭')
    }
  }
}

// 运行脚本
createTestUser().catch(error => {
  console.error('\n❌ 脚本执行失败:', error)
  process.exit(1)
})

