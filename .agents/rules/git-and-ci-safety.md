---
trigger: always_on
alwaysApply: true
---

# Git 提交确认与 CI/CD 自动化保护规范 (Git & CI Safety)

本规范用于杜绝越权提交，并确保每次代码提交都不会破坏 GitHub Actions 自动化流程。

---

## 一、Git 提交前“人工双重确认”铁律

**AI Agent 绝对严禁私自执行 `git commit` 或 `git push`。**

在任何代码修改完成并准备提交前，必须在对话中向用户呈现以下结构化确认清单，等待用户明确确认回复（如“确认提交”、“可以 push”）后，方可执行：

### 必须向用户汇报的提交清单模板：
```markdown
### 📢 Git 提交确认请求

- **变更目的**：[简明扼要说明本次变更解决的问题]
- **变更文件清单**：
  - `[修改/新增/删除]` 相对路径文件 1
  - `[修改/新增/删除]` 相对路径文件 2
- **拟用 Commit Message**：`feat/fix: [标准化提交信息]`
- **自动化影响评估**：
  - 是否影响 GitHub Actions：[无影响 / 需同步注意事项]
  - 是否涉及依赖/配置变动：[无变动 / 已严格保持 lockfile 同步]

> 请确认是否批准提交并推送到远端仓库？
```

---

## 二、GitHub Actions 自动化安全防线 (针对 dailyBrief 及类似 CI)

当前项目严重依赖 GitHub Actions (`.github/workflows/daily.yml`) 每日自动拉取数据、执行 LLM 并推送至 GitHub Pages。提交前必须进行以下自动化兼容性自检：

### 1. `npm ci` 崩溃防御（最常见 CI 故障）
- CI 构建第一步是执行 `npm ci`。
- `npm ci` 要求 `package.json` 与 `package-lock.json` 100% 严格一致。
- **自检要求**：只要修改了 `package.json`，必须在本地运行并生成完全对应的 `package-lock.json` 并一同提交，严禁遗漏。

### 2. 运行时环境隔离与缺失防御
- GitHub Actions runner 默认为标准 `ubuntu-latest`（预装 Node.js 20）。
- 若新增代码依赖 Python、外部系统命令（如特定 curl 扩展或额外 CLI 工具）：
  - 必须在提交前评估：CI 环境是否原生支持？
  - 若不支持，必须在提交前征得用户同意，并在 `.github/workflows/daily.yml` 中同步增加对应的环境安装步骤（例如 `actions/setup-python`），否则 CI 会在自动运行时静默失败。

### 3. 密钥与敏感信息防泄漏
- **绝对禁止**将包含真实密钥的 `.env`、`.env.local` 提交到仓库。
- CI 流程所有 API 密钥均由 GitHub Secrets 注入，本地代码必须统一使用 `process.env.<KEY_NAME>` 读取。

### 4. 调度契约（Time Gate）保护
- 不要无故修改 `.github/workflows/daily.yml` 中的时区 (`REPORT_TZ`)、时间栅栏 (`gate` job) 及分支推送逻辑 (`gh-pages`)，以免破坏定时生成报告的核心业务。

---

## 三、仓库内容“断舍离”法则 (应该保留 vs 必须清除)

为保持 GitHub 仓库轻盈并防止破坏自动化：

| 分类 | 处理动作 | 具体文件与目录 |
| :--- | :--- | :--- |
| **必需保留与同步** | 必须提交 | 业务源代码、配置文件、依赖描述及锁文件 (`package.json`, `package-lock.json`, `sources.config.json`, `.github/workflows/`) |
| **测试与验证垃圾** | **坚决删除** | 临时测试脚本、一次性调试输出文件、冗余的本地验证草稿 |
| **环境与输出产物** | **严禁提交（gitignore）** | `node_modules/`, `.venv/`, `daily_reports/`, `logs/`, `.DS_Store` |
