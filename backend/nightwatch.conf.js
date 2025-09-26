try { require('dotenv').config(); } catch (_) {}

module.exports = {
  src_folders: ['e2e'],
  output_folder: 'tests_output',

  test_settings: {
    default: {
      // Forzamos la URL correcta. Si quieres, puedes cambiarla con FRONTEND_URL o E2E_BASE_URL al ejecutar.
      launch_url: process.env.E2E_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3191/'
    },

    firefox: {
      // NO arrancamos geckodriver; nos conectamos a uno ya iniciado en 127.0.0.1:4446
      webdriver: {
        start_process: false,
        host: '127.0.0.1',
        port: 4446,
        default_path_prefix: ''
      },
      desiredCapabilities: {
        browserName: 'firefox',
        'moz:firefoxOptions': {
          args: [], // ventana visible
          binary: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
        }
      }
    }
  }
};

//     // Opcional: Chrome
//     chrome: {
//       webdriver: {
//         start_process: true,
//         server_path: require('chromedriver').path,
//         port: 9515
//       },
//       desiredCapabilities: {
//         browserName: 'chrome',
//         'goog:chromeOptions': {
//           args: [] // pon '--headless=new' si luego quieres CI sin UI
//         }
//       }
//     }
//   }
// };