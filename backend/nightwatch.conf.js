try { require('dotenv').config(); } catch (_) {}
const isWin = process.platform === 'win32';

module.exports = {
  src_folders: ['e2e'],
  output_folder: 'tests_output',

  test_settings: {
    default: {
      launch_url: process.env.E2E_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3191/'
    },

    firefox: {
      webdriver: {
        start_process: false,
        host: '127.0.0.1',
        port: 4446,
        default_path_prefix: ''
      },
      desiredCapabilities: {
        browserName: 'firefox',
        'moz:firefoxOptions': {
          args: process.env.HEADLESS === '1' ? ['-headless'] : [],
          ...(isWin ? { binary: 'C:\\\\Program Files\\\\Mozilla Firefox\\\\firefox.exe' } : {})
        }
      }
    }
  }
};