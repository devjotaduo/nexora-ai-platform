# Nexora AI Platform Docker 部署指南

> 更新时间：2026-05-30

本文档说明如何使用 Docker 构建和部署 Nexora AI Platform。

## 1. 部署目标

- 开发机负责构建镜像
- 镜像包含前端构建产物和 Python 后端应用
- 服务器只需要 Docker，不需要 Node、Python、源码和构建环境
- 运行数据、密钥、备份通过 Docker volume 持久化
- PostgreSQL 作为业务数据存储
- 后续升级只需要拉取新镜像并重启容器

## 2. 镜像内容

镜像构建分两段：

**第一段：构建前端**

- Node 环境编译 `console` 目录
- 生成的控制台页面被复制到后端静态资源目录

**第二段：构建运行环境**

- 安装 Python、Chromium、Supervisor 等运行依赖
- 安装项目 Python 包
- 设置默认运行目录（`/app/working`、`/app/working.secret`、`/app/working.backups`）
- 启动时自动初始化配置
- 通过 `qwenpaw app --host 0.0.0.0 --port 8088` 提供 Web 服务

## 3. 本地构建镜像

在项目根目录执行：

```bash
bash scripts/docker_build.sh nexora-ai-platform:latest
```

也可以直接用 Compose 构建并启动：

```bash
docker compose up -d --build
```

启动后访问 http://127.0.0.1:8088

## 4. 容器管理

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f nexora

# 停止服务（不删除数据卷）
docker compose down
```

## 5. 发布镜像到 GitHub Container Registry

```bash
# 登录
echo <GitHub_Token> | docker login ghcr.io -u <username> --password-stdin

# 构建
bash scripts/docker_build.sh ghcr.io/<org>/nexora-ai-platform:latest

# 推送
docker push ghcr.io/<org>/nexora-ai-platform:latest

# 推送版本号标签（推荐）
docker tag ghcr.io/<org>/nexora-ai-platform:latest ghcr.io/<org>/nexora-ai-platform:v0.1.0
docker push ghcr.io/<org>/nexora-ai-platform:v0.1.0
```

## 6. 服务器免源码部署

服务器只需要安装 Docker 和 Docker Compose 插件。

### 6.1 安装 Docker（Ubuntu / Debian）

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 6.2 准备部署目录

```bash
sudo mkdir -p /opt/nexora
sudo chown -R $USER:$USER /opt/nexora
cd /opt/nexora
```

### 6.3 创建 Compose 文件

在 `/opt/nexora/docker-compose.yml` 中：

```yaml
volumes:
  nexora-data:
    name: nexora-data
  nexora-secrets:
    name: nexora-secrets
  nexora-backups:
    name: nexora-backups
  nexora-pgdata:
    name: nexora-pgdata

services:
  postgres:
    image: postgres:16-alpine
    container_name: nexora-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: "${NEXORA_POSTGRES_USER:-nexora}"
      POSTGRES_PASSWORD: "${NEXORA_POSTGRES_PASSWORD}"
      POSTGRES_DB: "${NEXORA_POSTGRES_DB:-nexora}"
    volumes:
      - nexora-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nexora"]
      interval: 10s
      timeout: 5s
      retries: 5

  nexora:
    image: ghcr.io/<org>/nexora-ai-platform:latest
    container_name: nexora-ai-platform
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:8088:8088"
    environment:
      QWENPAW_AUTH_ENABLED: "true"
      QWENPAW_PORT: "8088"
      QWENPAW_WORKING_DIR: "/app/working"
      QWENPAW_SECRET_DIR: "/app/working.secret"
      QWENPAW_BACKUP_DIR: "/app/working.backups"
      QWENPAW_OPENAPI_DOCS: "false"
      NEXORA_DB_URL: "postgresql+psycopg2://${NEXORA_POSTGRES_USER:-nexora}:${NEXORA_POSTGRES_PASSWORD}@postgres:5432/${NEXORA_POSTGRES_DB:-nexora}"
    volumes:
      - nexora-data:/app/working
      - nexora-secrets:/app/working.secret
      - nexora-backups:/app/working.backups
    deploy:
      resources:
        limits:
          cpus: "${NEXORA_APP_CPUS:-2.0}"
          memory: "${NEXORA_APP_MEMORY_LIMIT:-4g}"
```

### 6.4 启动服务

```bash
cd /opt/nexora
export NEXORA_POSTGRES_PASSWORD='<strong-password>'
docker compose pull
docker compose up -d
```

验证：

```bash
docker compose ps
curl http://127.0.0.1:8088
```

## 7. 绑定公网访问

### 7.1 Nginx + HTTPS（推荐）

```bash
sudo apt install -y nginx
```

站点配置：

```nginx
server {
    listen 80;
    server_name ai.example.com;
    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

申请 HTTPS：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ai.example.com
```

### 7.2 Cloudflare Tunnel（临时方式）

```bash
cloudflared tunnel --url http://127.0.0.1:8088
```

临时地址适合测试，不建议长期生产使用。

## 8. 升级流程

开发机：

```bash
bash scripts/docker_build.sh ghcr.io/<org>/nexora-ai-platform:latest
docker push ghcr.io/<org>/nexora-ai-platform:latest
```

服务器：

```bash
cd /opt/nexora
docker compose pull
docker compose up -d
docker image prune -f
```

数据卷不会因为升级镜像而丢失。

## 9. 回滚流程

使用版本号镜像回滚：

```yaml
image: ghcr.io/<org>/nexora-ai-platform:v0.1.0
```

```bash
docker compose pull
docker compose up -d
```

## 10. 备份数据

```bash
mkdir -p /opt/nexora-backup

# 备份应用数据
docker run --rm -v nexora-data:/data -v /opt/nexora-backup:/backup \
  busybox tar czf /backup/nexora-data.tar.gz -C /data .

# 备份密钥
docker run --rm -v nexora-secrets:/data -v /opt/nexora-backup:/backup \
  busybox tar czf /backup/nexora-secrets.tar.gz -C /data .

# 备份 PostgreSQL
docker compose exec postgres pg_dump -U nexora nexora > /opt/nexora-backup/nexora-db.sql
```

`nexora-secrets` 包含密钥和敏感配置，备份文件必须妥善保管。

## 11. 数据库管理

### 首次启动

应用启动时会自动创建所需的表结构。

### 数据迁移

如需从文件存储迁移到 PostgreSQL：

```bash
docker compose exec nexora alembic upgrade head
docker compose exec nexora \
  python /app/scripts/nexora_migrate_files_to_postgres.py \
  --secret-dir /app/working.secret
```

### 外部 PostgreSQL

如果使用外部 PostgreSQL，不使用 Compose 内置 postgres 服务，需要：

- 为应用容器提供 `NEXORA_DB_URL` 环境变量
- 确保网络可达
- 手动执行 `alembic upgrade head` 初始化表结构

## 12. 运行容量建议

| 参数 | 环境变量 | 建议值 |
|------|---------|--------|
| 应用 CPU | `NEXORA_APP_CPUS` | 2.0 |
| 应用内存 | `NEXORA_APP_MEMORY_LIMIT` | 4g |
| PG CPU | `NEXORA_POSTGRES_CPUS` | 1.0 |
| PG 内存 | `NEXORA_POSTGRES_MEMORY_LIMIT` | 1g |
| 最大活跃智能体 | `NEXORA_MAX_ACTIVE_AGENTS` | 20 |
| 空闲回收时间 | `NEXORA_AGENT_IDLE_TTL_SECONDS` | 3600 |

100 用户 / 100 智能体场景建议先保持最多 20 个活跃智能体、1 小时空闲回收。根据实际负载逐步调整。

## 13. 生产环境安全建议

- 不要直接暴露容器端口到 `0.0.0.0`，通过 Nginx 或网关暴露
- 保持 `QWENPAW_AUTH_ENABLED=true`
- 使用强密码，不使用默认密码
- 定期备份数据卷和 PostgreSQL
- 镜像发布使用版本号，不依赖 `latest`
- 公网访问必须配置 HTTPS
- 关闭 Swagger 文档（`QWENPAW_OPENAPI_DOCS=false`）

## 14. 常见问题

### 容器启动后访问不到

```bash
docker compose ps
docker compose logs -f nexora
```

如果 Compose 配置为 `127.0.0.1:8088:8088`，外部无法直接访问服务器 IP，需通过 Nginx 或改为 `0.0.0.0:8088:8088`。

### 登录失败

查看日志确认认证状态，检查数据卷是否沿用旧环境配置。必要时先备份再重置。

### 更新后页面仍是旧版本

```bash
docker compose pull
docker compose up -d --force-recreate
```

然后浏览器强制刷新（Ctrl+Shift+R）。

### 镜像拉取失败

检查 GHCR 包是否公开（或服务器已 `docker login ghcr.io`），以及服务器网络是否能访问 `ghcr.io`。
