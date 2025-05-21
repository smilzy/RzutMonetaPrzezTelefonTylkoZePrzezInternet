import { appState } from './state.js';
import { renderRoomView } from './roomView.js';

export function renderMainPage() {
  document.getElementById('room-setup').style.display = '';
  document.getElementById('game').classList.add('hidden');
  document.getElementById('game-flow').style.display = 'none';
  document.getElementById('room-id').value = '';
  document.getElementById('player-nick').value = '';
  document.getElementById('room-link').style.display = 'none';
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

export function onRoomJoin(roomId, playerNick) {
  appState.roomId = roomId;
  appState.playerId = playerNick && playerNick !== '' ? playerNick : 'cwaniak_' + Math.random().toString(36).slice(2, 8);
  renderRoomView();
} 
