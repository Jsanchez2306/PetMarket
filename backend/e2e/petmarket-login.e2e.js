describe('Login de PetMarket', function () {
  it('abre landing, abre login, inicia sesión, valida éxito y acepta modal', function (browser) {
    const BASE_URL =
      process.env.E2E_BASE_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3191/';

    const STEP_PAUSE = parseInt(process.env.E2E_STEP_PAUSE || '1200', 10);
    const END_PAUSE = parseInt(process.env.E2E_END_PAUSE || '2000', 10); 

    const BTN_OPEN_LOGIN = 'button[data-bs-target="#loginModal"]';
    const MODAL_LOGIN    = '#loginModal';
    const FORM_LOGIN     = '#formLogin';
    const INPUT_EMAIL    = '#loginCorreo';
    const INPUT_PASS     = '#loginPassword';
    const BTN_SUBMIT     = '#formLogin button[type="submit"]';

    const MODAL_SUCCESS  = '#loginExitosoModal';
    const BTN_SUCCESS_OK = '#loginExitosoModal .modal-footer .btn.btn-success'; 
    const MODAL_ERROR    = '#loginErrorModal';
    const MSG_ERROR      = '#loginErrorMensaje';

    const USERNAME = process.env.E2E_USER || 'sanchezbarrerajj@gmail.com';
    const PASSWORD = process.env.E2E_PASS || '123456';

    browser
      // Landing
      .url(BASE_URL)
      .waitForElementVisible('body', 10000)
      .assert.titleContains('PetMarket')
      .pause(STEP_PAUSE)

      // Abrir modal de login
      .waitForElementVisible(BTN_OPEN_LOGIN, 8000)
      .pause(STEP_PAUSE)
      .click(BTN_OPEN_LOGIN)
      .pause(STEP_PAUSE)
      .waitForElementVisible(MODAL_LOGIN, 8000)
      .pause(STEP_PAUSE)

      // Completar y enviar
      .waitForElementVisible(FORM_LOGIN, 8000)
      .pause(STEP_PAUSE)
      .setValue(INPUT_EMAIL, USERNAME)
      .pause(STEP_PAUSE)
      .setValue(INPUT_PASS, PASSWORD)
      .pause(STEP_PAUSE)
      .click(BTN_SUBMIT)
      .pause(STEP_PAUSE)

      // Esperar éxito o error
      .perform((browser, done) => {
        browser.waitForElementVisible(MODAL_SUCCESS, 8000, false, res => {
          if (res.status === 0) return done();
          browser.waitForElementVisible(MODAL_ERROR, 2000, false, errRes => {
            if (errRes.status === 0) {
              browser.getText(MSG_ERROR, txt => {
                browser.assert.fail(`Login falló. Mensaje: ${txt.value}`);
                done();
              });
            } else {
              browser.assert.fail('No apareció el modal de éxito ni el de error tras el login.');
              done();
            }
          });
        });
      })
      .pause(STEP_PAUSE)

      .waitForElementVisible(BTN_SUCCESS_OK, 5000)
      .pause(STEP_PAUSE)
      .click(BTN_SUCCESS_OK)
      .pause(STEP_PAUSE)
      .waitForElementNotVisible(MODAL_SUCCESS, 5000)
      .pause(STEP_PAUSE)

      .execute(() => localStorage.getItem('token'), [], function (res) {
        this.assert.ok(!!res.value, 'Token presente en localStorage tras login');
      })
      .pause(STEP_PAUSE)

      .pause(END_PAUSE)
      
      .end();
  });
});