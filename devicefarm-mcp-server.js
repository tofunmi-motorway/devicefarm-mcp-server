#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { remote } = require('webdriverio');
const { DeviceFarmClient, CreateUploadCommand, GetUploadCommand, CreateRemoteAccessSessionCommand, GetRemoteAccessSessionCommand, ListDevicesCommand, StopRemoteAccessSessionCommand, ListRemoteAccessSessionsCommand, InstallToRemoteAccessSessionCommand } = require('@aws-sdk/client-device-farm');
const fs = require('node:fs');
const https = require('node:https');
const { URL } = require('node:url');
const path = require('node:path');

validateRequiredEnvVariables();

const PROJECT_ARN = process.env.PROJECT_ARN;
let DEVICE_FARM_URL = null;
let currentSessionArn = null;

let driver = null;
const dfClient = new DeviceFarmClient({ region: 'us-west-2' });

/**
 * Validate that all required environment variables are set.
 */
function validateRequiredEnvVariables() {
  const requiredEnvVariables = ['PROJECT_ARN'];
  const unsetEnvVariables = requiredEnvVariables.filter(variable => !process.env[variable]);

  if (unsetEnvVariables.length > 0) {
    throw new Error(`Please set the required env variable "${unsetEnvVariables.join(', ')}"`);
  }
}

async function getDriver() {
  if (!driver && DEVICE_FARM_URL) {
    const url = new URL(DEVICE_FARM_URL);
    driver = await remote({
      hostname: url.hostname,
      path: url.pathname,
      protocol: 'https',
      port: 443,
      capabilities: { platformName: 'Android', 'appium:automationName': 'UiAutomator2' },
      logLevel: 'silent'
    });
  }
  return driver;
}

async function uploadToS3(url, filePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const fileStats = fs.statSync(filePath);
        const fileStream = fs.createReadStream(filePath);
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileStats.size
          }
        };
        const req = https.request(options, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Upload failed: ${res.statusCode}`));
        });
        req.on('error', reject);
        fileStream.pipe(req);
      });
      return; // Success
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
    }
  }
}

async function waitForSessionReady(sessionArn) {
  let status = 'PENDING';
  let attempts = 0;
  const maxAttempts = 120; // 10 分钟 (120 * 5秒)

  while (!['RUNNING', 'FAILED'].includes(status) && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 5000));
    const getCmd = new GetRemoteAccessSessionCommand({ arn: sessionArn });
    const session = await dfClient.send(getCmd);
    status = session.remoteAccessSession.status;

    // 如果有 endpoints，说明会话已经可用
    if (session.remoteAccessSession.endpoints?.remoteDriverEndpoint) {
      return session.remoteAccessSession;
    }

    attempts++;
  }

  if (status === 'FAILED') throw new Error('Session failed to start');
  if (attempts >= maxAttempts) throw new Error('Session timeout after 10 minutes');

  // 最后再获取一次确保有最新数据
  const getCmd = new GetRemoteAccessSessionCommand({ arn: sessionArn });
  const session = await dfClient.send(getCmd);
  return session.remoteAccessSession;
}

const server = new Server({ name: 'devicefarm', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'create_session', description: 'Create Device Farm remote session. Optional apkPath uploads APK to project (manual install required)', inputSchema: { type: 'object', properties: { deviceArn: { type: 'string' }, appArn: { type: 'string', description: 'Pre-uploaded app ARN' }, apkPath: { type: 'string', description: 'Local APK to upload (not auto-installed)' }, sessionName: { type: 'string' }, platform: { type: 'string', enum: ['ANDROID', 'IOS'] } } } },
    { name: 'install_and_launch_app', description: 'Get instructions to install APK and launch app. Returns interactive session URL and launch command', inputSchema: { type: 'object', properties: { appId: { type: 'string', description: 'App package ID' } }, required: ['appId'] } },
    { name: 'list_devices', description: 'List available devices', inputSchema: { type: 'object', properties: { platform: { type: 'string', enum: ['ANDROID', 'IOS'] } } } },
    { name: 'list_active_sessions', description: 'List active sessions', inputSchema: { type: 'object', properties: {} } },
    { name: 'stop_session', description: 'Stop current session', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_get_screen_size', description: 'Get device screen size', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_get_orientation', description: 'Get screen orientation', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_set_orientation', description: 'Set screen orientation', inputSchema: { type: 'object', properties: { orientation: { type: 'string', enum: ['PORTRAIT', 'LANDSCAPE'] } }, required: ['orientation'] } },
    { name: 'mobile_save_screenshot', description: 'Save screenshot to file', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    { name: 'mobile_list_elements_on_screen', description: 'List all elements on screen', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_click_on_screen_at_coordinates', description: 'Click at coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
    { name: 'mobile_double_tap_on_screen', description: 'Double tap at coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
    { name: 'mobile_long_press_on_screen_at_coordinates', description: 'Long press at coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
    { name: 'mobile_swipe_on_screen', description: 'Swipe gesture', inputSchema: { type: 'object', properties: { direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] }, percent: { type: 'number' } }, required: ['direction'] } },
    { name: 'mobile_type_keys', description: 'Type text', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
    { name: 'mobile_press_button', description: 'Press device button', inputSchema: { type: 'object', properties: { button: { type: 'string', enum: ['home', 'back'] } }, required: ['button'] } },
    { name: 'mobile_hide_keyboard', description: 'Hide the on-screen keyboard', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_launch_app', description: 'Launch app by package ID', inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'] } },
    { name: 'mobile_terminate_app', description: 'Terminate app', inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'] } },
    { name: 'mobile_install_app', description: 'Install APK via AWS Device Farm', inputSchema: { type: 'object', properties: { apkPath: { type: 'string' } }, required: ['apkPath'] } },
    { name: 'mobile_uninstall_app', description: 'Uninstall app', inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'] } },
    { name: 'mobile_list_apps', description: 'Check if app is installed', inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'] } },
    { name: 'mobile_get_device_info', description: 'Get device information', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_switch_to_webview', description: 'Switch to WebView context for web content interaction', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_switch_to_native', description: 'Switch back to native app context', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_execute_script', description: 'Execute JavaScript in WebView context', inputSchema: { type: 'object', properties: { script: { type: 'string', description: 'JavaScript code to execute' } }, required: ['script'] } },
    { name: 'mobile_get_contexts', description: 'List available contexts (NATIVE_APP, WEBVIEW)', inputSchema: { type: 'object', properties: {} } },
    { name: 'mobile_configure_deeplinks', description: 'Configure app to handle deep links automatically', inputSchema: { type: 'object', properties: { appId: { type: 'string', description: 'App package ID' } }, required: ['appId'] } },
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const currentDriver = await getDriver();

    let result;

    switch (name) {
      case 'create_session':
        let deviceArn = args.deviceArn;
        if (!deviceArn) {
          const listCmd = new ListDevicesCommand({ arn: PROJECT_ARN });
          const devices = await dfClient.send(listCmd);
          let filtered = devices.devices.filter(d =>
            (!args.platform || d.platform === args.platform) && d.availability === 'AVAILABLE'
          );

          // 如果没有 AVAILABLE 设备，尝试 HIGHLY_AVAILABLE
          if (filtered.length === 0) {
            filtered = devices.devices.filter(d =>
              (!args.platform || d.platform === args.platform) && d.availability === 'HIGHLY_AVAILABLE'
            );
          }

          // 如果还是没有，使用任何匹配平台的设备
          if (filtered.length === 0) {
            filtered = devices.devices.filter(d => !args.platform || d.platform === args.platform);
          }

          if (filtered.length === 0) throw new Error('No devices found');
          deviceArn = filtered[0].arn;
        }

        let appArn = args.appArn;
        let progressLog = [];

        // 如果提供了 apkPath，先上传
        if (args.apkPath && !appArn) {
          try {
            const apkPath = path.isAbsolute(args.apkPath) ? args.apkPath : path.resolve(process.cwd(), args.apkPath);

            if (!fs.existsSync(apkPath)) {
              throw new Error(`APK file not found: ${apkPath}`);
            }

            progressLog.push(`Uploading ${path.basename(apkPath)}...`);
            const fileName = path.basename(apkPath);
            const createUpCmd = new CreateUploadCommand({
              projectArn: PROJECT_ARN,
              name: fileName,
              type: 'ANDROID_APP'
            });
            const upload = await dfClient.send(createUpCmd);
            await uploadToS3(upload.upload.url, apkPath);
            progressLog.push('APK uploaded, processing...');

            let uploadStatus = 'INITIALIZED';
            let uploadAttempts = 0;
            while (uploadStatus !== 'SUCCEEDED' && uploadStatus !== 'FAILED' && uploadAttempts < 30) {
              await new Promise(r => setTimeout(r, 2000));
              const getUpCmd = new GetUploadCommand({ arn: upload.upload.arn });
              const uploadResult = await dfClient.send(getUpCmd);
              uploadStatus = uploadResult.upload.status;
              uploadAttempts++;
            }

            if (uploadStatus === 'SUCCEEDED') {
              appArn = upload.upload.arn;
              progressLog.push('APK ready');
            } else {
              throw new Error(`APK processing failed: ${uploadStatus}`);
            }
          } catch (uploadError) {
            throw new Error(`Failed to upload APK: ${uploadError.message}`);
          }
        }

        progressLog.push('Creating session...');
        const createCmd = new CreateRemoteAccessSessionCommand({
          projectArn: PROJECT_ARN,
          deviceArn,
          name: args.sessionName || 'MCP Session',
          configuration: { billingMethod: 'METERED' }
        });

        const session = await dfClient.send(createCmd);
        currentSessionArn = session.remoteAccessSession.arn;
        progressLog.push(`Session created: ${session.remoteAccessSession.status}`);

        progressLog.push('Waiting for Appium endpoint...');
        const readySession = await waitForSessionReady(currentSessionArn);
        DEVICE_FARM_URL = readySession.endpoints?.remoteDriverEndpoint;
        if (!DEVICE_FARM_URL) throw new Error('No Appium endpoint available');
        driver = null;
        progressLog.push('Session ready!');

        // 如果有 appArn，自动安装到 session
        if (appArn) {
          progressLog.push('Installing app to session...');
          const installCmd = new InstallToRemoteAccessSessionCommand({
            remoteAccessSessionArn: currentSessionArn,
            appArn: appArn
          });
          await dfClient.send(installCmd);
          progressLog.push('App installed!');
        }

        result = {
          sessionArn: readySession.arn,
          appiumEndpoint: readySession.endpoints?.remoteDriverEndpoint,
          interactiveEndpoint: readySession.endpoints?.interactiveEndpoint,
          status: readySession.status,
          device: readySession.device?.name,
          uploadedAppArn: appArn,
          appInstalled: !!appArn,
          progress: progressLog
        };
        break;

      case 'list_devices':
        const listDevCmd = new ListDevicesCommand({ arn: PROJECT_ARN });
        const devList = await dfClient.send(listDevCmd);
        const filtered = devList.devices.filter(d => !args.platform || d.platform === args.platform);
        result = filtered.map(d => ({
          arn: d.arn,
          name: d.name,
          platform: d.platform,
          os: d.os,
          availability: d.availability
        }));
        break;

      case 'list_active_sessions':
        const listSessionsCmd = new ListRemoteAccessSessionsCommand({ arn: PROJECT_ARN });
        const sessions = await dfClient.send(listSessionsCmd);
        const activeSessions = sessions.remoteAccessSessions?.filter(s =>
          ['RUNNING', 'PENDING', 'PENDING_CONCURRENCY', 'PENDING_DEVICE', 'PREPARING'].includes(s.status)
        ) || [];
        result = activeSessions.map(s => ({
          arn: s.arn,
          name: s.name,
          status: s.status,
          device: s.device?.name,
          created: s.created,
          appiumEndpoint: s.endpoints?.remoteDriverEndpoint
        }));
        break;

      case 'stop_session':
        if (!currentSessionArn) throw new Error('No active session');
        const stopCmd = new StopRemoteAccessSessionCommand({ arn: currentSessionArn });
        await dfClient.send(stopCmd);
        DEVICE_FARM_URL = null;
        driver = null;
        currentSessionArn = null;
        result = 'Session stopped';
        break;

      case 'mobile_get_screen_size':
        result = await currentDriver.getWindowSize();
        break;
      case 'mobile_get_orientation':
        result = await currentDriver.getOrientation();
        break;
      case 'mobile_set_orientation':
        await currentDriver.setOrientation(args.orientation);
        result = 'Orientation set';
        break;
      case 'mobile_save_screenshot': {
        const screenshot = await currentDriver.takeScreenshot();
        fs.writeFileSync(args.path, screenshot, 'base64');
        result = `Screenshot saved to ${args.path}`;
        break;
      }
      case 'mobile_list_elements_on_screen':
        result = await currentDriver.getPageSource();
        break;
      case 'mobile_click_on_screen_at_coordinates':
        await currentDriver.execute('mobile: clickGesture', { x: args.x, y: args.y });
        result = 'Clicked';
        break;
      case 'mobile_double_tap_on_screen':
        await currentDriver.execute('mobile: doubleClickGesture', { x: args.x, y: args.y });
        result = 'Double tapped';
        break;
      case 'mobile_long_press_on_screen_at_coordinates':
        await currentDriver.execute('mobile: longClickGesture', { x: args.x, y: args.y });
        result = 'Long pressed';
        break;
      case 'mobile_swipe_on_screen': {
        const size = await currentDriver.getWindowSize();
        const percent = args.percent || 0.75;

        // Use larger swipe area to avoid accidental clicks
        await currentDriver.execute('mobile: swipeGesture', {
          left: size.width * 0.1,           // 10% from left
          top: size.height * 0.2,            // 20% from top
          width: size.width * 0.8,           // 80% of screen width
          height: size.height * 0.6,         // 60% of screen height
          direction: args.direction,
          percent: percent
        });
        result = 'Swiped';
        break;
      }
      case 'mobile_type_keys':
        await currentDriver.execute('mobile: type', { text: args.text });
        result = 'Text typed';
        break;
      case 'mobile_press_button': {
        const keycode = args.button === 'home' ? 3 : 4;
        await currentDriver.execute('mobile: pressKey', {keycode});
        result = `${args.button} button pressed`;
        break;
      }
      case 'mobile_hide_keyboard':
        await currentDriver.hideKeyboard('tapOutside');

        result = 'Keyboard hidden';
        break;
      case 'mobile_launch_app':
        // 使用 monkey 命令启动应用（最可靠的方式）
        await currentDriver.execute('mobile: shell', {
          command: 'monkey',
          args: ['-p', args.appId, '-c', 'android.intent.category.LAUNCHER', '1']
        });
        result = 'App launched';
        break;
      case 'mobile_terminate_app':
        await currentDriver.execute('mobile: terminateApp', { appId: args.appId });
        result = 'App terminated';
        break;
      case 'mobile_install_app': {
        if (!currentSessionArn) throw new Error('No active session');

        const apkPath = path.isAbsolute(args.apkPath) ? args.apkPath : path.resolve(process.cwd(), args.apkPath);
        if (!fs.existsSync(apkPath)) throw new Error(`APK not found: ${apkPath}`);

        const fileName = path.basename(apkPath);
        const createUpCmd = new CreateUploadCommand({
          projectArn: PROJECT_ARN,
          name: fileName,
          type: 'ANDROID_APP'
        });
        const upload = await dfClient.send(createUpCmd);
        await uploadToS3(upload.upload.url, apkPath);

        let status = 'INITIALIZED';
        let attempts = 0;
        while (status !== 'SUCCEEDED' && status !== 'FAILED' && attempts < 30) {
          await new Promise(r => setTimeout(r, 2000));
          const getCmd = new GetUploadCommand({arn: upload.upload.arn});
          const uploadStatus = await dfClient.send(getCmd);
          status = uploadStatus.upload.status;
          attempts++;
        }

        if (status !== 'SUCCEEDED') throw new Error('Upload failed');

        const installCmd = new InstallToRemoteAccessSessionCommand({
          remoteAccessSessionArn: currentSessionArn,
          appArn: upload.upload.arn
        });
        await dfClient.send(installCmd);

        result = `App installed successfully. ARN: ${upload.upload.arn}`;
        break;
      }
      case 'mobile_uninstall_app':
        await currentDriver.execute('mobile: removeApp', { appId: args.appId });
        result = 'App uninstalled';
        break;
      case 'mobile_list_apps': {
        const isInstalled = await currentDriver.execute('mobile: isAppInstalled', {appId: args.appId});
        result = {appId: args.appId, installed: isInstalled};
        break;
      }
      case 'mobile_get_device_info':
        result = await currentDriver.execute('mobile: deviceInfo');
        break;
      case 'mobile_switch_to_webview': {
        const contexts = await currentDriver.getContexts();
        const webviewContext = contexts.find(ctx => ctx.includes('WEBVIEW'));
        if (!webviewContext) throw new Error('No WebView context found. Available contexts: ' + contexts.join(', '));
        await currentDriver.switchContext(webviewContext);
        result = `Switched to ${webviewContext}`;
        break;
      }
      case 'mobile_switch_to_native':
        await currentDriver.switchContext('NATIVE_APP');
        result = 'Switched to native context';
        break;
      case 'mobile_execute_script':
        result = await currentDriver.execute(args.script);
        break;
      case 'mobile_get_contexts':
        result = await currentDriver.getContexts();
        break;
      case 'mobile_configure_deeplinks': {
        const packageId = args.appId;

        // Approve all declared deep link domains for the app
        await currentDriver.execute('mobile: shell', {
          command: 'pm',
          args: ['set-app-links-user-selection', '--user', '0', '--package', packageId, 'true', 'all']
        });

        result = 'Deep links configured';
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
