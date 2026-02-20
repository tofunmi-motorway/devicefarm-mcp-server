# NPM Publishing Guide

## ✅ Ready to Publish

The package is ready to publish to npm!

### 📦 Package Information
- **Name**: devicefarm-mcp-server
- **Version**: 1.0.0
- **Type**: TypeScript (compiled to JavaScript)

### 📋 Publishing Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Login to npm**
   ```bash
   npm login
   ```

3. **Publish package**
   ```bash
   npm publish
   ```

4. **Verify publication**
   ```bash
   npm view devicefarm-mcp-server
   ```

### 🚀 User Usage

After publishing, users can directly use:

```bash
npx devicefarm-mcp-server
```

### 📝 MCP Configuration

```json
{
  "mcpServers": {
    "devicefarm": {
      "command": "npx",
      "args": ["devicefarm-mcp-server"],
      "env": {
        "AWS_REGION": "us-west-2",
        "AWS_PROFILE": "default",
        "PROJECT_ARN": "arn:aws:devicefarm:us-west-2:YOUR_ACCOUNT:project:YOUR_PROJECT_ID"
      }
    }
  }
}
```

### 🔄 Version Updates

Modify version in package.json, then:

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm run build      # Rebuild
npm publish
```

### ⚠️ Important Notes

- Requires npm account
- Package name `devicefarm-mcp-server` must be available
- First publish may require email verification
- Must run `npm run build` before publishing

### 📊 Package Contents

TypeScript source compiled and published:
```
devicefarm-mcp-server@1.0.0
├── build/          (Compiled JavaScript)
├── README.md
├── package.json
└── images/
    └── appium-endpoint.png
```

