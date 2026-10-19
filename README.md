# SVG 编辑器

Lab 1 Phase 1 的 TypeScript 面向对象 SVG 编辑器，支持六种图形、十九条命令、嵌套分组、撤销重做和 SVG 文件读写。

私有仓库：[Asaite/software_homework](https://github.com/Asaite/software_homework)。

需要 Node.js 22 或更新版本。

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run cli
```

交互模式显示 `svg>` 提示符。先执行 `init` 或 `read`，再使用编辑、显示和历史命令；`help` 列出全部语法。按 Ctrl+D 或 Ctrl+C 退出。

```text
init 800 600
create g node
create rect r1 120 100 160 60 #4a90d9 in node
create text t1 155 135 "开始" in node
move node 0 100
undo
tree
save demo.svg
```

保存的 SVG 可以直接用浏览器打开。`save` 不带路径时使用上次成功 read/save 的路径；`init` 清除旧路径。

脚本回放使用不带提示符的命令文件：

```sh
npm run cli < examples/flowchart.txt
```

这会在当前目录生成 `flowchart.svg`。仓库内提供 [示例 SVG](examples/flowchart.svg)。整行以 `#` 开始表示注释，`#ffffff` 等颜色参数会保留；带空格路径或文本使用双引号。管道输入省略提示符，按顺序处理全部命令直到 EOF，单条错误输出到 stderr 并继续会话。

编译后可用 `npm start` 或 `node dist/Main.js` 启动同一 REPL。`npm run demo` 保留最初的固定流程演示，编译后对应 `node dist/Demo.js`。

本阶段支持 rect、circle、ellipse、line、text、g；插件和 box 属后续阶段。SVG 导入支持题目规定的元素和属性，transform、CSS、路径等未支持内容明确报错，具体范围见架构文档。

完整架构方案、开发记录、自查和验证范围见 [doc/README.md](doc/README.md)。
