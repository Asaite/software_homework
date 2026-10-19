# SVG 编辑器

Lab 1 Phase 1 的 TypeScript 面向对象实现。已完成核心图形模型、Composite、Command、快照撤销及实际 SVG 文件读写；命令目前通过对象 API 使用，交互式 CLI 和字符串命令解析正在接入。

私有仓库：[Asaite/software_homework](https://github.com/Asaite/software_homework)。

需要 Node.js 22 或更新版本。

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run demo
```

`npm run demo` 演示创建组、矩形和文字，整体移动、撤销及重做。编译后也可以执行 `node dist/Main.js`。

完整架构方案、开发记录、自查和验证范围见 [doc/README.md](doc/README.md)。
