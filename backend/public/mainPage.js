import { appState } from './state.js';
import { renderRoomView } from './roomView.js';
// Dodaj import Prime Number Game (dynamicznie)
let primeModule = null;

export function renderMainPage() {
  document.getElementById('room-setup').style.display = '';
  document.getElementById('prime-setup').style.display = 'none';
  document.getElementById('game').classList.add('hidden');
  document.getElementById('game-flow').style.display = 'none';
  document.getElementById('room-id').value = '';
  document.getElementById('player-nick').value = '';
  document.getElementById('room-link').style.display = 'none';

  // Obsługa przycisków wyboru trybu gry w prawym górnym rogu
  const classicBtn = document.getElementById('classic-mode-btn');
  const primeBtn = document.getElementById('prime-mode-btn');
  if (classicBtn) classicBtn.onclick = () => {
    // Przywróć pełny widok strony głównej
    document.getElementById('room-setup').style.display = '';
    document.getElementById('prime-setup').style.display = 'none';
    if (document.getElementById('game')) document.getElementById('game').classList.add('hidden');
    if (document.getElementById('game-flow')) document.getElementById('game-flow').style.display = 'none';
    if (document.getElementById('guess-result-main')) document.getElementById('guess-result-main').innerHTML = '';
    if (document.getElementById('room-link')) document.getElementById('room-link').style.display = 'none';
    if (document.getElementById('room-id')) document.getElementById('room-id').value = '';
    if (document.getElementById('player-nick')) document.getElementById('player-nick').value = '';
  };
  if (primeBtn) primeBtn.onclick = async () => {
    // Utwórz pokój prime przez API
    const res = await fetch('/api/prime/start', {method: 'POST'});
    const data = await res.json();
    const playerNick = document.getElementById('player-nick').value.trim();
    onRoomJoin(data.room_id, playerNick);
  };

  document.getElementById('create-room').onclick = async () => {
    const res = await fetch('/api/create_room', {method: 'POST'});
    const data = await res.json();
    const roomId = data.room_id;
    document.getElementById('room-link').innerHTML = `ID pokoju: <b>${roomId}</b> (przekaż koledze)`;
    document.getElementById('room-link').style.display = 'block';
    const playerNick = document.getElementById('player-nick').value.trim();
    onRoomJoin(roomId, playerNick);
  };
  document.getElementById('join-room').onclick = () => {
    const roomId = document.getElementById('room-id').value.trim();
    if(roomId) {
      const playerNick = document.getElementById('player-nick').value.trim();
      onRoomJoin(roomId, playerNick);
    }
  };
}

export async function onRoomJoin(roomId, playerNick) {
  appState.roomId = roomId;
  appState.playerId = playerNick && playerNick !== '' ? playerNick : 'cwaniak_' + Math.random().toString(36).slice(2, 8);
  // Sprawdź, czy to pokój prime
  try {
    const res = await fetch(`/api/prime/${roomId}/status`);
    if (res.ok) {
      appState.gameMode = 'prime';
      appState.primeRoomId = roomId;
    } else {
      appState.gameMode = 'classic';
      appState.primeRoomId = null;
    }
  } catch {
    appState.gameMode = 'classic';
    appState.primeRoomId = null;
  }
  renderRoomView();
} 
