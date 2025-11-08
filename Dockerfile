# 使用官方 Node.js 镜像，选择 Alpine 版本以减小镜像大小
# 推荐阅读：https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/scene/build/speed.html
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 配置环境变量
ENV NODE_ENV=production
ENV PORT=80

# 安装系统依赖和时区设置
RUN apk add --no-cache \
    tzdata \
    ca-certificates \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata

# 拷贝 package 文件
COPY package*.json ./

# 配置 npm 镜像源并安装依赖
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/ \
    && npm install --production --no-audit --no-fund \
    && npm cache clean --force

# 拷贝应用代码
COPY . .

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "bin/www"]
