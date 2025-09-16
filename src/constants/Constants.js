// App Configuration Constants
export const APP_CONFIG = {
  // Bluetooth Configuration
  BLUETOOTH: {
    // MAC_ADDRESS: '10:22:33:3A:E7:3B', //
    // MAC_ADDRESS: '66:22:32:D6:D1:FB', // PT-210_765C
    // MAC_ADDRESS: '10:22:33:8F:47:OD', // Գևորգ Ղազարյան PT-210_470D
    // MAC_ADDRESS: '10:22:33:31:38:B0', //  Հովհաննես Հովհաննիսյան PT-210_470D
    MAC_ADDRESS: '10:22:33:50:59:09', //  Արմեն Հովհաննիսյան PT-210_UB

    CONNECTION_TIMEOUT: 10000, // 10 seconds
    SCAN_DURATION: 5000, // 5 seconds
    CONNECTION_CHECK_INTERVAL: 50000, // Check connection every 10 seconds
    AUTO_RECONNECT: true, // Enable automatic reconnection
    MAX_RECONNECT_ATTEMPTS: 3, // Maximum reconnection attempts
  },

  // API Configuration
  API: {
    BASE_URL: 'https://dapi.intbilling.org/api',
    TOKEN: '9F7C1B92D8A44F4BB9E6BDE21A7F68A1C3D4EAB8F9F60D3A82B4C78E7F23C9AB',
    ENDPOINTS: {
      USERS: '/users',
      DISTRICTS: '/districts',
      AREAS: '/areas',
      STREETS: '/streets',
      USER: '/user',
    },
    TIMEOUT: 15000, // 15 seconds
  },

  // Printing Configuration
  PRINTING: {
    // Image settings
    IMAGE: {
      WIDTH: 384, // Full thermal printer width
      QUALITY: 0.1, // Low quality for speed
      FORMAT: 'png',
    },

    // ESC/POS settings
    ESCPOS: {
      CHUNK_SIZE: 200, // BLE transmission chunk size
      CHUNK_SIZE_SAFE: 20, // Safe fallback chunk size
      TRANSMISSION_DELAY: 0, // No delay for maximum speed
      SAFE_TRANSMISSION_DELAY: 10, // Safe fallback delay
    },

    // Text printing settings
    TEXT: {
      FONT_SIZE_NORMAL: 0x00,
      FONT_SIZE_DOUBLE: 0x11,
      ENCODING: 'UTF-8',
    },
  },

  // UI Configuration
  UI: {
    // Colors
    COLORS: {
      PRIMARY: '#F9AA33',
      BACKGROUND: '#344955',
      SUCCESS: '#47ff82',
      ERROR: '#ff0512',
      WHITE: '#FFFFFF',
      BLACK: '#000000',
      MODAL_OVERLAY: 'rgba(0, 0, 0, 0.5)',
      TRANSPARENT: 'transparent',
    },

    // Spacing
    SPACING: {
      XS: 5,
      SM: 10,
      MD: 15,
      LG: 20,
      XL: 40,
    },

    // Font sizes
    FONT_SIZES: {
      SMALL: 10,
      MEDIUM: 14,
      MEDIUM_Label: 20,
      MEDIUM_Label2: 22,

      LARGE: 24,
      XL: 24,
      XXL: 35,
    },

    // Dimensions
    DIMENSIONS: {
      BUTTON_HEIGHT: 50,
      INPUT_HEIGHT: 45,
      HEADER_HEIGHT: 80,
      CONNECTION_INDICATOR_SIZE: 10,
    },
  },

  // Default Values
  DEFAULTS: {
    COMPANY_NAME: 'FNET Telecom',
    SEPARATOR: '================================',
    ARMENIAN_MONTHS: [
      'Հունվար', // January
      'Փետրվար', // February
      'Մարտ', // March
      'Ապրիլ', // April
      'Մայիս', // May
      'Հունիս', // June
      'Հուլիս', // July
      'Օգոստոս', // August
      'Սեպտեմբեր', // September
      'Հոկտեմբեր', // October
      'Նոյեմբեր', // November
      'Դեկտեմբեր', // December
    ],
  },

  // App Metadata
  APP: {
    NAME: 'Thermal Printer App',
    VERSION: '1.0.0',
    AUTHOR: 'Development Team',
  },

  // Performance Settings
  PERFORMANCE: {
    CAPTURE_TIMEOUT: 1000, // ViewShot capture delay
    DEBOUNCE_DELAY: 300, // Input debounce
    ANIMATION_DURATION: 250,
  },

  // Error Messages
  ERRORS: {
    BLUETOOTH: {
      NO_DEVICE: 'Bluetooth սարքը չի գտնվել',
      CONNECTION_FAILED: 'Տպիչի հետ միացումը անհաջող է',
      NOT_CONNECTED: 'Տպիչը պատրաստ չէ կամ միացված չէ',
      NO_CHARACTERISTIC: 'Գրելի հատկանիշ չի գտնվել',
    },
    API: {
      NETWORK_ERROR: 'Ցանցի սխալ տեղի ունեցավ',
      INVALID_RESPONSE: 'Սերվերից անվավեր պատասխան',
      MISSING_MOBILE: 'Խնդրում ենք մուտքագրել բջջային համարը',
      FETCH_FAILED: 'Օգտատիրոջ տվյալների ստացումը անհաջող է',
    },
    PRINTING: {
      CONVERSION_FAILED: 'ESC/POS փոխարկումը անհաջող է',
      PRINT_FAILED: 'Տպումը անհաջող է',
      NO_DATA: 'Տպելու տվյալներ չկան',
    },
  },

  // Success Messages
  SUCCESS: {
    BLUETOOTH_CONNECTED: 'Bluetooth-ը հաջողությամբ միացվեց',
    PRINT_SUCCESS: 'Տպումը հաջողությամբ ավարտվեց',
    TEXT_PRINT_SUCCESS: 'Տեքստը մաքսիմալ արագությամբ տպվեց!',
    IMAGE_PRINT_SUCCESS: 'Նկարը հաջողությամբ տպվեց!',
  },
};

// Export individual sections for convenience
export const BLUETOOTH_CONFIG = APP_CONFIG.BLUETOOTH;
export const API_CONFIG = APP_CONFIG.API;
export const PRINTING_CONFIG = APP_CONFIG.PRINTING;
export const UI_CONFIG = APP_CONFIG.UI;
export const DEFAULTS = APP_CONFIG.DEFAULTS;
export const ERRORS = APP_CONFIG.ERRORS;
export const SUCCESS_MESSAGES = APP_CONFIG.SUCCESS;

// Export commonly used values
export const MAC_ADDRESS = APP_CONFIG.BLUETOOTH.MAC_ADDRESS;
export const API_TOKEN = APP_CONFIG.API.TOKEN;
export const COLORS = APP_CONFIG.UI.COLORS;
export const SPACING = APP_CONFIG.UI.SPACING;
export const FONT_SIZES = APP_CONFIG.UI.FONT_SIZES;

export default APP_CONFIG;
