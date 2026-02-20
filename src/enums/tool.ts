export enum Tool {
  CREATE_SESSION = 'create_session',
  LIST_ACTIVE_SESSIONS = 'list_active_sessions',
  STOP_SESSION = 'stop_session',

  LIST_DEVICES = 'list_devices',
  MOBILE_GET_DEVICE_INFO = 'mobile_get_device_info',

  MOBILE_LIST_ELEMENTS_ON_SCREEN = 'mobile_list_elements_on_screen',
  MOBILE_GET_SCREEN_SIZE = 'mobile_get_screen_size',
  MOBILE_GET_ORIENTATION = 'mobile_get_orientation',
  MOBILE_SET_ORIENTATION = 'mobile_set_orientation',
  MOBILE_SAVE_SCREENSHOT = 'mobile_save_screenshot',

  MOBILE_TAP_ON_SCREEN_AT_COORDINATES = 'mobile_tap_on_screen_at_coordinates',
  MOBILE_DOUBLE_TAP_ON_SCREEN_AT_COORDINATES = 'mobile_double_tap_on_screen_at_coordinates',
  MOBILE_LONG_PRESS_ON_SCREEN_AT_COORDINATES = 'mobile_long_press_on_screen_at_coordinates',
  MOBILE_SWIPE_ON_SCREEN = 'mobile_swipe_on_screen',
  MOBILE_PRESS_BUTTON = 'mobile_press_button',

  MOBILE_TYPE_KEYS = 'mobile_type_keys',
  MOBILE_HIDE_KEYBOARD = 'mobile_hide_keyboard',

  MOBILE_LAUNCH_APP = 'mobile_launch_app',
  MOBILE_TERMINATE_APP = 'mobile_terminate_app',
  MOBILE_INSTALL_APP = 'mobile_install_app',
  MOBILE_UNINSTALL_APP = 'mobile_uninstall_app',
  MOBILE_CHECK_APP_IS_INSTALLED = 'mobile_check_app_is_installed',

  MOBILE_GET_CONTEXTS = 'mobile_get_contexts',
  MOBILE_SWITCH_TO_WEBVIEW = 'mobile_switch_to_webview',
  MOBILE_SWITCH_TO_NATIVE = 'mobile_switch_to_native',

  MOBILE_EXECUTE_SCRIPT = 'mobile_execute_script',
  MOBILE_CONFIGURE_DEEPLINKS = 'mobile_configure_deeplinks',
}
