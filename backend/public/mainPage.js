import { appState } from './state.js';
import { renderRoomView } from './roomView.js';
import * as api from './api.js';
// Dodaj import Prime Number Game (dynamicznie)
let primeModule = null;

export function renderMainPage() {
  document.getElementById('room-setup').style.display = '';
  document.getElementById('prime-setup').style.display = 'none';
  document.getElementById('game').classList.add('hidden');
  document.getElementById('game-flow').style.display = 'none';
  document.getElementById('room-id').value = '';

  // Obsługa przycisków wyboru trybu gry w prawym górnym rogu
  const classicBtn = document.getElementById('classic-mode-btn');
  const primeBtn = document.getElementById('prime-mode-btn');
  const singleBtn = document.getElementById('single-mode-btn');
  if (classicBtn) classicBtn.onclick = async () => {
    // Utwórz pokój klasyczny przez API
    const data = await api.createRoom();
    const roomId = data.room_id;
    const playerNick = document.getElementById('player-nick').value.trim();
    onRoomJoin(roomId, playerNick);
  };
  if (primeBtn) primeBtn.onclick = async () => {
    // Utwórz pokój prime przez API
    const res = await fetch('/api/prime/start', {method: 'POST'});
    const data = await res.json();
    const playerNick = document.getElementById('player-nick').value.trim();
    onRoomJoin(data.room_id, playerNick);
  };
  if (singleBtn) singleBtn.onclick = () => {
    appState.gameMode = 'single';
    appState.roomId = 'SOLO_' + Math.random().toString(36).slice(2, 8);
    appState.playerId = 'cwaniak_' + Math.random().toString(36).slice(2, 8);
    renderRoomView();
  };

  document.getElementById('create-room').onclick = async () => {
    const data = await api.createRoom();
    const roomId = data.room_id;
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
