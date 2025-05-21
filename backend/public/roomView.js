import { appState } from './state.js';
import { renderWaitingPhase } from './waitingPhase.js';
import { renderCoinSelectionPhase } from './coinSelectionPhase.js';
import { renderResultPhase } from './resultPhase.js';
import * as api from './api.js';

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
  setupRoomIdCopy();

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
            api.resetRoom(appState.roomId).then(() => renderRoomView());
          });
          return;
        }
        await api.reveal(appState.roomId, appState.playerId, appState.bit, appState.nonce);
        await api.guess(appState.roomId, appState.playerId, guessBit);
        let resultData = null;
        for (let i = 0; i < 30; i++) {
          const res = await fetch(`/api/${appState.roomId}/guess_result`);
          if (res.status === 200) {
            resultData = await res.json();
            break;
          }
          await new Promise(r => setTimeout(r, 700));
        }
        if (!resultData) {
          renderResultPhase('timeout', () => {
            api.resetRoom(appState.roomId).then(() => renderRoomView());
          });
          return;
        }
        const myGuess = resultData.guesses[appState.playerId];
        let result;
        if (myGuess === undefined) {
          result = 'timeout';
        } else if (parseInt(myGuess) === resultData.result) {
          result = 'win';
        } else {
          result = 'lose';
        }
        renderResultPhase(result, () => {
          api.resetRoom(appState.roomId).then(() => renderRoomView());
        });
      });
    });
  };
} 
