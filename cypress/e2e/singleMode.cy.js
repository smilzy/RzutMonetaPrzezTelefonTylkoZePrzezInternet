describe('Single Player Coin Flip (no backend needed)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Wygrywasz lub przegrywasz w trybie solo i możesz zagrać ponownie', () => {
    // 1. Wejdź w tryb solo
    cy.get('#single-mode-btn').click();
    // Sekcja z ID pokoju powinna być ukryta
    cy.get('#room-info').should('not.be.visible');
    // 2. Kliknij "JA JESTEM CWANIAK"
    cy.get('#throw-coin-btn').should('be.visible').click();
    // Obrazek cwaniaka powinien zniknąć
    cy.get('#cwaniak-img').should('not.be.visible');
    // 3. Pojawia się wybór orzeł/reszka
    cy.get('#choose-section').should('be.visible');
    cy.get('#guess-awers-main').should('be.visible');
    cy.get('#guess-rewers-main').should('be.visible');
    // 4. Wybierz "Awers"
    cy.get('#guess-awers-main').click();
    // 5. Powinien pojawić się wynik (wygrana lub przegrana)
    cy.get('#guess-result-main').should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(
          text.includes('WYGRAŁEŚ') || text.includes('nie żyjesz')
        ).to.be.true;
      });
    // 6. Kliknij "Jeszcze raz?"
    cy.get('#play-again-btn-main').should('be.visible').click();
    // 7. Flow zaczyna się od nowa
    cy.get('#throw-coin-btn').should('be.visible');
  });
});
