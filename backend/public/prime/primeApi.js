export async function startPrimeGame() {
  const res = await fetch('/api/prime/start', {method: 'POST'});
  return res.json();
}

export async function guessPrime(roomId, guess) {
  const res = await fetch(`/api/prime/${roomId}/guess`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({guess})
  });
  return res.json();
}

export async function revealPrime(roomId) {
  const res = await fetch(`/api/prime/${roomId}/reveal`, {method: 'POST'});
  return res.json();
}

export async function getPrimeStatus(roomId) {
  const res = await fetch(`/api/prime/${roomId}/status`);
  return res.json();
}

export async function verifyPrime(roomId) {
  const res = await fetch(`/api/prime/${roomId}/verify`);
  return res.json();
} 
