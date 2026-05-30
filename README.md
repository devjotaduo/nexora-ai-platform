<div align="center">

# Nexora AI Platform

**Enterprise AI Workspace**

[![License](https://img.shields.io/badge/license-Apache%202.0-red.svg?logo=apache)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%20~%20%3C3.14-blue.svg?logo=python)](https://www.python.org/downloads/)
[![Built on QwenPaw](https://img.shields.io/badge/built%20on-QwenPaw-orange.svg)](https://github.com/agentscope-ai/QwenPaw)

[English](#overview) | [中文](#概述)

</div>

---

## Overview

Nexora AI Platform is an enterprise-grade AI workspace built on [QwenPaw](https://github.com/agentscope-ai/QwenPaw). It inherits all the core capabilities of QwenPaw — multi-agent orchestration, multi-channel messaging, skill extensions, local model support, and memory-evolving agents — while adding enterprise-essential layers: multi-tenant access control, security governance, audit logging, and token usage analytics.

> **What you can do with Nexora:**
>
> - **Team AI workspace** — Multiple users share one platform, each with their own agents and permissions
> - **Social media & productivity** — Daily hot post digests, email highlights, newsletter summaries pushed to DingTalk/Feishu/WeChat
> - **Creative & building** — Describe a goal, let agents auto-execute; full workflow from idea to prototype
> - **Research & learning** — Track tech & AI news, personal knowledge base search and reuse
> - **Desktop & files** — Organize and search local files, read & summarize documents
> - **Operations & governance** — Audit every AI action, control who can use which tools, track token spend per user

---

## Core Features

### AI Agent Capabilities (from QwenPaw)

| Feature | Description |
|---------|-------------|
| **Multi-Agent Collaboration** | Create multiple independent agents, each with their own role; enable inter-agent communication for complex tasks |
| **Skills Extension** | Built-in scheduling, PDF/Office processing, news digest, web search, and more; custom skills auto-loaded |
| **Memory-Evolving & Proactive** | Agents learn from interactions, reflect on experience, and proactively serve you — smarter the more you use |
| **Multi-Channel Messaging** | DingTalk, Feishu, WeChat, Discord, Telegram, Slack, QQ, and more — one platform, connect as needed |
| **Local Model Support** | Run LLMs entirely on your machine via llama.cpp, Ollama, or LM Studio — no API keys required |
| **Cloud LLM Providers** | DashScope (Qwen), OpenAI, Gemini, Claude, MiniMax, DeepSeek, and many more |
| **Coding Mode** | Built-in Web IDE with file tree, tabbed editor, inline diff review, and Git panel |
| **Plugin Ecosystem** | Extend with custom tools, skills, and MCP servers; official plugin marketplace |
| **Scheduled Tasks (Cron)** | Automate recurring tasks — daily briefings, periodic data checks, scheduled reports |
| **Context Management** | Intelligent context compression for long conversations |
| **Tool Guard** | Automatically intercepts dangerous shell commands (rm -rf, fork bombs, reverse shells) |
| **File Access Guard** | Restricts agent access to sensitive paths (~/.ssh, key files, system directories) |
| **Skill Security Scanning** | Detects risks like prompt injection, command injection, hardcoded keys before installing skills |

### Enterprise Extensions (Nexora)

| Feature | Description |
|---------|-------------|
| **Multi-Tenant RBAC** | Two-role model (admin / operator) with platform-level access control and user management |
| **Agent Authorization** | Fine-grained agent grants per user — control who can access which AI agents |
| **Capability Approval** | Risk-based approval workflow for sensitive tool invocations with configurable policies |
| **Audit Logging** | Full audit trail with PostgreSQL backend — auth, chat, tool use, config changes, admin actions |
| **Token Usage Analytics** | Track LLM token consumption by user, agent, model, and date with dashboard visualization |
| **Security Governance** | Resource policies, tool scanners, and centralized secret management |
| **PostgreSQL Backend** | All enterprise data (users, grants, audit, config, tokens) stored in PostgreSQL |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌───────────────────────┐  ┌─────────────────────────────┐ │
│  │   QwenPaw Console UI  │  │  Nexora Admin Dashboard     │ │
│  │  Chat / Agents / Cron │  │  Users / Grants / Audit     │ │
│  │  Skills / MCP / Coding│  │  Token Usage / Governance   │ │
│  └───────────────────────┘  └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Backend (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  QwenPaw     │  │   Nexora     │  │  Auth Middleware  │  │
│  │  Core Engine │  │  Extension   │  │  JWT + RBAC       │  │
│  │  Agents      │  │  RBAC/Audit  │  │  Route Guards     │  │
│  │  Providers   │  │  Governance  │  │                   │  │
│  │  Channels    │  │  Token Track │  │                   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL 16                             │
│    Users · Roles · Agent Grants · Audit Logs · Approvals    │
│    Runtime Config · Governance Policies · Token Usage        │
├─────────────────────────────────────────────────────────────┤
│                    Channels                                  │
│  Console · DingTalk · Feishu · WeChat · Discord · Telegram  │
│  Slack · QQ · iMessage · Email · ...                        │
└─────────────────────────────────────────────────────────────┘
```

**Extension isolation**: All Nexora-specific code lives in dedicated directories (`src/qwenpaw_ext/nexora/` and `console/src/nexora/`), keeping the upstream QwenPaw core clean for future syncs.

---

## Technical Design

> Full details in [Technical Solution](docs/technical-solution.md)

### Three-Layer Permission Model

Nexora enforces access control through three cascading layers — each request must pass all applicable checks before reaching the agent runtime:

```
Layer 1 — Platform Access          Layer 2 — Agent Authorization       Layer 3 — Capability Approval
┌──────────────────────┐           ┌──────────────────────┐           ┌──────────────────────┐
│  User authenticates  │           │  Check agent_grants  │           │  Evaluate approval   │
│  via JWT             │──pass──▶  │  for this user       │──pass──▶  │  policy for this     │
│                      │           │                      │           │  tool invocation     │
│  RBAC role checked   │           │  Only granted agents │           │  Low risk → execute  │
│  against route       │           │  are visible & usable│           │  High risk → queue   │
└──────────────────────┘           └──────────────────────┘           └──────────────────────┘
        │ fail                             │ fail                             │ pending
        ▼                                  ▼                                  ▼
   401 / 403                          403 Forbidden                    Approval Request
   + audit log                        + audit log                      → Admin reviews
                                                                       → Execute or reject
                                                                       + audit log
```

### Request Lifecycle

```
Browser ──▶ FastAPI ──▶ JWT Middleware ──▶ RBAC Guard ──▶ Agent Grant Check
                                                              │
                        ┌─────────────────────────────────────┘
                        ▼
               Approval Policy Check ──▶ QwenPaw Agent Runtime ──▶ LLM Provider
                        │                        │                       │
                        ▼                        ▼                       ▼
                  Approval Queue          Tool Execution          Token Recording
                        │                        │                       │
                        └────────────────────────┼───────────────────────┘
                                                 ▼
                                           PostgreSQL
                                    (audit · tokens · approvals)
```

### Token Usage Tracking

Token consumption is attributed to the **authenticated JWT user** (not the chat payload sender), using Python's `ContextVar` to propagate identity through the async call chain:

```
JWT Middleware                    Console Router                   Model Wrapper
─────────────                    ──────────────                   ─────────────
request.state.user = "alice"  →  set_current_actor("alice")   →  get_current_actor()
                                                                       │
                                                                       ▼
                                                              INSERT INTO nexora_token_usage
                                                              (actor="alice", model, tokens)
                                                              via background daemon thread
```

Records are aggregated by user, agent, model, and date — visualized in the Token Usage dashboard with trend charts and per-user breakdown tables.

### PostgreSQL Schema

All enterprise data is persisted in PostgreSQL with versioned migrations (Alembic):

| Table | Purpose |
|-------|---------|
| `nexora_users` | User accounts, password hashes, roles |
| `nexora_agent_grants` | User ↔ Agent authorization mapping |
| `nexora_audit_events` | Full audit trail (indexed by date, actor) |
| `nexora_approval_requests` | Capability approval queue and results |
| `nexora_capability_policies` | Risk-based approval policy configuration |
| `nexora_governance` | Agent ↔ Tool/MCP/Skill resource policies |
| `nexora_token_usage` | LLM token consumption records |
| `nexora_runtime_config` | Runtime configuration key-value store |

---

## Quick Start

### Prerequisites

- Python 3.10 ~ 3.13
- Node.js 18+
- PostgreSQL 16 (or use the bundled Docker Compose)

### 1. Clone and install

```bash
git clone https://github.com/your-org/nexora-ai-platform.git
cd nexora-ai-platform
pip install -e .
cd console && npm install && npm run build && cd ..
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 3. Configure environment

```bash
# Database connection
export NEXORA_DB_URL="postgresql+psycopg2://nexora:changeme@127.0.0.1:5432/nexora"

# LLM API key (example for DashScope/Qwen)
export DASHSCOPE_API_KEY="your-api-key"
```

### 4. Run

```bash
bash start-qwenpaw-zh.sh
```

Open http://127.0.0.1:8088 in your browser. Go to **Settings > Models** to configure your LLM provider and start chatting.

### Docker (one-command deploy)

```bash
docker compose up -d
```

See [Docker Deployment Guide](docs/docker-deployment-guide.md) for details.

---

## LLM Configuration

Nexora supports both cloud and local LLM providers:

### Cloud Providers

Configure via **Settings > Models** in the web UI, or set environment variables:

| Provider | Env Variable | Notes |
|----------|-------------|-------|
| DashScope (Qwen) | `DASHSCOPE_API_KEY` | Recommended for Chinese users |
| OpenAI | `OPENAI_API_KEY` | GPT-4o, GPT-4, etc. |
| Google Gemini | `GOOGLE_API_KEY` | Gemini Pro, etc. |
| Anthropic | `ANTHROPIC_API_KEY` | Claude series |
| DeepSeek | `DEEPSEEK_API_KEY` | DeepSeek series |
| MiniMax | via Settings UI | MiniMax models |

### Local Models (no API key needed)

| Backend | Best for | Setup |
|---------|----------|-------|
| **llama.cpp** | Cross-platform | Click "Download" in the web UI |
| **Ollama** | Easy model management | Install Ollama app, then configure in Settings |
| **LM Studio** | GUI-based | Install LM Studio, start server, configure in Settings |

---

## Multi-Channel Messaging

Connect your agents to the platforms your team already uses:

| Channel | Status | Auth Method |
|---------|--------|-------------|
| Console (Web UI) | Built-in | JWT |
| DingTalk | Supported | Bot Token |
| Feishu (Lark) | Supported | App Credentials |
| WeChat (Enterprise) | Supported | Webhook |
| Discord | Supported | Bot Token |
| Telegram | Supported | Bot Token |
| Slack | Supported | OAuth |
| QQ | Supported | Bot API |
| Email | Supported | IMAP/SMTP |

See [Channel Documentation](https://qwenpaw.agentscope.io/docs/channels) for setup guides.

---

## Project Structure

```
src/
├── qwenpaw/                     # QwenPaw core engine
│   ├── app/                     # FastAPI app, routers, middleware, auth
│   ├── agents/                  # Agent runtime, memory, proactive behavior
│   ├── providers/               # LLM provider adapters (OpenAI, DashScope, etc.)
│   ├── token_usage/             # Token consumption tracking (model wrapper)
│   ├── security/                # Tool guard, file guard, skill scanner
│   ├── plugins/                 # Plugin system runtime
│   ├── config/                  # Configuration management
│   └── cli/                     # Command-line interface
└── qwenpaw_ext/
    └── nexora/                  # Nexora enterprise extension layer
        ├── rbac.py              # Role-based access control
        ├── audit.py             # Audit event logging
        ├── agent_grants.py      # Per-user agent authorization
        ├── capability_approval.py # Tool capability approval workflow
        ├── governance.py        # Resource governance policies
        ├── authorization.py     # Authorization engine
        ├── db.py                # PostgreSQL schema & connection
        └── repositories/       # Data access layer

console/src/
├── nexora/                      # Nexora frontend extensions
│   ├── pages/                   # Admin pages (users, grants, audit, governance)
│   └── api/                     # Nexora API clients
├── pages/                       # Core pages (Chat, Settings, Login, Agent, Inbox)
│   └── Settings/TokenUsage/     # Token consumption dashboard
├── components/                  # Shared UI components
└── layouts/                     # App layout (sidebar, header)

tests/
├── unit/                        # Unit tests (including nexora modules)
├── integration/                 # Integration tests
├── contract/                    # Contract tests (API, security)
├── e2e/                         # End-to-end tests
└── load/                        # Load testing (Locust)

docs/                            # Documentation
plugins/                         # Plugin bundles and tools
deploy/                          # Docker deployment configs
```

---

## Security

Nexora combines QwenPaw's built-in security with enterprise governance:

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **Authentication** | JWT + Password | Login required, token-based session management |
| **Authorization** | RBAC | Admin / Operator roles with route-level guards |
| **Agent Access** | Agent Grants | Users can only access explicitly authorized agents |
| **Tool Safety** | Tool Guard | Blocks dangerous commands (rm -rf, fork bombs, etc.) |
| **File Safety** | File Access Guard | Restricts access to sensitive system paths |
| **Skill Safety** | Security Scanner | Scans for injection, hardcoded keys, data exfiltration |
| **Capability Control** | Approval Workflow | Sensitive tool calls require admin approval |
| **Audit** | Full Logging | Every action logged to PostgreSQL with actor, timestamp, detail |
| **Data** | Local Deployment | All data stays on your infrastructure |

---

## Syncing Upstream

Nexora maintains two Git remotes to stay current with QwenPaw improvements:

```bash
# Add upstream (first time only)
git remote add upstream https://github.com/agentscope-ai/QwenPaw.git

# Sync upstream updates
git fetch upstream
git checkout -b sync/upstream-YYYYMMDD
git merge upstream/main
# Resolve conflicts, test, merge to main
```

Post-merge checklist:
- Login / logout works
- Chat functions normally
- Agent and user management pages load
- Frontend builds successfully
- Backend starts without errors

---

## Documentation

| Topic | Link |
|-------|------|
| Technical Solution | [docs/technical-solution.md](docs/technical-solution.md) |
| Docker Deployment | [docs/docker-deployment-guide.md](docs/docker-deployment-guide.md) |
| Engineering Governance | [docs/company-grade-engineering-governance.md](docs/company-grade-engineering-governance.md) |
| QwenPaw Core Docs | [qwenpaw.agentscope.io](https://qwenpaw.agentscope.io/) |
| Models Configuration | [QwenPaw Models Guide](https://qwenpaw.agentscope.io/docs/models) |
| Channel Setup | [QwenPaw Channels Guide](https://qwenpaw.agentscope.io/docs/channels) |
| Skills & Plugins | [QwenPaw Skills Guide](https://qwenpaw.agentscope.io/docs/skills) |
| Security | [QwenPaw Security Guide](https://qwenpaw.agentscope.io/docs/security) |

---

## License

This project is licensed under [Apache 2.0](LICENSE), same as the upstream QwenPaw project.

## Acknowledgements

Built on [QwenPaw](https://github.com/agentscope-ai/QwenPaw) by [AgentScope AI](https://github.com/agentscope-ai).

---

<div align="center">

# Nexora AI Platform

**企业级 AI 工作台**

</div>

---

## 概述

Nexora AI Platform 是基于 [QwenPaw](https://github.com/agentscope-ai/QwenPaw) 构建的企业级 AI 工作台。完整继承了 QwenPaw 的所有核心能力 — 多智能体协作、多渠道消息接入、技能扩展、本地模型支持、记忆进化 — 并在此基础上增加了企业必需的多租户权限控制、安全治理、审计日志和 Token 消耗分析。

> **你可以用 Nexora 做什么：**
>
> - **团队 AI 工作台** — 多用户共享平台，每个人拥有独立的智能体和权限
> - **资讯与效率** — 每日热帖摘要、邮件要点、新闻简报，推送到钉钉/飞书/企业微信
> - **创意与构建** — 描述目标，让智能体自动执行，醒来即可看到原型
> - **研究与学习** — 追踪科技和 AI 动态，个人知识库搜索复用
> - **文件与桌面** — 整理搜索本地文件，阅读并总结文档
> - **运维与治理** — 审计每一次 AI 操作，控制谁能使用哪些工具，按用户追踪 Token 消耗

---

## 功能特性

### AI 智能体能力（继承自 QwenPaw）

| 功能 | 说明 |
|------|------|
| **多智能体协作** | 创建多个独立智能体，各有角色分工，支持跨智能体通信协作 |
| **技能扩展** | 内置定时任务、PDF/Office 处理、新闻摘要、网页搜索等；自定义技能自动加载 |
| **记忆进化与主动服务** | 智能体从交互中学习，反思经验，主动服务 — 越用越聪明 |
| **多渠道消息接入** | 钉钉、飞书、微信、Discord、Telegram、Slack、QQ 等 — 一个平台，按需接入 |
| **本地模型支持** | 通过 llama.cpp、Ollama、LM Studio 在本机运行 LLM，无需 API 密钥 |
| **云端模型支持** | 通义千问、OpenAI、Gemini、Claude、MiniMax、DeepSeek 等主流供应商 |
| **Coding 模式** | 内置 Web IDE，含文件树、标签编辑器、行内 diff 审查和 Git 面板 |
| **插件生态** | 自定义工具、技能和 MCP 服务器扩展；官方插件市场 |
| **定时任务 (Cron)** | 自动化重复任务 — 每日简报、定期数据检查、定时报告 |
| **安全防护** | 工具守卫（拦截危险命令）、文件访问控制、技能安全扫描 |

### 企业扩展能力（Nexora）

| 功能 | 说明 |
|------|------|
| **多租户 RBAC** | 管理员 / 操作员双角色模型，平台级访问控制和用户管理 |
| **智能体授权** | 按用户精细分配智能体访问权限，控制谁可以使用哪个智能体 |
| **能力审批** | 基于风险等级的敏感工具调用审批流程，可配置策略 |
| **审计日志** | PostgreSQL 存储的全链路审计 — 认证、对话、工具调用、配置变更、管理操作 |
| **Token 消耗分析** | 按用户、智能体、模型、日期维度追踪 LLM Token 消耗，可视化仪表盘 |
| **安全治理** | 资源策略、工具扫描器、集中化密钥管理 |
| **PostgreSQL 后端** | 全部企业数据（用户、授权、审计、配置、Token）存储在 PostgreSQL |

---

## 技术设计

> 完整文档见 [技术方案](docs/technical-solution.md)

### 三层权限模型

Nexora 通过三层级联访问控制保护平台资源 — 每个请求必须逐层通过所有检查：

```
第一层 — 平台访问                第二层 — 智能体授权              第三层 — 能力审批
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│ 用户 JWT 认证    │            │ 检查 agent_grants│            │ 评估审批策略     │
│                  │──通过──▶   │ 是否授权该智能体 │──通过──▶   │                  │
│ RBAC 角色校验    │            │                  │            │ 低风险 → 直接执行│
│ 路由级权限守卫   │            │ 仅展示已授权智能体│            │ 高风险 → 进入审批│
└──────────────────┘            └──────────────────┘            └──────────────────┘
       │ 拒绝                          │ 拒绝                          │ 待审批
       ▼                               ▼                               ▼
   401 / 403                      403 禁止访问                    审批请求 → 管理员审批
   + 审计日志                     + 审计日志                      → 通过或拒绝 + 审计日志
```

### Token 消耗追踪

Token 消耗归属到 **JWT 认证用户**（而非聊天负载中的 sender_id），通过 Python `ContextVar` 在异步调用链中传递身份：

```
JWT 中间件                      Console 路由                     模型包装器
──────────                      ──────────                       ──────────
request.state.user = "alice" → set_current_actor("alice")  →  get_current_actor()
                                                                      │
                                                                      ▼
                                                             INSERT INTO nexora_token_usage
                                                             (actor="alice", model, tokens)
                                                             后台守护线程写入，不阻塞请求
```

按用户、智能体、模型、日期四维聚合，在 Token 消耗仪表盘中可视化展示趋势图和用户明细表。

### PostgreSQL 数据表

全部企业数据通过 Alembic 版本化迁移持久化在 PostgreSQL：

| 表名 | 用途 |
|------|------|
| `nexora_users` | 用户账号、密码哈希、角色 |
| `nexora_agent_grants` | 用户 ↔ 智能体授权映射 |
| `nexora_audit_events` | 全链路审计日志（按日期、用户索引） |
| `nexora_approval_requests` | 能力审批队列与结果 |
| `nexora_capability_policies` | 基于风险的审批策略配置 |
| `nexora_governance` | 智能体 ↔ 工具/MCP/Skill 资源策略 |
| `nexora_token_usage` | LLM Token 消耗记录 |
| `nexora_runtime_config` | 运行时配置键值存储 |

---

## 快速开始

### 环境要求

- Python 3.10 ~ 3.13
- Node.js 18+
- PostgreSQL 16（或使用项目自带的 Docker Compose）

### 安装并运行

```bash
git clone https://github.com/your-org/nexora-ai-platform.git
cd nexora-ai-platform
pip install -e .
cd console && npm install && npm run build && cd ..
docker compose up -d postgres
export NEXORA_DB_URL="postgresql+psycopg2://nexora:changeme@127.0.0.1:5432/nexora"
bash start-qwenpaw-zh.sh
```

浏览器打开 http://127.0.0.1:8088，进入 **设置 > 模型** 配置你的 LLM 供应商，即可开始对话。

### Docker 一键部署

```bash
docker compose up -d
```

详见 [Docker 部署指南](docs/docker-deployment-guide.md)。

---

## 模型配置

### 云端模型

通过 Web 界面 **设置 > 模型** 配置，或设置环境变量：

| 供应商 | 环境变量 | 说明 |
|--------|---------|------|
| 通义千问 (DashScope) | `DASHSCOPE_API_KEY` | 推荐国内用户使用 |
| OpenAI | `OPENAI_API_KEY` | GPT-4o、GPT-4 等 |
| DeepSeek | `DEEPSEEK_API_KEY` | DeepSeek 系列 |
| Google Gemini | `GOOGLE_API_KEY` | Gemini Pro 等 |
| Anthropic | `ANTHROPIC_API_KEY` | Claude 系列 |

### 本地模型（无需 API 密钥）

| 方式 | 适用场景 | 配置 |
|------|---------|------|
| **llama.cpp** | 跨平台 | 在 Web 界面点击"下载" |
| **Ollama** | 模型管理便捷 | 安装 Ollama 应用后在设置中配置 |
| **LM Studio** | 图形界面 | 安装 LM Studio 后启动服务器并配置 |

---

## 多渠道接入

将智能体连接到团队已在使用的平台：

| 渠道 | 状态 | 认证方式 |
|------|------|---------|
| 控制台 (Web UI) | 内置 | JWT |
| 钉钉 | 支持 | Bot Token |
| 飞书 | 支持 | App 凭证 |
| 企业微信 | 支持 | Webhook |
| Discord | 支持 | Bot Token |
| Telegram | 支持 | Bot Token |
| Slack | 支持 | OAuth |
| QQ | 支持 | Bot API |
| 邮箱 | 支持 | IMAP/SMTP |

详见 [渠道配置文档](https://qwenpaw.agentscope.io/docs/channels)。

---

## 安全体系

| 层级 | 机制 | 说明 |
|------|------|------|
| **认证** | JWT + 密码 | 登录认证，基于 Token 的会话管理 |
| **授权** | RBAC | 管理员/操作员角色，路由级权限守卫 |
| **智能体访问** | 智能体授权 | 用户只能访问被明确授权的智能体 |
| **工具安全** | 工具守卫 | 拦截危险命令（rm -rf、fork 炸弹等） |
| **文件安全** | 文件访问控制 | 限制访问敏感系统路径 |
| **技能安全** | 安全扫描器 | 安装前检测注入、硬编码密钥、数据泄露 |
| **能力管控** | 审批流程 | 敏感工具调用需管理员审批 |
| **审计** | 全链路日志 | 每个操作记录到 PostgreSQL，含操作者、时间、详情 |
| **数据** | 本地部署 | 所有数据存储在你自己的基础设施上 |

---

## 文档

| 主题 | 链接 |
|------|------|
| 技术方案 | [docs/technical-solution.md](docs/technical-solution.md) |
| Docker 部署 | [docs/docker-deployment-guide.md](docs/docker-deployment-guide.md) |
| 工程治理规范 | [docs/company-grade-engineering-governance.md](docs/company-grade-engineering-governance.md) |
| QwenPaw 核心文档 | [qwenpaw.agentscope.io](https://qwenpaw.agentscope.io/) |
| 模型配置 | [QwenPaw 模型指南](https://qwenpaw.agentscope.io/docs/models) |
| 渠道接入 | [QwenPaw 渠道指南](https://qwenpaw.agentscope.io/docs/channels) |
| 技能与插件 | [QwenPaw 技能指南](https://qwenpaw.agentscope.io/docs/skills) |

---

## 许可证

本项目采用 [Apache 2.0](LICENSE) 协议，与上游 QwenPaw 项目一致。

基于 [AgentScope AI](https://github.com/agentscope-ai) 团队的 [QwenPaw](https://github.com/agentscope-ai/QwenPaw) 构建。
