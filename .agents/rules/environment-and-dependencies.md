---
trigger: always_on
alwaysApply: true
---

# 环境与依赖管理规范 (Environment & Dependencies Management)

恪守“按需启用、零冗余、版本受控”原则，严禁过度工程化，确保本地开发环境与远程 CI 环境完全一致。

---

## 一、虚拟环境“按需使用”准则

对于“是否需要虚拟环境”，根据技术栈天然特性按需裁决，杜绝为了形式主义而增加环境复杂度：

| 技术栈类型 | 是否需要虚拟环境 | 处理方式与操作规范 |
| :--- | :--- | :--- |
| **Node.js / TypeScript**<br>*(当前 dailyBrief 主工程)* | **不需要** ❌ | • Node.js 依赖默认安装在项目根目录 `./node_modules`，具备天然的项目级隔离。<br>• **严禁**额外增加 Python venv、Conda 或复杂容器层，保持轻量 KISS。<br>• 依赖由 `package.json` 和 `package-lock.json` 声明管控。 |
| **Python 辅助工具/独立项目** | **必须强制使用** ✅ | • Python 默认会安装到系统/用户全局环境，极易污染系统并引起版本冲突。<br>• 必须使用项目本地虚拟环境：`python3 -m venv .venv`<br>• 执行脚本、安装包前必须先激活：`source .venv/bin/activate`<br>• **严禁**在系统全局或用户全局直接执行 `pip install`。 |
| **Go / Rust / 编译型语言** | **不需要** ❌ | • 直接使用官方内置的 `go.mod` 或 `Cargo.lock` 进行依赖管理与版本隔离。 |

---

## 二、依赖增删与 GitHub 仓库同步规范

若因开发需要引入新依赖包，必须完成“本地验证 + 依赖清单与锁文件同步”：

1. **依赖清单与 Lockfile 必须原子同步**：
   - **Node.js**：
     - 使用 `npm install <package>` 安装后，必须同时提交 `package.json` 和 `package-lock.json`。
     - **严禁**仅修改 `package.json` 而遗漏 `package-lock.json`，否则 GitHub Actions 的 `npm ci` 步骤将直接报错崩溃。
   - **Python**：
     - 安装后必须通过 `pip freeze > requirements.txt` 或导出 `pyproject.toml` 保持清单最新。

2. **Git 仓库同步的“提交与忽略”铁律**：
   - **✅ 必须提交到 Git 的文件**：
     - 依赖描述文件：`package.json`, `requirements.txt`, `pyproject.toml`
     - 依赖版本锁定文件：`package-lock.json`, `poetry.lock`
   - **❌ 绝对禁止提交到 Git 的文件（必须在 .gitignore 中忽略）**：
     - 虚拟环境与依赖本体：`node_modules/`, `.venv/`, `venv/`, `env/`
     - 字节码与构建产物：`__pycache__/`, `*.pyc`, `dist/`, `build/`
     - 本地敏感配置：`.env`, `.env.local`, 私钥凭据文件

---

## 三、极简依赖引入原则 (防膨胀)

1. **优先原生能力**：现代 JavaScript/TypeScript 与 Python 具备丰富的内置标准库，若原生 API 代码量很小即可满足，严禁为简单功能随意引入重量级第三方库。
2. **审查依赖体积与安全性**：引入任何第三方依赖前，必须确认其无高危漏洞且体积极小、维护积极。
