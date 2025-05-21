describe('Coin Flip Game E2E (mocked backend)', () => {
  beforeEach(() => {
    cy.visit('/');
    // Mock fetch na window
    cy.window().then((win) => {
      const originalFetch = win.fetch;
      let state = {
        commitments: {},
        reveals: {},
        guesses: {},
        guess_times: {},
        reset() {
          this.commitments = {};
          this.reveals = {};
          this.guesses = {};
          this.guess_times = {};
        }
      };
      cy.stub(win, 'fetch').callsFake((url, opts) => {
        // Commitment
        if (url.endsWith('/commit')) {
          const data = JSON.parse(opts.body);
          state.commitments[data.player] = data.commitment;
          return Promise.resolve({json: () => Promise.resolve({ok: true})});
        }
        // Commitments
        if (url.endsWith('/commitments')) {
          return Promise.resolve({json: () => Promise.resolve({commitments: state.commitments})});
        }
        // Reveal
        if (url.endsWith('/reveal')) {
          const data = JSON.parse(opts.body);
          state.reveals[data.player] = {bit: data.bit, nonce: data.nonce};
          return Promise.resolve({json: () => Promise.resolve({ok: true})});
        }
        // Reveals
        if (url.endsWith('/reveals')) {
          return Promise.resolve({json: () => Promise.resolve({reveals: state.reveals})});
        }
        // Guess
        if (url.endsWith('/guess')) {
          const data = JSON.parse(opts.body);
          state.guesses[data.player] = data.guess;
          state.guess_times[data.player] = Date.now()/1000;
          return Promise.resolve({json: () => Promise.resolve({ok: true})});
        }
        // Guesses
        if (url.endsWith('/guesses')) {
          return Promise.resolve({json: () => Promise.resolve({guesses: state.guesses})});
        }
        // Guess result
        if (url.endsWith('/guess_result')) {
          if (Object.keys(state.reveals).length === 2 && Object.keys(state.guesses).length === 2) {
            const bits = Object.values(state.reveals).map(r => Number(r.bit));
            const result = bits[0] ^ bits[1];
            return Promise.resolve({
              status: 200,
              json: () => Promise.resolve({result, meaning: result === 0 ? 'orzeł' : 'reszka', guesses: state.guesses})
            });
          } else {
            return Promise.resolve({status: 202, json: () => Promise.resolve({waiting: true, guesses: state.guesses})});
          }
        }
        // Reset
        if (url.endsWith('/reset')) {
          state.reset();
          return Promise.resolve({json: () => Promise.resolve({ok: true})});
        }
        // Default
        return originalFetch.apply(win, [url, opts]);
      });
    });
  });

  it('Wygrywasz grę', () => {
    cy.get('#create-room').click();
    cy.get('#throw-coin-btn').click();
    cy.get('#waiting-cwaniak').should('be.visible');
    // Symulacja drugiego gracza (commitment)
    cy.window().then(win => {
      win.fetch('/api/testroom/commit', {method: 'POST', body: JSON.stringify({player: 'B', commitment: 'c2'})});
    });
    cy.get('#choose-section').should('be.visible');
    cy.get('#guess-awers-main').click();
    // Symulacja reveal i guess drugiego gracza
    cy.window().then(win => {
      win.fetch('/api/testroom/reveal', {method: 'POST', body: JSON.stringify({player: 'B', bit: 0, nonce: 'n2'})});
      win.fetch('/api/testroom/guess', {method: 'POST', body: JSON.stringify({player: 'B', guess: 0})});
    });
    cy.get('#guess-result-main', {timeout: 5000}).should('contain', 'nie żyjesz');
  });

  it('Przegrywasz grę', () => {
    cy.get('#create-room').click();
    cy.get('#throw-coin-btn').click();
    cy.get('#waiting-cwaniak').should('be.visible');
    // Symulacja drugiego gracza (commitment)
    cy.window().then(win => {
      win.fetch('/api/testroom/commit', {method: 'POST', body: JSON.stringify({player: 'B', commitment: 'c2'})});
    });
    cy.get('#choose-section').should('be.visible');
    cy.get('#guess-awers-main').click();
    // Symulacja reveal i guess drugiego gracza (przegrana)
    cy.window().then(win => {
      win.fetch('/api/testroom/reveal', {method: 'POST', body: JSON.stringify({player: 'B', bit: 1, nonce: 'n2'})});
      win.fetch('/api/testroom/guess', {method: 'POST', body: JSON.stringify({player: 'B', guess: 1})});
    });
    cy.get('#guess-result-main', {timeout: 5000}).should('contain', 'BRAWO');
  });

  it('Timeout – nie udzielasz odpowiedzi w czasie', () => {
    cy.get('#create-room').click();
    cy.get('#throw-coin-btn').click();
    cy.get('#waiting-cwaniak').should('be.visible');
    // Symulacja drugiego gracza (commitment)
    cy.window().then(win => {
      win.fetch('/api/testroom/commit', {method: 'POST', body: JSON.stringify({player: 'B', commitment: 'c2'})});
    });
    cy.get('#choose-section').should('be.visible');
    // NIE klikamy żadnego wyboru, czekamy na timeout
    cy.wait(16000);
    cy.get('#guess-result-main').should('contain', 'BOOM! Nie żyjesz');
  });
}); 
