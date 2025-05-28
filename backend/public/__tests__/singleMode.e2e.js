// backend/public/__tests__/singleMode.e2e.js
// Cypress-style E2E test for single player mode

describe('Tryb Single Player – Gra Solo', () => {
  beforeEach(() => {
  it('Gracz przechodzi cały flow gry solo', () => {
    // 1. Kliknij przycisk "Gra solo"
    cy.get('#single-mode-btn').click();

    // 2. Powinien pojawić się przycisk "JA JESTEM CWANIAK"
    cy.get('#throw-coin-btn').should('be.visible').click();

    // 3. Powinien pojawić się wybór orzeł/reszka
    cy.get('#choose-section').should('be.visible');
    cy.get('#guess-awers-main').should('be.visible');
    cy.get('#guess-rewers-main').should('be.visible');

    // 4. Wybierz "Awers"
    cy.get('#guess-awers-main').click();

    // 5. Powinien pojawić się wynik (wygrana lub przegrana)
    cy.get('#guess-result-main').should('be.visible');
    cy.get('#guess-result-main').should('contain.text', 'WYGRAŁEŚ').or('contain.text', 'nie żyjesz');

    // 6. Powinien być przycisk "Jeszcze raz?"
    cy.get('#play-again-btn-main').should('be.visible').click();

    // 7. Flow zaczyna się od nowa (przycisk "JA JESTEM CWANIAK" widoczny)
    cy.get('#throw-coin-btn').should('be.visible');
  });
}); 
