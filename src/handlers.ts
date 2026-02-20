import { Tool } from './enums/tool';
import { ListDevices } from './tools/device/list-devices';
import { ListActiveSessions } from './tools/session/list-active-sessions';
import { StopSession } from './tools/session/stop-session';
import { MobileGetScreenSize } from './tools/screen/mobile-get-screen-size';
import { MobileGetOrientation } from './tools/screen/mobile-get-orientation';
import { MobileSetOrientation } from './tools/screen/mobile-set-orientation';
import { MobileSaveScreenshot } from './tools/screen/mobile-save-screenshot';
import { MobileListElementsOnScreen } from './tools/screen/mobile-list-elements-on-screen';
import { MobileTapOnScreenAtCoordinates } from './tools/gestures/mobile-tap-on-screen-at-coordinates';
import { MobileDoubleTapOnScreenAtCoordinates } from './tools/gestures/mobile-double-tap-on-screen-at-coordinates';
import { MobileLongPressOnScreenAtCoordinates } from './tools/gestures/mobile-long-press-on-screen-at-coordinates';
import { MobileSwipeOnScreen } from './tools/gestures/mobile-swipe-on-screen';
import { MobileTypeKeys } from './tools/input/mobile-type-keys';
import { MobilePressButton } from './tools/gestures/mobile-press-button';
import { MobileHideKeyboard } from './tools/input/mobile-hide-keyboard';
import { MobileLaunchApp } from './tools/app/mobile-launch-app';
import { MobileTerminateApp } from './tools/app/mobile-terminate-app';
import { MobileInstallApp } from './tools/app/mobile-install-app';
import { MobileUninstallApp } from './tools/app/mobile-uninstall-app';
import { MobileCheckAppIsInstalled } from './tools/app/mobile-check-app-is-installed';
import { MobileGetDeviceInfo } from './tools/device/mobile-get-device-info';
import { MobileSwitchToWebview } from './tools/context/mobile-switch-to-webview';
import { MobileSwitchToNative } from './tools/context/mobile-switch-to-native';
import { MobileExecuteScript } from './tools/others/mobile-execute-script';
import { MobileGetContexts } from './tools/context/mobile-get-contexts';
import { MobileConfigureDeeplinks } from './tools/others/mobile-configure-deeplinks';
import { AllHandlers } from './types/handlers';
import { CreateSession } from './tools/session/create-session';
import { Driver } from './lib/driver';
import { Session } from './lib/session';
import { DeviceFarmClient } from '@aws-sdk/client-device-farm';
import config from './lib/config';

const deviceFarmClient = new DeviceFarmClient({ region: 'us-west-2' });
const projectARN: string = config.getOrThrow<string>('PROJECT_ARN');
const driver: Driver = new Driver();
const session: Session = new Session();

export default {
	[Tool.CREATE_SESSION]: new CreateSession(driver, session, deviceFarmClient, projectARN),
	[Tool.LIST_ACTIVE_SESSIONS]: new ListActiveSessions(driver, session, deviceFarmClient, projectARN),
	[Tool.STOP_SESSION]: new StopSession(driver, session, deviceFarmClient),

	[Tool.LIST_DEVICES]: new ListDevices(driver, session, deviceFarmClient, projectARN),
	[Tool.MOBILE_GET_DEVICE_INFO]: new MobileGetDeviceInfo(driver, session),

	[Tool.MOBILE_GET_SCREEN_SIZE]: new MobileGetScreenSize(driver, session),
	[Tool.MOBILE_GET_ORIENTATION]: new MobileGetOrientation(driver, session),
	[Tool.MOBILE_SET_ORIENTATION]: new MobileSetOrientation(driver, session),
	[Tool.MOBILE_SAVE_SCREENSHOT]: new MobileSaveScreenshot(driver, session),
	[Tool.MOBILE_LIST_ELEMENTS_ON_SCREEN]: new MobileListElementsOnScreen(driver, session),

	[Tool.MOBILE_TAP_ON_SCREEN_AT_COORDINATES]: new MobileTapOnScreenAtCoordinates(driver, session),
	[Tool.MOBILE_DOUBLE_TAP_ON_SCREEN_AT_COORDINATES]: new MobileDoubleTapOnScreenAtCoordinates(driver, session),
	[Tool.MOBILE_LONG_PRESS_ON_SCREEN_AT_COORDINATES]: new MobileLongPressOnScreenAtCoordinates(driver, session),
	[Tool.MOBILE_SWIPE_ON_SCREEN]: new MobileSwipeOnScreen(driver, session),
	[Tool.MOBILE_PRESS_BUTTON]: new MobilePressButton(driver, session),

	[Tool.MOBILE_TYPE_KEYS]: new MobileTypeKeys(driver, session),
	[Tool.MOBILE_HIDE_KEYBOARD]: new MobileHideKeyboard(driver, session),

	[Tool.MOBILE_LAUNCH_APP]: new MobileLaunchApp(driver, session),
	[Tool.MOBILE_TERMINATE_APP]: new MobileTerminateApp(driver, session),
	[Tool.MOBILE_INSTALL_APP]: new MobileInstallApp(driver, session, deviceFarmClient, projectARN),
	[Tool.MOBILE_UNINSTALL_APP]: new MobileUninstallApp(driver, session),
	[Tool.MOBILE_CHECK_APP_IS_INSTALLED]: new MobileCheckAppIsInstalled(driver, session),

	[Tool.MOBILE_GET_CONTEXTS]: new MobileGetContexts(driver, session),
	[Tool.MOBILE_SWITCH_TO_WEBVIEW]: new MobileSwitchToWebview(driver, session),
	[Tool.MOBILE_SWITCH_TO_NATIVE]: new MobileSwitchToNative(driver, session),

	[Tool.MOBILE_EXECUTE_SCRIPT]: new MobileExecuteScript(driver, session),
	[Tool.MOBILE_CONFIGURE_DEEPLINKS]: new MobileConfigureDeeplinks(driver, session),
} satisfies AllHandlers;
