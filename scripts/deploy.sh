#!/bin/bash
# 云托管部署脚本
# 使用方法: bash scripts/deploy.sh

set -e  # 遇到错误立即退出

echo "============================================"
echo "  CloudBase 云托管部署"
echo "============================================"
echo ""

# 检查是否安装了cloudbase CLI
if ! command -v cloudbase &> /dev/null; then
    echo "❌ 未检测到 cloudbase CLI，正在安装..."
    npm install -g @cloudbase/cli
    echo "✅ cloudbase CLI 安装完成"
fi

# 检查是否已登录
echo "📋 检查登录状态..."
if ! cloudbase env:list &> /dev/null; then
    echo "❌ 未登录，请先登录..."
    cloudbase login
fi

# 显示环境信息
echo ""
echo "📦 环境信息:"
cloudbase env:list

# 确认部署
echo ""
echo "⚠️  即将部署到环境: cloud1-5gtce4ym5a28e1b9"
echo "服务名称: supervision-log-api"
echo ""
read -p "确认部署? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消部署"
    exit 1
fi

# 运行测试
echo ""
echo "🧪 运行测试..."
if npm run test-api; then
    echo "✅ 测试通过"
else
    echo "❌ 测试失败，是否继续部署?"
    read -p "继续? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 开始部署
echo ""
echo "🚀 开始部署..."
cloudbase framework:deploy

echo ""
echo "============================================"
echo "  ✅ 部署完成！"
echo "============================================"
echo ""
echo "📌 后续步骤:"
echo "1. 访问云托管控制台查看服务状态"
echo "2. 配置环境变量（数据库、微信等）"
echo "3. 测试健康检查接口: /health"
echo "4. 在小程序后台配置服务器域名"
echo ""
echo "📚 详细说明请查看: DEPLOY.md"

