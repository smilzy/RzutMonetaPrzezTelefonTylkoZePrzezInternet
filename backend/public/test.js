// TEST: automatyczny test pełnego flow (mockuje backend, symuluje dwóch graczy)
function testFullFlow() {
  let commitments = {};
  let reveals = {};
  let guesses = {};
  let guess_times = {};
  let testRoomId = 'testroom';
  let player1 = 'test_player1';
  let player2 = 'test_player2';
  let bit1 = 0, bit2 = 1;
  let nonce1 = 'n1', nonce2 = 'n2';
  let commitment1 = 'c1', commitment2 = 'c2';
  window._realFetch = window.fetch;
  window.fetch = async (url, opts) => {
    if (url.endsWith('/commit')) {
      const data = JSON.parse(opts.body);
      commitments[data.player] = data.commitment;
      return {json: async () => ({ok: true})};
    }
    if (url.endsWith('/commitments')) {
      return {json: async () => ({commitments})};
    }
    if (url.endsWith('/reveal')) {
      const data = JSON.parse(opts.body);
      reveals[data.player] = {bit: data.bit, nonce: data.nonce};
      return {json: async () => ({ok: true})};
    }
    if (url.endsWith('/guess')) {
      const data = JSON.parse(opts.body);
      guesses[data.player] = data.guess;
      guess_times[data.player] = Date.now()/1000;
      return {json: async () => ({ok: true})};
    }
    if (url.endsWith('/guess_result')) {
      if (Object.keys(reveals).length === 2 && Object.keys(guesses).length === 2) {
        const bits = [reveals[player1].bit, reveals[player2].bit];
        const result = bits[0] ^ bits[1];
        return {
          status: 200,
          json: async () => ({result, meaning: result === 0 ? 'orzeł' : 'reszka', guesses})
        };
      } else {
        return {status: 202, json: async () => ({waiting: true, guesses})};
      }
    }
    return window._realFetch(url, opts);
  };
  roomId = testRoomId;
  playerId = player1;
  bit = bit1;
  nonce = nonce1;
  commitment = commitment1;
  document.getElementById('throw-coin-btn').click();
  setTimeout(() => {
    roomId = testRoomId;
    playerId = player2;
    bit = bit2;
    nonce = nonce2;
    commitment = commitment2;
    document.getElementById('throw-coin-btn').click();
    setTimeout(() => {
      roomId = testRoomId;
      playerId = player1;
      bit = bit1;
      nonce = nonce1;
      commitment = commitment1;
      document.getElementById('guess-awers-main').click();
      setTimeout(() => {
        roomId = testRoomId;
        playerId = player2;
        bit = bit2;
        nonce = nonce2;
        commitment = commitment2;
        document.getElementById('guess-rewers-main').click();
        setTimeout(() => {
          const resultDiv = document.getElementById('guess-result-main');
          if (resultDiv && resultDiv.innerHTML.includes('JESZCZE RAZ?')) {
            console.log('TEST OK: Wynik i przycisk JESZCZE RAZ? pojawiły się.');
          } else {
            console.error('TEST FAIL: Brak wyniku lub przycisku JESZCZE RAZ?');
          }
          window.fetch = window._realFetch;
        }, 1200);
      }, 1200);
    }, 1200);
  }, 1200);
}

// TEST: sprawdza, że po pojawieniu się wyniku widok wyboru jest ukryty
function testResultHidesChoice() {
  showGuessResultMain({guesses: {test1: 0, test2: 1}, result: 0, meaning: 'orzeł'});
  setTimeout(() => {
    let ok = true;
    if(document.getElementById('choose-row') && document.getElementById('choose-row').style.display !== 'none') ok = false;
    if(document.getElementById('choose-title') && document.getElementById('choose-title').style.display !== 'none') ok = false;
    var timerBar = document.querySelector('.timer-bar');
    if(timerBar && timerBar.style.display !== 'none') ok = false;
    if(ok) {
      console.log('TEST OK: Widok wyboru monety jest ukryty po wyniku.');
    } else {
      console.error('TEST FAIL: Widok wyboru monety NIE jest ukryty po wyniku!');
    }
  }, 500);
}

// TEST: sprawdza, czy obrazek cwaniaka jest widoczny po wejściu do pokoju
function testCwaniakVisibleOnStart() {
  if(document.getElementById('cwaniak-img')) document.getElementById('cwaniak-img').style.display = 'none';
  startGame();
  setTimeout(() => {
    const cwaniak = document.getElementById('cwaniak-img');
    if (cwaniak && cwaniak.style.display !== 'none') {
      console.log('TEST OK: Obrazek cwaniaka jest widoczny po wejściu do pokoju.');
    } else {
      console.error('TEST FAIL: Obrazek cwaniaka NIE jest widoczny po wejściu do pokoju!');
    }
  }, 300);
}

// 1. Po kliknięciu "JA JESTEM CWANIAK" wyświetla się oczekiwanie na drugiego cwaniaka
function testOczekiwanieNaDrugiegoCwaniaka() {
  startGame();
  document.getElementById('throw-coin-btn').click();
  setTimeout(() => {
    const oczekiwanie = document.getElementById('waiting-cwaniak');
    if (oczekiwanie && oczekiwanie.style.display !== 'none') {
      console.log('TEST OK: Oczekiwanie na drugiego cwaniaka widoczne po kliknięciu.');
    } else {
      console.error('TEST FAIL: Oczekiwanie na drugiego cwaniaka NIE jest widoczne po kliknięciu!');
    }
  }, 300);
}

// 2. Po 2 kliknięciach "JA JESTEM CWANIAK" pojawia się wybór monety, gif i timer
function testPrzejscieDoWyboru() {
  startGame();
  document.getElementById('throw-coin-btn').click();
  // Symulacja drugiego gracza
  setTimeout(() => {
    // Dodaj drugi commitment do mocka
    if(window.mockCommitments) window.mockCommitments();
    setTimeout(() => {
      const chooseSection = document.getElementById('choose-section');
      const coinGif = document.getElementById('coin-gif');
      const timerBar = document.querySelector('.timer-bar');
      if (chooseSection && chooseSection.style.display !== 'none' && coinGif && coinGif.style.display !== 'none' && timerBar && timerBar.style.display !== 'none') {
        console.log('TEST OK: Po 2 kliknięciach pojawia się wybór monety, gif i timer.');
      } else {
        console.error('TEST FAIL: Po 2 kliknięciach NIE pojawia się wybór monety/gif/timer!');
      }
    }, 600);
  }, 300);
}

// 3. Po wyborze monety timer się zatrzymuje, pojawia się oczekiwanie na drugiego cwaniaka
function testPoWyborzeCzekaNaDrugiego() {
  startGame();
  document.getElementById('throw-coin-btn').click();
  setTimeout(() => {
    if(window.mockCommitments) window.mockCommitments();
    setTimeout(() => {
      document.getElementById('guess-awers-main').click();
      setTimeout(() => {
        const waiting = document.getElementById('waiting-info-main');
        const timerBar = document.querySelector('.timer-bar');
        if (waiting && waiting.style.display !== 'none' && timerBar && timerBar.style.width !== '100%') {
          console.log('TEST OK: Po wyborze monety czeka na drugiego cwaniaka, timer zatrzymany.');
        } else {
          console.error('TEST FAIL: Po wyborze monety NIE czeka na drugiego cwaniaka lub timer nie zatrzymany!');
        }
      }, 600);
    }, 600);
  }, 300);
}

// 4. Po wyborze obu graczy pojawia się sekcja wyniku, znika wybór
function testWynikPoWyborzeObu() {
  startGame();
  document.getElementById('throw-coin-btn').click();
  setTimeout(() => {
    if(window.mockCommitments) window.mockCommitments();
    setTimeout(() => {
      document.getElementById('guess-awers-main').click();
      setTimeout(() => {
        if(window.mockGuessResult) window.mockGuessResult();
        setTimeout(() => {
          const resultDiv = document.getElementById('guess-result-main');
          const chooseRow = document.getElementById('choose-row');
          if (resultDiv && resultDiv.innerHTML && chooseRow && chooseRow.style.display === 'none') {
            console.log('TEST OK: Po wyborze obu graczy pojawia się wynik, znika wybór.');
          } else {
            console.error('TEST FAIL: Po wyborze obu graczy NIE pojawia się wynik lub nie znika wybór!');
          }
        }, 600);
      }, 600);
    }, 600);
  }, 300);
}

// 5. Po wygranej pojawia się napis "BRAWO" i obrazek wygranej
function testWygrana() {
  showGuessResultMain({guesses: {me: 0, other: 1}, result: 0, meaning: 'orzeł'});
  setTimeout(() => {
    const resultDiv = document.getElementById('guess-result-main');
    if (resultDiv && resultDiv.innerHTML.includes('BRAWO')) {
      console.log('TEST OK: Po wygranej pojawia się napis BRAWO.');
    } else {
      console.error('TEST FAIL: Po wygranej NIE pojawia się napis BRAWO!');
    }
  }, 300);
}

// 6. Po przegranej odpowiedni napis i obrazek
function testPrzegrana() {
  showGuessResultMain({guesses: {me: 1, other: 0}, result: 0, meaning: 'orzeł'});
  setTimeout(() => {
    const resultDiv = document.getElementById('guess-result-main');
    if (resultDiv && resultDiv.innerHTML.includes('nie żyjesz')) {
      console.log('TEST OK: Po przegranej pojawia się napis BOOM/nie żyjesz.');
    } else {
      console.error('TEST FAIL: Po przegranej NIE pojawia się napis BOOM/nie żyjesz!');
    }
  }, 300);
}

// 7. Kejs na upłynięcie czasu na decyzję u siebie
function testTimeoutUSiebie() {
  startGame();
  document.getElementById('throw-coin-btn').click();
  setTimeout(() => {
    if(window.mockCommitments) window.mockCommitments();
    setTimeout(() => {
      // Nie klikamy wyboru, czekamy na timeout
      setTimeout(() => {
        const resultDiv = document.getElementById('guess-result-main');
        if (resultDiv && resultDiv.innerHTML.includes('Coś poszło nie tak')) {
          console.log('TEST OK: Timeout u siebie wyświetla fallback.');
        } else {
          console.error('TEST FAIL: Timeout u siebie NIE wyświetla fallback!');
        }
      }, 12000);
    }, 600);
  }, 300);
}

// 8. Kejs na upłynięcie czasu na decyzję u przeciwnika
function testTimeoutUPrzeciwnika() {
  // Symulacja: klikamy wybór, ale nie symulujemy wyboru drugiego gracza
  startGame();
  document.getElementById('throw-coin-btn').click();
  setTimeout(() => {
    if(window.mockCommitments) window.mockCommitments();
    setTimeout(() => {
      document.getElementById('guess-awers-main').click();
      // Nie symulujemy wyboru drugiego gracza, czekamy na timeout
      setTimeout(() => {
        const resultDiv = document.getElementById('guess-result-main');
        if (resultDiv && resultDiv.innerHTML.includes('Coś poszło nie tak')) {
          console.log('TEST OK: Timeout u przeciwnika wyświetla fallback.');
        } else {
          console.error('TEST FAIL: Timeout u przeciwnika NIE wyświetla fallback!');
        }
      }, 12000);
    }, 600);
  }, 300);
}

window.onload = function() {
  document.getElementById('game-flow').style.display = 'none';
  // testCwaniakVisibleOnStart();
  // testResultHidesChoice();
  // testOczekiwanieNaDrugiegoCwaniaka();
  // testPrzejscieDoWyboru();
  // testPoWyborzeCzekaNaDrugiego();
  // testWynikPoWyborzeObu();
  // testWygrana();
  // testPrzegrana();
  // testTimeoutUSiebie();
  // testTimeoutUPrzeciwnika();
  // testFullFlow(); // odkomentuj, by przetestować pełny flow
}; 
