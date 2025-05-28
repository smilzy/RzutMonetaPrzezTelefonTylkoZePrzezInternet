import { appState } from './state.js';
import { renderWaitingPhase } from './waitingPhase.js';
import { renderCoinSelectionPhase } from './coinSelectionPhase.js';
import { renderResultPhase } from './resultPhase.js';
import * as api from './api.js';
import { startTimerBar } from './coinSelectionPhase.js';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function setupRoomIdCopy() {
  const roomInfo = document.getElementById('room-info');
  const roomIdGame = document.getElementById('room-id-game');
  const copyBtn = document.getElementById('copy-room-id');
  const tooltip = document.getElementById('copy-tooltip');
  function copyId(e) {
    e && e.stopPropagation && e.stopPropagation();
    navigator.clipboard.writeText(appState.roomId);
    roomInfo.classList.add('copied');
    tooltip.textContent = 'Skopiowano!';
    setTimeout(() => {
      roomInfo.classList.remove('copied');
      tooltip.textContent = 'Kliknij, aby skopiować';
    }, 1200);
  }
  roomInfo.onclick = copyId;
  copyBtn.onclick = copyId;
}

function resetRoomViewUI() {
  document.getElementById('choose-section').style.display = 'none';
  document.getElementById('waiting-cwaniak').style.display = 'none';
  document.getElementById('guess-result-main').innerHTML = '';
  document.getElementById('throw-coin-btn').style.display = '';
  if(document.getElementById('cwaniak-img')) document.getElementById('cwaniak-img').style.display = '';
}

function resetPrimeState() {
  appState.primeReady = false;
  appState.isPrimeSetter = false;
  appState.p = null;
  appState.q = null;
  appState.N = null;
  // Jeśli chcesz, możesz też zresetować primeRoomId, jeśli tworzysz nowy pokój:
  // appState.primeRoomId = null;
}

export function renderRoomView() {
  document.getElementById('room-setup').style.display = 'none';
  document.getElementById('game').classList.remove('hidden');
  document.getElementById('game-flow').style.display = '';
  document.getElementById('room-id-game').textContent = appState.roomId;
  document.getElementById('room-info').style.display = '';
  appState.bit = null;
  appState.nonce = null;
  appState.commitment = null;
  appState.revealed = false;
  if(document.getElementById('cwaniak-img')) document.getElementById('cwaniak-img').style.display = '';
  document.getElementById('choose-section').style.display = 'none';
  document.getElementById('coin-gif').style.display = '';
  document.getElementById('throw-coin-btn').style.display = '';
  document.getElementById('waiting-cwaniak').style.display = 'none';
  document.getElementById('guess-result-main').innerHTML = '';
  setupRoomIdCopy();

  // Tryb PRIME: inny flow
  if (appState.gameMode === 'prime') {
    const throwBtn = document.getElementById('throw-coin-btn');
    throwBtn.style.display = '';
    throwBtn.onclick = async () => {
      throwBtn.style.display = 'none';
      document.getElementById('waiting-cwaniak').style.display = '';
      appState.primeReady = true;
      // Zgłoś chęć bycia setterem (atomowo)
      const resSetter = await fetch(`/api/prime/${appState.primeRoomId}/claim_setter`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({player_id: appState.playerId})
      });
      const setterResp = await resSetter.json();
      if (setterResp.is_setter) {
        appState.isPrimeSetter = true;
        document.getElementById('waiting-cwaniak').style.display = 'none';
        document.getElementById('game-flow').innerHTML = `
          <div style="font-size:1.2em;margin-bottom:1em;">Podaj dwie liczby pierwsze lub wygeneruj automatycznie:</div>
          <input id="prime-p" class="big-input" placeholder="p (liczba pierwsza)">
          <input id="prime-q" class="big-input" placeholder="q (liczba pierwsza)">
          <button id="prime-generate-btn" class="big-btn">Wygeneruj automatycznie</button>
          <button id="prime-submit-btn" class="big-btn">Ustaw liczby</button>
          <div id="prime-gen-status" style="margin-top:1em;"></div>
        `;
        document.getElementById('prime-generate-btn').onclick = async () => {
          document.getElementById('prime-gen-status').textContent = 'Generowanie...';
          const res = await fetch('/api/prime/generate_primes', {method: 'POST'});
          const data = await res.json();
          document.getElementById('prime-p').value = data.p || '';
          document.getElementById('prime-q').value = data.q || '';
          document.getElementById('prime-gen-status').textContent = 'Wygenerowano!';
        };
        document.getElementById('prime-submit-btn').onclick = async () => {
          const p = parseInt(document.getElementById('prime-p').value);
          const q = parseInt(document.getElementById('prime-q').value);
          if (!p || !q) {
            document.getElementById('prime-gen-status').textContent = 'Podaj obie liczby pierwsze!';
            return;
          }
          await fetch(`/api/prime/${appState.primeRoomId}/set_primes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({p, q, setter_id: appState.playerId})
          });
          appState.p = p;
          appState.q = q;
          appState.N = p * q;
          showPrimeNAndModulo();
        };
        // NIE uruchamiaj pollingu dla settera
        return;
      }
      // Jeśli nie jestem setterem, czekaj na liczby (polling)
      appState.isPrimeSetter = false;
      document.getElementById('waiting-cwaniak').style.display = '';
      let polling = setInterval(async () => {
        const res = await fetch(`/api/prime/${appState.primeRoomId}/status`);
        const data = await res.json();
        if (data.p && data.q && data.n) {
          clearInterval(polling);
          appState.p = data.p;
          appState.q = data.q;
          appState.N = data.n;
          showPrimeNAndModulo();
        }
      }, 1200);
      function showPrimeNAndModulo() {
        document.getElementById('game-flow').innerHTML = `
          <div style="font-size:1.5em;margin-bottom:1em;">N = <b>${appState.N}</b></div>
          <div id="prime-choose-modulo" style="margin-top:2em;"></div>
          <div id="guess-result-main" class="guess-result"></div>
        `;
        if (!appState.isPrimeSetter) {
          document.getElementById('prime-choose-modulo').innerHTML = `
            <div class="timer-bar" style="width:70%;height:18px;background:#eee;border-radius:9px;margin:0 auto 1.2em;overflow:hidden;">
              <div class="timer-bar-inner" id="guess-timer-bar-main" style="height:100%;background:linear-gradient(90deg,#43a047,#fbc02d);width:100%;transition:width 0.2s linear;"></div>
            </div>
            <div style="font-size:1.2em;margin-bottom:1em;">
              Zgadnij: p i q są ≡ <b>1</b> czy <b>3</b> (mod 4)?<br>
              <span style='font-size:0.95em;color:#555;'>1 (mod 4) = orzeł, 3 (mod 4) = reszka</span>
            </div>
            <button id="prime-guess-1" class="big-btn" style="margin-right:1em;">1 (mod 4)</button>
            <button id="prime-guess-3" class="big-btn">3 (mod 4)</button>
            <div id="prime-guess-status" style="margin-top:1em;"></div>
          `;
          const timerBar = document.getElementById('guess-timer-bar-main');
          let timer = startTimerBar(timerBar, 10, () => {
            document.getElementById('prime-choose-modulo').innerHTML += '<div style="color:#b71c1c;font-weight:bold;">Czas minął!</div>';
            document.getElementById('prime-guess-1').disabled = true;
            document.getElementById('prime-guess-3').disabled = true;
          });
          document.getElementById('prime-guess-1').onclick = async () => {
            clearInterval(timer);
            document.getElementById('prime-guess-status').textContent = 'Wybrałeś 1 (mod 4)';
            document.getElementById('prime-guess-1').disabled = true;
            document.getElementById('prime-guess-3').disabled = true;
            try {
              const res = await fetch(`/api/prime/${appState.primeRoomId}/guess`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({guess: 1})
              });
              const data = await res.json();
              if (data.ok) {
                setTimeout(async () => {
                  const revealRes = await fetch(`/api/prime/${appState.primeRoomId}/reveal`, {method: 'POST'});
                  const revealData = await revealRes.json();
                  document.getElementById('prime-choose-modulo').innerHTML = '';
                  renderResultPhase(revealData.correct ? 'win' : 'lose', () => {
                    resetRoomViewUI();
                    resetPrimeState();
                    appState.gameMode = 'prime';
                    appState.primeRoomId = appState.roomId;
                    renderRoomView();
                  }, null, appState.playerId);
                }, 800);
              } else {
                document.getElementById('prime-guess-status').textContent = data.error || 'Błąd';
              }
            } catch (e) {
              document.getElementById('prime-guess-status').textContent = 'Błąd sieci';
            }
          };
          document.getElementById('prime-guess-3').onclick = async () => {
            clearInterval(timer);
            document.getElementById('prime-guess-status').textContent = 'Wybrałeś 3 (mod 4)';
            document.getElementById('prime-guess-1').disabled = true;
            document.getElementById('prime-guess-3').disabled = true;
            try {
              const res = await fetch(`/api/prime/${appState.primeRoomId}/guess`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({guess: 3})
              });
              const data = await res.json();
              if (data.ok) {
                setTimeout(async () => {
                  const revealRes = await fetch(`/api/prime/${appState.primeRoomId}/reveal`, {method: 'POST'});
                  const revealData = await revealRes.json();
                  document.getElementById('prime-choose-modulo').innerHTML = '';
                  renderResultPhase(revealData.correct ? 'win' : 'lose', () => {
                    resetRoomViewUI();
                    resetPrimeState();
                    appState.gameMode = 'prime';
                    appState.primeRoomId = appState.roomId;
                    renderRoomView();
                  }, null, appState.playerId);
                }, 800);
              } else {
                document.getElementById('prime-guess-status').textContent = data.error || 'Błąd';
              }
            } catch (e) {
              document.getElementById('prime-guess-status').textContent = 'Błąd sieci';
            }
          };
        } else {
          // Setter: po ustawieniu liczb czeka na zgadywanie i wynik
          let resultPolling = setInterval(async () => {
            const res = await fetch(`/api/prime/${appState.primeRoomId}/status`);
            const data = await res.json();
            if (data.guess && data.revealed) {
              clearInterval(resultPolling);
              document.getElementById('prime-choose-modulo').innerHTML = '';
              renderResultPhase(data.result ? 'lose' : 'win', () => {
                resetRoomViewUI();
                resetPrimeState();
                appState.gameMode = 'prime';
                appState.primeRoomId = appState.roomId;
                renderRoomView();
              }, null, appState.playerId);
            }
          }, 1200);
        }
      }
    };
    return;
  }

  // Przycisk "JA JESTEM CWANIAK" – po kliknięciu generuj commitment, wyślij do backendu, potem startuj fazę oczekiwania
  const throwBtn = document.getElementById('throw-coin-btn');
  throwBtn.style.display = '';
  throwBtn.onclick = async () => {
    throwBtn.style.display = 'none';
    document.getElementById('waiting-cwaniak').style.display = '';
    // Commitment phase: generuj bit, nonce, commitment i wyślij
    appState.bit = Math.random() < 0.5 ? 0 : 1;
    appState.nonce = Math.random().toString(36).slice(2, 10);
    appState.commitment = await sha256(appState.bit + ':' + appState.nonce);
    await api.commit(appState.roomId, appState.playerId, appState.commitment, appState.playerId);
    // Faza oczekiwania na drugiego gracza (commitmenty)
    renderWaitingPhase(() => {
      // Po obu commitmentach przechodzimy do wyboru monety
      renderCoinSelectionPhase(async (guessBit) => {
        if (guessBit === null) {
          renderResultPhase('timeout', () => {
            resetRoomViewUI();
            renderRoomView();
          }, {}, appState.playerId);
          return;
        }
        await api.reveal(appState.roomId, appState.playerId, appState.bit, appState.nonce);
        await api.guess(appState.roomId, appState.playerId, guessBit);
        let resultData = null;
        let lastError = null;
        for (let i = 0; i < 15; i++) {
          const res = await fetch(`/api/${appState.roomId}/guess_result`);
          if (res.status === 200) {
            resultData = await res.json();
            break;
          } else {
            try {
              const err = await res.json();
              if (err && err.error) lastError = err.error;
            } catch {}
          }
          await new Promise(r => setTimeout(r, 700));
        }
        // Jeśli po 30 próbach nadal jest error "Not enough reveals" – uznaj to za walkower
        if (!resultData && lastError === 'Not enough reveals') {
          renderResultPhase('win', () => {
            resetRoomViewUI();
            renderRoomView();
          }, {}, appState.playerId);
          return;
        }
        // Sprawdzamy, czy drugi gracz nie zdążył (brak guessa przeciwnika)
        if (!resultData) {
          renderResultPhase('timeout', () => {
            resetRoomViewUI();
            renderRoomView();
          }, {}, appState.playerId);
          return;
        }
        const myGuess = resultData.guesses[appState.playerId];
        // Szukamy ID przeciwnika
        const allPlayers = Object.keys(resultData.guesses);
        const opponentId = allPlayers.find(pid => pid !== appState.playerId);
        const opponentGuess = opponentId ? resultData.guesses[opponentId] : undefined;
        let result;
        if (myGuess === undefined) {
          result = 'timeout';
        } else if (opponentGuess === undefined) {
          // Przeciwnik nie zdążył – wygrana przez walkower
          result = 'win';
        } else if (parseInt(myGuess) === resultData.result) {
          result = 'win';
        } else {
          result = 'lose';
        }
        renderResultPhase(result, () => {
          resetRoomViewUI();
          renderRoomView();
        }, resultData.guesses, appState.playerId);
      });
    });
  };

  if (appState.gameMode === 'single') {
    document.getElementById('room-info').style.display = 'none';
    document.getElementById('throw-coin-btn').style.display = '';
    document.getElementById('throw-coin-btn').onclick = async () => {
      document.getElementById('throw-coin-btn').style.display = 'none';
      if(document.getElementById('cwaniak-img')) document.getElementById('cwaniak-img').style.display = 'none';
      renderCoinSelectionPhase(async (guessBit) => {
        if (guessBit === null) {
          renderResultPhase('timeout', () => {
            resetRoomViewUI();
            appState.gameMode = 'single';
            renderRoomView();
          });
          return;
        }
        const wynik = Math.random() < 0.5 ? 0 : 1;
        const result = (guessBit === wynik) ? 'win' : 'lose';
        renderResultPhase(result, () => {
          resetRoomViewUI();
          appState.gameMode = 'single';
          renderRoomView();
        });
      });
    };
    return;
  }
} 
