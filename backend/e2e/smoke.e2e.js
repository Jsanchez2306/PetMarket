describe('Smoke E2E', function () {
  it('debería cargar la landing y mostrar el título', function (browser) {
    const baseUrl = browser.launchUrl || 'http://localhost:3191/';

    browser
      .url(baseUrl)
      .waitForElementVisible('body', 10000)
      .assert.titleContains('PetMarket')
      .pause(1000) // opcional para observar
      .end();
  });
});