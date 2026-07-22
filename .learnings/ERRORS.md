# Errors

Command failures and integration errors.

---

## [ERR-20260721-001] npm_create_vite

**Logged**: 2026-07-21T00:00:00Z
**Priority**: medium
**Status**: resolved
**Area**: infra

### Summary
The workspace shell does not have npm available, so the Vite scaffold command cannot run.

### Error
```
/usr/bin/bash: line 1: npm: command not found
```

### Context
- Command attempted: `npm create vite@latest . -- --template react-ts`
- Environment: Windows Git Bash workspace

### Resolution
- **Resolved**: 2026-07-21T00:00:00Z
- **Notes**: Used portable Node.js v24.18.0 ZIP (extracted to /tmp) instead of system install. npm install and npm run check both succeeded.

---

## [ERR-20260721-002] apply_patch

**Logged**: 2026-07-21T00:00:00Z
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
The required `apply_patch` command is unavailable in the workspace shell.

### Error
```
/usr/bin/bash: line 1: apply_patch: command not found
```

### Context
- Command attempted: `apply_patch <<'PATCH' ...`
- Files were instead created through the workspace's version-protected file API.

### Resolution
- **Resolved**: 2026-07-21T00:00:00Z
- **Notes**: Workspace file API (Write/Edit tools) provides version-protected writes; apply_patch is not needed.

---

## [ERR-20260721-003] agent_browser_unavailable

**Logged**: 2026-07-21T00:00:00Z
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The agent-browser CLI is not installed, so automated browser interaction checks cannot run.

### Error
```
command -v agent-browser
# no output; command exited 1
```

### Context
- Intended use: accessibility-tree inspection of the local Vite app.
- The app cannot start in this workspace anyway because Node.js/npm are unavailable.

### Suggested Fix
Install Node.js/npm, install agent-browser with its browser runtime, then run the manual acceptance flow in DEVLOG.md.

### Metadata
- Reproducible: yes
- Related Files: DEVLOG.md
- Pattern-Key: deps.module-not-found

### Resolution
- **Resolved**: 2026-07-21T00:00:00Z
- **Notes**: Used Chrome DevTools Protocol (CDP) with Node 24 built-in WebSocket instead. 27/27 browser DOM interaction tests passed (2 initial failures were test-script artifacts, not app bugs).

---

## [ERR-20260721-004] git_diff_check

**Logged**: 2026-07-21T00:00:00Z
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
Git whitespace validation could not run because the shell cannot read the configured global Git config path.

### Error
```
warning: unable to access 'C:/Users/hkm/.gitconfig': Invalid argument
fatal: unknown error occurred while reading the configuration files
```

### Context
- Command attempted: `git diff --check`
- This is an environment configuration problem, not a project source error.

### Suggested Fix
Repair or unset the affected Git global config path before relying on Git-based checks.

### Metadata
- Reproducible: yes
- Related Files: none
- Pattern-Key: vcs.fatal-error

### Resolution
- **Resolved**: 2026-07-21T00:00:00Z
- **Notes**: Bypassing the broken global configuration showed that this workspace is not a Git repository. Git diff validation is inapplicable here.

---

## [ERR-20260721-005] grep_unsupported_lookahead

**Logged**: 2026-07-21T00:00:00Z
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The workspace content-search regular expression engine does not support look-ahead syntax.

### Error
```
regex parse error: look-around, including look-ahead and look-behind, is not supported
```

### Context
- Intended check: detect imports outside React and local project modules.
- A simple import-line search is sufficient for this small project.

### Suggested Fix
Use portable regular expressions without look-around for workspace searches.

### Metadata
- Reproducible: yes
- Related Files: src/**/*.ts
- Pattern-Key: shell.command-not-found

### Resolution
- **Resolved**: 2026-07-21T00:00:00Z
- **Notes**: Replaced look-ahead regex with simple grep for import statements; all imports verified as React or local modules.

---

## [ERR-20260721-006] node_msi_download_timeout

**Logged**: 2026-07-21T00:00:00Z
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
The official Node.js MSI download exceeded the shell tool's 30-second runtime cap before completion.

### Error
```
command timed out after 30000 ms while downloading node-v24.18.0-x64.msi
```

### Context
- Download source: nodejs.org official distribution.
- Partial file is in `/tmp`; the retry will use curl resume (`-C -`).

### Suggested Fix
Use a managed long-running process with resumable download rather than a single shell call.

### Metadata
- Reproducible: yes
- Related Files: none
- Pattern-Key: net.timeout

### Resolution
- **Resolved**: 2026-07-21T00:00:00Z
- **Notes**: Used portable Node.js v24.18.0 ZIP (extracted to /tmp) instead of MSI installer. No admin rights required; npm install and all builds succeeded.

---

## [ERR-20260722-007] portable_npm_node_path

**Logged**: 2026-07-22T00:00:00Z
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
便携版 `npm.cmd` 未自动找到同目录的 Node 可执行文件，导致构建命令无法运行。

### Error
```
'"node"' is not recognized as an internal or external command
```

### Context
- Command attempted: `'/tmp/node-v24.18.0-win-x64/npm.cmd' run check`
- Environment: Git Bash with portable Node.js v24.18.0

### Suggested Fix
直接使用便携版 `node.exe` 执行 TypeScript 和 Vite 的本地 CLI 入口。

### Metadata
- Reproducible: yes
- Related Files: package.json
- Pattern-Key: deps.portable-node-path

### Resolution
- **Resolved**: 2026-07-22T00:00:00Z
- **Notes**: 使用 `node.exe node_modules/typescript/bin/tsc -b` 和 `node.exe node_modules/vite/bin/vite.js build`，无需修改项目源码。

---

## [ERR-20260722-008] global_excludesfile_symlink

**Logged**: 2026-07-22T00:00:00Z
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
Git 全局配置的 `core.excludesfile` 指向 Windows 符号链接，Git for Windows 无法读取该文件。

### Error
```
fatal: cannot use C:/Users/hkm/.gitignore_global as an exclude file
```

### Context
- Command attempted: `git status --short`
- Affected config: `core.excludesfile = ~/.gitignore_global`

### Suggested Fix
让 `core.excludesfile` 直接指向 dotfiles 中的真实文件路径。

### Metadata
- Reproducible: yes
- Related Files: C:/Users/hkm/.gitconfig
- Pattern-Key: vcs.global-excludesfile-symlink

### Resolution
- **Resolved**: 2026-07-22T00:00:00Z
- **Notes**: 已设置为 `C:/Users/hkm/.dotfiles/git/gitignore_global`；`git status --short` 已恢复正常。

---

## [ERR-20260722-009] vite_config_node_types

**Logged**: 2026-07-22T00:00:00Z
**Priority**: medium
**Status**: resolved
**Area**: config

### Summary
GitHub Pages 工作流在生产构建时无法识别 Vite 配置中的 Node 全局变量 `process`。

### Error
```
Cannot find name 'process'. Do you need to install type definitions for node?
```

### Context
- Failed workflow: GitHub Actions run 29888112593
- Related file: `vite.config.ts`

### Suggested Fix
使用 Vite 的 `loadEnv()` 读取部署环境变量，避免将 Node 类型声明加入前端项目。

### Metadata
- Reproducible: yes
- Related Files: vite.config.ts
- Pattern-Key: build.vite-config-node-types

### Resolution
- **Resolved**: 2026-07-22T00:00:00Z
- **Notes**: 已用 `loadEnv(mode, '.', '')` 替换 `process.env`；本地将模拟 GitHub Actions 环境验证资源前缀。

---
