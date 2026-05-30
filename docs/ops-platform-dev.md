# QwenPaw 智能运维平台二开备忘

## 当前状态

- 源码目录：`/Users/leo/Documents/qwenpaw-src`
- Web 控制台：`http://127.0.0.1:8088`
- 本地工作目录：`/Users/leo/.qwenpaw`
- 当前默认界面语言：中文

## 启动

```bash
cd /Users/leo/Documents/qwenpaw-src
./start-qwenpaw-zh.sh
```

如需换端口：

```bash
QWENPAW_PORT=8090 ./start-qwenpaw-zh.sh
```

启动脚本会清理当前 shell 里的代理环境变量，避免 OpenAI SDK 在未安装
`socksio` 时因为 SOCKS 代理变量无法初始化。

## 模型配置

- Provider：`minimax-coding-plan`
- Base URL：`https://api.minimaxi.com/v1`
- Model：`MiniMax-M2.7`
- 说明：当前 key 属于 MiniMax 国内端点；国际端点
  `https://api.minimax.io/v1` 会返回 `401 invalid api key (2049)`。

## 已做的中文化改动

- `console/src/i18n.ts`：前端首次打开时默认语言从 `en` 改为 `zh`。
- `src/qwenpaw/app/routers/settings.py`：后端全局语言默认值从 `en` 改为 `zh`。
- 已重新构建前端，并复制到 `src/qwenpaw/console/` 给后端直接托管。

## 二开方向

运维平台建议先沿用 QwenPaw 的三层扩展点：

1. Skill：封装单个运维能力，例如巡检、日志查询、发布检查、K8s 诊断。
2. MCP：对接已有平台和内部工具，例如 CMDB、监控、工单、CI/CD、云资源 API。
3. Agent：按职责拆分角色，例如值班助手、发布助手、故障分析助手、知识库问答助手。

推荐第一阶段先做一个最小闭环：

1. 配好模型供应商，让默认 Agent 可正常对话。
2. 新建一个 `运维助手` Agent，限制它只面向运维场景。
3. 接入一个只读类工具，例如日志查询或主机信息查询。
4. 给工具加审批和只读边界，再逐步开放执行类动作。

## 二开隔离目录

为了方便后续同步 QwenPaw 上游更新，Nexora AI 自有代码尽量放在独立目录：

- 后端：`src/qwenpaw_ext/nexora/`
- 前端：`console/src/nexora/`

原项目文件只承担少量挂载职责，例如注册接口、注册路由、注册菜单和接入权限中间件。新增用户权限、运维工具、审批、审计、MCP/Skill 接入时，默认优先放到上述扩展目录。

## 注意

如遇到端口被占用，可以临时通过 `QWENPAW_PORT=8090 ./start-qwenpaw-zh.sh` 换端口启动。
