export async function createRoom() {
  const res = await fetch('/api/create_room', {method: 'POST'});
  return res.json();
}

export async function commit(roomId, player, commitment, nick) {
  const res = await fetch(`/api/${roomId}/commit`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({player, commitment, nick})
  });
  return res.json();
}

export async function getCommitments(roomId) {
  const res = await fetch(`/api/${roomId}/commitments`);
  return res.json();
}

export async function reveal(roomId, player, bit, nonce) {
  const res = await fetch(`/api/${roomId}/reveal`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({player, bit, nonce})
  });
  return res.json();
}

export async function getReveals(roomId) {
  const res = await fetch(`/api/${roomId}/reveals`);
  return res.json();
}

export async function guess(roomId, player, guessValue) {
  const res = await fetch(`/api/${roomId}/guess`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({player, guess: guessValue})
  });
  return res.json();
}

export async function getGuessResult(roomId) {
  const res = await fetch(`/api/${roomId}/guess_result`);
  return res.json();
}

export async function resetRoom(roomId) {
  const res = await fetch(`/api/${roomId}/reset`, {method: 'POST'});
  return res.json();
} 
