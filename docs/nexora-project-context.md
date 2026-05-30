# Nexora AI Platform 项目上下文

> 更新时间：2026-05-30

本文档用于新开发者或新 AI 助手快速了解项目背景、架构和开发规范。

## 项目定位

基于开源项目 [QwenPaw](https://github.com/agentscope-ai/QwenPaw) 二次开发，目标是建设支持 100+ 用户和 100+ 智能体的企业级 AI 工作台。

### 设计规模

- **用户规模**：100+ 并发用户，admin / operator 双角色
- **智能体规模**：100+ 智能体，按需懒加载、空闲回收、LRU 淘汰
- **存储**：全部业务数据 PostgreSQL 持久化
- **权限**：三层模型（平台访问 → 智能体授权 → 能力审批）
- **审计**：全链路审计日志

## 架构概览

```text
前端 (React + Vite)
  ├── QwenPaw 原生页面（聊天、智能体、工具、设置等）
  └── Nexora 扩展页面（用户管理、授权、审计、治理）

后端 (FastAPI)
  ├── QwenPaw 核心（Agent Runtime、Channels、Providers）
  └── Nexora 扩展（RBAC、审计、授权、审批、Token 统计）

数据库 (PostgreSQL 16)
  └── 用户、授权、审计、审批、配置、Token 消耗
```

## 二开隔离约定

所有 Nexora 业务代码优先放在独立扩展目录：

- **后端扩展**：`src/qwenpaw_ext/nexora/`
- **前端扩展**：`console/src/nexora/`
- **扩展路由**：`src/qwenpaw/app/routers/nexora.py`
- **数据迁移**：`alembic/versions/`

原项目只在以下位置做少量修改：

- `src/qwenpaw/app/_app.py` — 路由注册
- `src/qwenpaw/app/auth.py` — 认证中间件
- `src/qwenpaw/app/routers/console.py` — 审计和用户追踪接入
- `src/qwenpaw/token_usage/model_wrapper.py` — Token 消耗 PG 写入

## 已完成功能

| 模块 | 功能 |
|------|------|
| 品牌 | 中文化、logo、页面标题替换 |
| 认证 | JWT 登录、Token 校验、退出登录 |
| RBAC | 用户管理、角色管理（admin / operator） |
| 智能体授权 | agent_grants 表、批量授权/撤销 |
| 能力审批 | 审批策略配置、审批队列、管理员审批 |
| 资源治理 | 智能体可用 Tool/MCP/Skill 配置 |
| 审计日志 | PostgreSQL 存储、分页查询、多条件过滤 |
| Token 统计 | 按用户/智能体/模型/日期统计、可视化仪表盘 |
| 数据库 | PostgreSQL 全量迁移、Alembic 版本管理 |
| Docker | Dockerfile、docker-compose、健康检查、资源限制 |
| 测试 | 单元测试 96 passed、100 用户压力测试通过 |

## 开发环境搭建

### 前置要求

- Python 3.10 ~ 3.13
- Node.js 18+
- PostgreSQL 16（推荐 Docker 容器运行）

### 启动步骤

```bash
# 1. 安装 Python 依赖
pip install -e ".[dev,full]"

# 2. 构建前端
cd console && npm install && npm run build && cd ..
cp -R console/dist/. src/qwenpaw/console/

# 3. 启动 PostgreSQL
docker compose up -d postgres

# 4. 配置环境变量
export NEXORA_DB_URL="postgresql+psycopg2://nexora:<password>@127.0.0.1:5432/nexora"

# 5. 启动服务
bash start-qwenpaw-zh.sh
```

访问 http://127.0.0.1:8088

### 运行测试

```bash
# 扩展模块单元测试
python -m pytest -q tests/unit/nexora

# 全部单元测试
python -m pytest -q tests/unit

# 压力测试（需先启动服务）
python -m locust -f tests/load/locustfile.py
```

## 前端开发

修改前端代码后需要重新构建并部署：

```bash
cd console && npm run build && cd ..
cp -R console/dist/. src/qwenpaw/console/
# 重启后端服务
```

## 上游同步

```bash
# 添加上游远端（首次）
git remote add upstream https://github.com/agentscope-ai/QwenPaw.git

# 同步
git fetch upstream
git checkout -b sync/upstream-YYYYMMDD
git merge upstream/main
# 解决冲突、测试、合入 main
```

同步后必须验证：登录、权限、聊天、智能体授权、审计、Token 统计、前端构建、后端启动。

## 关键注意事项

1. **所有数据存储走 PostgreSQL**，禁止 JSON 文件存储
2. **修改数据前必须备份**（密码、配置、权限）
3. **二开代码放扩展目录**，最小化修改上游文件
4. **每个接口必须有权限校验和审计记录**
5. **Token 消耗通过 ContextVar 追踪认证用户**，不用聊天负载中的 user_id

## 相关文档

- [技术方案](technical-solution.md)
- [Docker 部署](docker-deployment-guide.md)
- [工程治理规范](company-grade-engineering-governance.md)
- [QwenPaw 核心文档](https://qwenpaw.agentscope.io/)
