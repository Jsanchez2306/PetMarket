describe('Login -> abrir dropdown -> Logout (flujo estable)', function () {
  it('login, espera token, asegura header, abre dropdown y hace logout', function (browser) {
    const BASE_URL = process.env.E2E_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3191/';
    const STEP = parseInt(process.env.E2E_STEP_PAUSE || '700', 10);
    const END_PAUSE = parseInt(process.env.E2E_END_PAUSE || '1200', 10);
    const BTN_OPEN_LOGIN = 'button[data-bs-target="#loginModal"]';
    const MODAL_LOGIN = '#loginModal';
    const FORM_LOGIN = '#formLogin';
    const INPUT_EMAIL = '#loginCorreo';
    const INPUT_PASS = '#loginPassword';
    const BTN_SUBMIT = '#formLogin button[type="submit"]';
    const USER_AREA = '#userArea';
    const AUTH_BUTTONS = '#authButtons';
    const DROPDOWN_BTN = '#userDropdownBtn';
    const DROPDOWN_MENU = '#userDropdownBtn + .dropdown-menu';
    const LOGOUT_BTN = '#logoutBtn';
    const MODAL_CONFIRM_LOGOUT = '#confirmarLogoutModal';
    const BTN_CONFIRM_LOGOUT = '#btnConfirmarLogout';
    const USERNAME = process.env.E2E_USER || 'sanchezbarrerajj@gmail.com';
    const PASSWORD = process.env.E2E_PASS || 'juan123';
    function waitForToken(browser, done, startedAt) {
      if (!startedAt) startedAt = Date.now();
      browser.execute(() => localStorage.getItem('token'), [], res => {
        if (res.value) {
          browser.saveScreenshot('tests_output/03-token-obtenido.png');
          return done();
        }
        if (Date.now() - startedAt > 15000) {
          browser.assert.fail('Token no apareció en localStorage (timeout 15s)');
          return done();
        }
        browser.pause(400);
        waitForToken(browser, done, startedAt);
      });
    }

    function openDropdown(browser, done, attempt = 1) {
      browser.click(DROPDOWN_BTN).pause(300)
        .getAttribute(DROPDOWN_MENU, 'class', r => {
          const opened = r && r.value && r.value.includes('show');
            if (opened) {
              browser.saveScreenshot('tests_output/06-dropdown-open.png');
              return done();
            }
            if (attempt >= 3) {
              browser.assert.fail('No se pudo abrir el dropdown tras 3 intentos.');
              return done();
            }
            browser.execute(function (btnSel) {
              const btn = document.querySelector(btnSel);
              if (!btn) return;
              btn.click();
              if (window.bootstrap && window.bootstrap.Dropdown) {
                const inst = window.bootstrap.Dropdown.getOrCreateInstance(btn);
                inst.show && inst.show();
              }
            }, [DROPDOWN_BTN], () => {
              browser.pause(450);
              openDropdown(browser, done, attempt + 1);
            });
        });
    }

    function ensureUserArea(browser, done, tried) {
      browser.waitForElementVisible(USER_AREA, { timeout: 6000, suppressNotFoundErrors: true }, res => {
        if (res.status === 0) {
          browser.saveScreenshot('tests_output/05-user-area.png');
          return done();
        }
        if (tried) {
          browser.assert.fail('No apareció #userArea tras recarga.');
          return done();
        }
        browser.url(BASE_URL)
          .waitForElementVisible('body', 8000)
          .pause(800)
          .perform((br, done2) => ensureUserArea(br, done2, true));
      });
    }

    browser
      .resizeWindow(1400, 900)

      .url(BASE_URL)
      .waitForElementVisible('body', 10000)
      .assert.titleContains('PetMarket')
      .pause(STEP)
      .saveScreenshot('tests_output/01-landing.png')

      .waitForElementVisible(BTN_OPEN_LOGIN, 8000)
      .pause(STEP)
      .click(BTN_OPEN_LOGIN)
      .waitForElementVisible(MODAL_LOGIN, 8000)
      .pause(STEP)
      .saveScreenshot('tests_output/02-modal-login.png')

      .waitForElementVisible(FORM_LOGIN, 8000)
      .setValue(INPUT_EMAIL, USERNAME)
      .pause(STEP)
      .setValue(INPUT_PASS, PASSWORD)
      .pause(STEP)
      .click(BTN_SUBMIT)
      .pause(300)
      .waitForElementNotVisible(MODAL_LOGIN, 8000, 'Modal login cerrado')
      .pause(400)
      .perform(waitForToken)

  
      .url(function (res) {
        console.log('DEBUG URL tras login (antes de recargar forzada):', res.value);
      })

      .url(BASE_URL)
      .waitForElementVisible('body', 8000)
      .pause(800)
      .saveScreenshot('tests_output/04-after-reload.png')


      .perform(ensureUserArea)


      .perform(openDropdown)
      .pause(STEP)


      .waitForElementVisible(LOGOUT_BTN, 4000)
      .pause(STEP)
      .click(LOGOUT_BTN)
      .pause(400)
      .waitForElementVisible(MODAL_CONFIRM_LOGOUT, 6000, 'Modal confirm logout visible')
      .saveScreenshot('tests_output/07-confirm-logout.png')
      .pause(STEP)
      .click(BTN_CONFIRM_LOGOUT)


      .waitForElementVisible(AUTH_BUTTONS, 8000, 'Botones públicos visibles')
      .waitForElementNotVisible(USER_AREA, 5000, 'Área usuario oculto tras logout')
      .pause(STEP)
      .saveScreenshot('tests_output/08-logged-out.png')

      .execute(() => localStorage.getItem('token'), [], function (res) {
        this.assert.ok(!res.value, 'Token eliminado tras logout');
      })

      .pause(END_PAUSE)
      .end();
  });
});