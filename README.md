<div align="center">

# Nexora AI Platform

**Enterprise AI Workspace**

[![License](https://img.shields.io/badge/license-Apache%202.0-red.svg?logo=apache)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%20~%20%3C3.14-blue.svg?logo=python)](https://www.python.org/downloads/)
[![Built on QwenPaw](https://img.shields.io/badge/built%20on-QwenPaw-orange.svg)](https://github.com/agentscope-ai/QwenPaw)

[English](#features) | [中文](#功能特性)

</div>

---

Nexora AI Platform is an enterprise-grade AI workspace built on [QwenPaw](https://github.com/agentscope-ai/QwenPaw). It extends the open-source foundation with multi-tenant access control, security governance, audit logging, and token usage analytics — designed for teams that need production-ready AI agent management.

## Features

- **Multi-Tenant RBAC** — Two-role model (admin / operator) with platform-level access control
- **Agent Authorization** — Fine-grained agent grants per user, controlling who can access which AI agents
- **Capability Approval** — Risk-based approval workflow for sensitive tool invocations
- **Audit Logging** — Full audit trail with PostgreSQL backend, covering auth, chat, tool use, and admin actions
- **Token Usage Analytics** — Track LLM token consumption by user, agent, model, and date with dashboard visualization
- **Security Governance** — Resource policies, tool scanners, and secret management
- **Multi-Channel Support** — Console, DingTalk, Slack, Discord, WeChat, and more
- **Plugin Ecosystem** — Extend with custom tools, skills, and MCP servers

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Frontend (React)                │
│         Console UI / Admin Dashboard            │
├─────────────────────────────────────────────────┤
│              Backend (FastAPI)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ QwenPaw  │  │ Nexora   │  │ Auth / RBAC   │ │
│  │  Core    │  │Extension │  │  Middleware    │ │
│  └──────────┘  └──────────┘  └───────────────┘ │
├─────────────────────────────────────────────────┤
│              PostgreSQL 16                      │
│   Users · Grants · Audit · Config · Tokens     │
└─────────────────────────────────────────────────┘
```

**Extension isolation**: All Nexora-specific code lives in dedicated directories (`src/qwenpaw_ext/nexora/` and `console/src/nexora/`), keeping the upstream QwenPaw core clean for future syncs.

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
export NEXORA_DB_URL="postgresql+psycopg2://nexora:changeme@127.0.0.1:5432/nexora"
```

### 4. Run

```bash
bash start-qwenpaw-zh.sh
```

Open http://127.0.0.1:8088 in your browser.

### Docker (one-command deploy)

```bash
docker compose up -d
```

See [Docker Deployment Guide](docs/docker-deployment-guide.md) for details.

## Project Structure

```
src/
├── qwenpaw/                 # Upstream QwenPaw core
│   ├── app/                 # FastAPI app, routers, middleware
│   ├── agents/              # Agent runtime
│   ├── providers/           # LLM provider adapters
│   ├── token_usage/         # Token consumption tracking
│   └── security/            # Security modules
└── qwenpaw_ext/
    └── nexora/              # Nexora extension layer
        ├── rbac.py          # Role-based access control
        ├── audit.py         # Audit logging
        ├── agent_grants.py  # Agent authorization
        ├── governance.py    # Resource governance
        └── db.py            # PostgreSQL schema & engine

console/src/
├── nexora/                  # Nexora frontend extension
│   ├── pages/               # Admin pages (users, grants, audit)
│   └── api/                 # Nexora API clients
├── pages/                   # Core pages (chat, settings, login)
└── components/              # Shared UI components
```

## Syncing Upstream

Nexora maintains two remotes to stay current with QwenPaw:

```bash
git fetch upstream
git checkout -b sync/upstream-YYYYMMDD
git merge upstream/main
# Resolve conflicts, test, merge to main
```

## Documentation

- [Technical Solution](docs/technical-solution.md)
- [Docker Deployment](docs/docker-deployment-guide.md)
- [Engineering Governance](docs/company-grade-engineering-governance.md)
- [QwenPaw Docs](https://qwenpaw.agentscope.io/)

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

Nexora AI Platform 是基于 [QwenPaw](https://github.com/agentscope-ai/QwenPaw) 构建的企业级 AI 工作台。在开源基础上扩展了多租户权限控制、安全治理、审计日志和 Token 消耗分析等企业级能力，为需要生产级 AI 智能体管理的团队而设计。

## 功能特性

- **多租户 RBAC** — 管理员 / 操作员双角色模型，平台级访问控制
- **智能体授权** — 按用户精细分配智能体访问权限
- **能力审批** — 基于风险等级的敏感工具调用审批流程
- **审计日志** — PostgreSQL 存储的全链路审计，覆盖认证、对话、工具调用和管理操作
- **Token 消耗分析** — 按用户、智能体、模型、日期维度追踪 LLM Token 消耗，可视化仪表盘
- **安全治理** — 资源策略、工具扫描、密钥管理
- **多渠道接入** — 控制台、钉钉、Slack、Discord、企业微信等
- **插件生态** — 自定义工具、技能和 MCP 服务器扩展

## 快速开始

```bash
git clone https://github.com/your-org/nexora-ai-platform.git
cd nexora-ai-platform
pip install -e .
cd console && npm install && npm run build && cd ..
docker compose up -d postgres
bash start-qwenpaw-zh.sh
```

浏览器打开 http://127.0.0.1:8088 即可使用。

## 许可证

本项目采用 [Apache 2.0](LICENSE) 协议，与上游 QwenPaw 项目一致。
