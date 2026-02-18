import { Tool } from './enums/tool';
import { ListDevices } from './requests/list-devices';
import { ListActiveSessions } from './requests/list-active-sessions';
import { StopSession } from './requests/stop-session';
import { MobileGetScreenSize } from './requests/mobile-get-screen-size';
import { MobileGetOrientation } from './requests/mobile-get-orientation';
import { MobileSetOrientation } from './requests/mobile-set-orientation';
import { MobileSaveScreenshot } from './requests/mobile-save-screenshot';
import { MobileListElementsOnScreen } from './requests/mobile-list-elements-on-screen';
import { MobileClickOnScreenAtCoordinates } from './requests/mobile-click-on-screen-at-coordinates';
import { MobileDoubleTapOnScreen } from './requests/mobile-double-tap-on-screen';
import { MobileLongPressOnScreenAtCoordinates } from './requests/mobile-long-press-on-screen-at-coordinates';
import { MobileSwipeOnScreen } from './requests/mobile-swipe-on-screen';
import { MobileTypeKeys } from './requests/mobile-type-keys';
import { MobilePressButton } from './requests/mobile-press-button';
import { MobileHideKeyboard } from './requests/mobile-hide-keyboard';
import { MobileLaunchApp } from './requests/mobile-launch-app';
import { MobileTerminateApp } from './requests/mobile-terminate-app';
import { MobileInstallApp } from './requests/mobile-install-app';
import { MobileUninstallApp } from './requests/mobile-uninstall-app';
import { MobileListApps } from './requests/mobile-list-apps';
import { MobileGetDeviceInfo } from './requests/mobile-get-device-info';
import { MobileSwitchToWebview } from './requests/mobile-switch-to-webview';
import { MobileSwitchToNative } from './requests/mobile-switch-to-native';
import { MobileExecuteScript } from './requests/mobile-execute-script';
import { MobileGetContexts } from './requests/mobile-get-contexts';
import { MobileConfigureDeeplinks } from './requests/mobile-configure-deeplinks';
import { AllHandlers } from './types/handlers';
import { CreateSession } from './requests/create-session';
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
	[Tool.LIST_DEVICES]: new ListDevices(driver, session, deviceFarmClient, projectARN),
	[Tool.STOP_SESSION]: new StopSession(driver, session, deviceFarmClient),
	[Tool.MOBILE_GET_SCREEN_SIZE]: new MobileGetScreenSize(driver, session),
	[Tool.MOBILE_GET_ORIENTATION]: new MobileGetOrientation(driver, session),
	[Tool.MOBILE_SET_ORIENTATION]: new MobileSetOrientation(driver, session),
	[Tool.MOBILE_SAVE_SCREENSHOT]: new MobileSaveScreenshot(driver, session),
	[Tool.MOBILE_LIST_ELEMENTS_ON_SCREEN]: new MobileListElementsOnScreen(driver, session),
	[Tool.MOBILE_CLICK_ON_SCREEN_AT_COORDINATES]: new MobileClickOnScreenAtCoordinates(driver, session),
	[Tool.MOBILE_DOUBLE_TAP_ON_SCREEN]: new MobileDoubleTapOnScreen(driver, session),
	[Tool.MOBILE_LONG_PRESS_ON_SCREEN_AT_COORDINATES]: new MobileLongPressOnScreenAtCoordinates(driver, session),
	[Tool.MOBILE_SWIPE_ON_SCREEN]: new MobileSwipeOnScreen(driver, session),
	[Tool.MOBILE_TYPE_KEYS]: new MobileTypeKeys(driver, session),
	[Tool.MOBILE_PRESS_BUTTON]: new MobilePressButton(driver, session),
	[Tool.MOBILE_HIDE_KEYBOARD]: new MobileHideKeyboard(driver, session),
	[Tool.MOBILE_LAUNCH_APP]: new MobileLaunchApp(driver, session),
	[Tool.MOBILE_TERMINATE_APP]: new MobileTerminateApp(driver, session),
	[Tool.MOBILE_INSTALL_APP]: new MobileInstallApp(driver, session, deviceFarmClient, projectARN),
	[Tool.MOBILE_UNINSTALL_APP]: new MobileUninstallApp(driver, session),
	[Tool.MOBILE_LIST_APPS]: new MobileListApps(driver, session),
	[Tool.MOBILE_GET_DEVICE_INFO]: new MobileGetDeviceInfo(driver, session),
	[Tool.MOBILE_SWITCH_TO_WEBVIEW]: new MobileSwitchToWebview(driver, session),
	[Tool.MOBILE_SWITCH_TO_NATIVE]: new MobileSwitchToNative(driver, session),
	[Tool.MOBILE_EXECUTE_SCRIPT]: new MobileExecuteScript(driver, session),
	[Tool.MOBILE_GET_CONTEXTS]: new MobileGetContexts(driver, session),
	[Tool.MOBILE_CONFIGURE_DEEPLINKS]: new MobileConfigureDeeplinks(driver, session),
} satisfies AllHandlers;
