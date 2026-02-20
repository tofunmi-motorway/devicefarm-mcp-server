# AWS Device Farm MCP Server

[![npm version](https://badge.fury.io/js/devicefarm-mcp-server.svg)](https://www.npmjs.com/package/devicefarm-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides tools for AWS Device Farm remote access sessions and mobile device automation via Appium.

## How It Works

This MCP server leverages [AWS Device Farm's managed Appium endpoint feature](https://aws.amazon.com/about-aws/whats-new/2025/11/aws-device-farm-managed-appium-endpoint/) to enable programmatic mobile device automation.

![Appium Endpoint Architecture](images/appium-endpoint.png)

### Demo

![Device Farm MCP Demo](images/demo.gif)

### Architecture Overview

1. **Create Remote Access Session** - The MCP server creates a Device Farm session and receives a managed Appium endpoint URL
2. **WebdriverIO Connection** - Connects to the Appium endpoint using WebdriverIO client over HTTPS
3. **Appium Commands** - Executes mobile automation commands (tap, swipe, type, etc.) via the W3C WebDriver protocol
4. **Real Device Control** - Commands are executed on real physical devices in AWS Device Farm

### Key Benefits

- **No Local Appium Server** - AWS manages the Appium infrastructure
- **Real Devices** - Test on actual Android and iOS devices
- **Secure HTTPS** - All communication over encrypted connections
- **Scalable** - Access to AWS Device Farm's device fleet
- **MCP Integration** - Seamless integration with AI assistants via Model Context Protocol

## Features

### Device Farm Session Management
- **create_session**: Create remote access sessions with optional app installation
- **list_devices**: List available devices by platform
- **list_active_sessions**: View all active sessions
- **stop_session**: Stop the current session

### Mobile Device Automation
- **mobile_get_screen_size**: Get device screen dimensions
- **mobile_get_orientation**: Get current screen orientation
- **mobile_set_orientation**: Set screen orientation (PORTRAIT/LANDSCAPE)
- **mobile_save_screenshot**: Capture and save screenshots
- **mobile_list_elements_on_screen**: Get page source XML
- **mobile_tap_on_screen_at_coordinates**: Tap at specific coordinates
- **mobile_double_tap_on_screen_at_coordinates**: Double tap at coordinates
- **mobile_long_press_on_screen_at_coordinates**: Long press at coordinates
- **mobile_swipe_on_screen**: Swipe gestures (up/down/left/right)
- **mobile_type_keys**: Type text input
- **mobile_press_button**: Press device buttons (home/back) - Android only
- **mobile_hide_keyboard**: Hide the on-screen keyboard

### App Management
- **mobile_launch_app**: Launch app by package ID (bundleId for iOS, packageId for Android)
- **mobile_terminate_app**: Terminate running app
- **mobile_install_app**: Upload and install app (APK/IPA) to current session
- **mobile_uninstall_app**: Uninstall app from device
- **mobile_check_app_is_installed**: Check if app is installed
- **mobile_get_device_info**: Get device information

### Context Switching (Hybrid Apps)
- **mobile_get_contexts**: List available contexts (NATIVE_APP, WEBVIEW)
- **mobile_switch_to_webview**: Switch to WebView context for web content interaction
- **mobile_switch_to_native**: Switch back to native app context
- **mobile_execute_script**: Execute JavaScript in WebView context

### Advanced
- **mobile_configure_deeplinks**: Configure app to handle deep links automatically - Android only

## Prerequisites

- **Node.js** v18 or higher
- **AWS Credentials** configured (one of the following):
  - AWS CLI installed and configured (`aws configure`)
  - Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
  - IAM role (if running on EC2)
  - AWS profile in `~/.aws/credentials`
- **AWS Permissions**: IAM permissions for Device Farm operations:
  - `devicefarm:CreateRemoteAccessSession`
  - `devicefarm:GetRemoteAccessSession`
  - `devicefarm:StopRemoteAccessSession`
  - `devicefarm:ListDevices`
  - `devicefarm:CreateUpload`
  - `devicefarm:GetUpload`
  - `devicefarm:InstallToRemoteAccessSession`
- **AWS Device Farm Project ARN** (see Configuration section)

## Installation

### Quick Start with npx (Recommended)

No installation needed! Just run:

```bash
npx devicefarm-mcp-server
```

The package will be automatically downloaded and executed.

### Install Globally

```bash
npm install -g devicefarm-mcp-server
devicefarm-mcp-server
```

### From Source

```bash
git clone https://github.com/yoreland/devicefarm-mcp-server.git
cd devicefarm-mcp-server
npm install
npm run build

# Set required environment variable
export PROJECT_ARN='arn:aws:devicefarm:us-west-2:YOUR_ACCOUNT:project:YOUR_PROJECT_ID'

# Run the server
npm start
```

## Configuration

### 1. AWS Credentials

Ensure AWS credentials are configured. The MCP server uses the AWS SDK for JavaScript, which automatically looks for credentials in this order:

1. **Environment variables**:
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=us-west-2
   ```

2. **AWS CLI configuration**:
   ```bash
   aws configure
   ```
   This creates `~/.aws/credentials` and `~/.aws/config`

3. **AWS Profile**:
   ```bash
   export AWS_PROFILE=your-profile-name
   ```

### 2. Set Project ARN

You need to set the environment variable `PROJECT_ARN` to your Device Farm project ARN:

```bash
export PROJECT_ARN='arn:aws:devicefarm:us-west-2:YOUR_ACCOUNT:project:YOUR_PROJECT_ID'
```

If configuring this for an MCP client, check below for guide on how to configure your `PROJECT_ARN`.

### 3. MCP Client Configuration

Configure the MCP server in your MCP client (e.g., Amazon Q Developer CLI `~/.aws/amazonq/mcp.json`):

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
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Note**: The `env` section passes AWS credentials to the MCP server. You can also use:
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (not recommended for security)
- `AWS_PROFILE` to use a specific profile from `~/.aws/credentials`

Or if installed from source:

```json
{
  "mcpServers": {
    "devicefarm": {
      "command": "node",
      "args": ["/path/to/devicefarm-mcp-server/build/index.js"],
      "env": {
        "AWS_REGION": "us-west-2",
        "AWS_PROFILE": "default",
        "PROJECT_ARN": "arn:aws:devicefarm:us-west-2:YOUR_ACCOUNT:project:YOUR_PROJECT_ID"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Usage

### Create Session with APK/IPA

```javascript
// Automatically uploads and installs app to device
create_session({
  applicationPath: "./app.apk",  // or "./app.ipa" for iOS
  platform: "ANDROID",  // or "IOS"
  sessionName: "My Test Session"
})
```

### Create Session with Pre-uploaded App

```javascript
create_session({
  appArn: "arn:aws:devicefarm:us-west-2:...:upload:...",
  deviceArn: "arn:aws:devicefarm:us-west-2::device:..."
})
```

### Mobile Automation Example

```javascript
// Take screenshot
mobile_save_screenshot({ path: "./screenshot.png" })

// Tap at coordinates
mobile_tap_on_screen_at_coordinates({ x: 540, y: 1200 })

// Type text
mobile_type_keys({ text: "Hello World" })

// Launch app
mobile_launch_app({ appId: "com.example.app" })
```

## Key Features

### Automatic App Installation

When creating a session with `applicationPath` or `appArn`, the server automatically:
1. Uploads app to Device Farm (if local path provided)
2. Waits for app processing
3. Creates remote access session
4. **Automatically installs app to device** using `InstallToRemoteAccessSession` API

No manual installation required!

### Session Management

- Maintains single active session
- Automatic Appium driver initialization
- WebSocket endpoints for interactive access
- Proper cleanup on session stop

## API Reference

### create_session

Creates a Device Farm remote access session with optional app installation.

**Parameters:**
- `deviceArn` (optional): Specific device ARN
- `appArn` (optional): Pre-uploaded app ARN
- `applicationPath` (optional): Local application to upload (APK file for Android and IPA for iOS)
- `sessionName` (optional): Session name
- `platform` (required): "ANDROID" or "IOS"
- `os` (optional): Specific OS version
- `preferredDevices` (optional): Preferred device name (e.g. Samsung, Google)

**Returns:**
```json
{
  "sessionArn": "arn:aws:devicefarm:...",
  "appiumEndpoint": "https://...",
  "interactiveEndpoint": "wss://...",
  "status": "RUNNING",
  "device": "Google Pixel 10 Pro XL",
  "uploadedAppArn": "arn:aws:devicefarm:...",
  "appInstalled": true,
  "progress": ["Creating session...", "Session ready!", "App installed!"]
}
```

### mobile_install_app

Uploads and installs app (APK/IPA) to the current active session.

**Parameters:**
- `applicationPath` (required): Local application file path (APK for Android, IPA for iOS)

**Returns:**
```
Application installed successfully. ARN: arn:aws:devicefarm:...
```

## Architecture

This MCP server bridges AI assistants with AWS Device Farm's real device cloud through the managed Appium endpoint:

```
┌─────────────┐      MCP Protocol      ┌──────────────────┐
│ AI Assistant│ ◄──────────────────────► │  MCP Server      │
│ Kiro CLI /  │      Tool Calls         │  (This Project)  │
│ Claude Code │                         └────────┬─────────┘
└─────────────┘                                  │
                                    WebdriverIO  │ HTTPS
                                    W3C Protocol │
                                                 ▼
                                        ┌────────────────┐
                                        │ Device Farm    │
                                        │ Appium Endpoint│
                                        └────────┬───────┘
                                                 │
                                                 ▼
                                        ┌────────────────┐
                                        │  Real Device   │
                                        │  (Android/iOS) │
                                        └────────────────┘
```

### Technical Stack

- **MCP Protocol**: Uses `@modelcontextprotocol/sdk` for tool registration
- **TypeScript**: Full type safety with Zod validation
- **WebdriverIO**: Appium client for mobile automation
- **AWS SDK**: Device Farm API integration (`CreateRemoteAccessSession`, `InstallToRemoteAccessSession`)
- **HTTPS Upload**: Direct S3 upload for APK/IPA files
- **Managed Appium**: AWS-hosted Appium server (no local setup required)

### Session Workflow

1. **Session Creation**
   ```javascript
   CreateRemoteAccessSession → Returns Appium endpoint URL
   ```

2. **App Installation** (Automatic)
   ```javascript
   InstallToRemoteAccessSession → Installs app to device
   ```

3. **Appium Connection**
   ```javascript
   WebdriverIO connects to: https://devicefarm-interactive-global.us-west-2.api.aws/remote-endpoint/...
   ```

4. **Mobile Automation**
   ```javascript
   executeScript('mobile: clickGesture', [{x, y}]) → Device performs action
   ```

## Troubleshooting

### Session Creation Fails

- Check AWS credentials and permissions
- Verify Device Farm project ARN
- Ensure device availability in your region

### Application Upload Timeout

- Check network connectivity
- Verify APK/IPA file is valid
- Increase timeout in `waitFor` function

### Appium Commands Fail

- Ensure session is in RUNNING state
- Verify Appium endpoint is accessible
- Check device compatibility with commands

## License

MIT

## Contributing

Contributions welcome! Please open issues or pull requests on GitHub.
