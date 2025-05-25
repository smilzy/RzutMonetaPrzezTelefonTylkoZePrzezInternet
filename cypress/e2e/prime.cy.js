/// <reference types="cypress" />

describe('Prime Number Game E2E (mocked backend)', () => {
  beforeEach(() => {
    cy.visit('/');
    // Mock fetch na window
    cy.window().then((win) => {
      const originalFetch = win.fetch;
      let state = {
        primes: {},
        setter: null,
        guess: null,
        revealed: false,
        result: null,
        reset() {
          this.primes = {};
          this.setter = null;
          this.guess = null;
          this.revealed = false;
          this.result = null;
        }
      };
      cy.stub(win, 'fetch').callsFake((url, opts) => {
        // Claim setter
        if (url.includes('/api/prime/') && url.endsWith('/claim_setter')) {
          const data = JSON.parse(opts.body);
          if (!state.setter) {
            state.setter = data.player_id;
            return Promise.resolve({json: () => Promise.resolve({is_setter: true})});
          } else {
            return Promise.resolve({json: () => Promise.resolve({is_setter: false})});
          }
        }
        // Set primes
        if (url.includes('/api/prime/') && url.endsWith('/set_primes')) {
          const data = JSON.parse(opts.body);
          state.primes = {p: data.p, q: data.q, n: data.p * data.q};
          return Promise.resolve({json: () => Promise.resolve({ok: true})});
        }
        // Generate primes
        if (url.endsWith('/api/prime/generate_primes')) {
          return Promise.resolve({json: () => Promise.resolve({p: 7, q: 11})});
        }
        // Status
        if (url.includes('/api/prime/') && url.endsWith('/status')) {
          return Promise.resolve({json: () => Promise.resolve({
            ...state.primes,
            p: state.primes.p,
            q: state.primes.q,
            n: state.primes.n,
            guess: state.guess,
            revealed: state.revealed,
            result: state.result
          })});
        }
        // Guess
        if (url.includes('/api/prime/') && url.endsWith('/guess')) {
          const data = JSON.parse(opts.body);
          state.guess = data.guess;
          return Promise.resolve({json: () => Promise.resolve({ok: true})});
        }
        // Reveal
        if (url.includes('/api/prime/') && url.endsWith('/reveal')) {
          state.revealed = true;
          // Załóżmy, że poprawna odpowiedź to 1 (mod 4) jeśli p i q są 1 mod 4
          state.result = (state.primes.p % 4 === 1 && state.primes.q % 4 === 1) ? false : true;
          return Promise.resolve({json: () => Promise.resolve({correct: !state.result})});
        }
        // Reveal (po zgadywaniu)
        if (url.includes('/api/prime/') && url.endsWith('/reveal')) {
          return Promise.resolve({json: () => Promise.resolve({correct: !state.result})});
        }
        // Default
        return originalFetch.apply(win, [url, opts]);
      });
    });
  });

  it('Pełny flow Prime + ponowne przejście po "Jeszcze raz"', () => {
    // Start gry w trybie Prime
    cy.get('#prime-mode-btn').click();
    cy.get('#create-room').click();
    cy.get('#throw-coin-btn').click();
    // Gracz zostaje setterem, generuje liczby
    cy.get('#prime-generate-btn').click();
    cy.get('#prime-p').should('have.value', '7');
    cy.get('#prime-q').should('have.value', '11');
    cy.get('#prime-submit-btn').click();
    // Drugi gracz zgaduje (symulacja)
    cy.window().then(win => {
      // Ustawiamy, że drugi gracz nie jest setterem
      win.appState.isPrimeSetter = false;
      win.appState.p = 7;
      win.appState.q = 11;
      win.appState.N = 77;
    });
    cy.get('#prime-guess-1').click();
    // Powinien pojawić się wynik (wygrana/przegrana)
    cy.get('#guess-result-main', {timeout: 5000}).should('exist');
    // Kliknij "Jeszcze raz"
    cy.contains('JESZCZE RAZ').click();
    // Powinien pojawić się ponownie flow Prime
    cy.get('#throw-coin-btn').should('be.visible');
    cy.get('#throw-coin-btn').click();
    cy.get('#prime-generate-btn').click();
    cy.get('#prime-p').should('have.value', '7');
    cy.get('#prime-q').should('have.value', '11');
    cy.get('#prime-submit-btn').click();
    cy.window().then(win => {
      win.appState.isPrimeSetter = false;
      win.appState.p = 7;
      win.appState.q = 11;
      win.appState.N = 77;
    });
    cy.get('#prime-guess-3').click();
    cy.get('#guess-result-main', {timeout: 5000}).should('exist');
  });
}); 
