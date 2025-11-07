var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

// 加载环境变量
require('dotenv').config();

// 路由模块
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// API路由（已去掉v1前缀）
var apiRouter = require('./routes/api');

// 中间件
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 数据库连接测试
const { testConnection } = require('./config/database');

var app = express();

// 测试数据库连接
testConnection().catch(err => {
  console.error('数据库连接失败，请检查配置:', err.message);
});

// CORS跨域配置
app.use(cors({
  origin: '*', // 生产环境建议配置具体域名
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 页面路由
app.use('/', indexRouter);
app.use('/users', usersRouter);

// API路由（监理日志小程序）
app.use('/api', apiRouter);

// 健康检查接口（用于云托管健康检测）
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    service: 'express-miniapp'
  });
});


// 404错误处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

module.exports = app;
