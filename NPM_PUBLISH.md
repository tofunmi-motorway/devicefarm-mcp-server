# NPM 发布指南

## ✅ 准备完成

包已准备好发布到 npm！

### 📦 包信息
- **名称**: devicefarm-mcp-server
- **版本**: 1.0.0
- **大小**: 524.7 KB (优化后)
- **文件**: 4 个核心文件

### 📋 发布步骤

1. **登录 npm**
   ```bash
   npm login
   ```

2. **发布包**
   ```bash
   npm publish
   ```

3. **验证发布**
   ```bash
   npm view devicefarm-mcp-server
   ```

### 🚀 用户使用方式

发布后，用户可以直接使用：

```bash
npx devicefarm-mcp-server
```

### 📝 MCP 配置

```json
{
  "mcpServers": {
    "devicefarm": {
      "command": "npx",
      "args": ["devicefarm-mcp-server"],
      "env": {
        "AWS_REGION": "us-west-2",
        "AWS_PROFILE": "default"
      }
    }
  }
}
```

### 🔄 更新版本

修改 package.json 中的 version，然后：

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm publish
```

### ⚠️ 注意事项

- 需要 npm 账号
- 包名 `devicefarm-mcp-server` 必须可用
- 首次发布可能需要邮箱验证

### 📊 包内容

```
devicefarm-mcp-server@1.0.0
├── devicefarm-mcp-server.js  (19.1KB)
├── README.md                 (9.4KB)
├── package.json              (1.1KB)
└── images/
    └── appium-endpoint.png   (530.4KB)
```

