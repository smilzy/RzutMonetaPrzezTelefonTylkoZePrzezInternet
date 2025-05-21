import * as api from './api.js';

export async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateCommitmentAndSend(roomId, playerId) {
  const bit = Math.random() < 0.5 ? 0 : 1;
  const nonce = Math.random().toString(36).slice(2, 10);
  const commitment = await sha256(bit + ':' + nonce);
  const res = await api.commit(roomId, playerId, commitment, playerId);
  return { bit, nonce, commitment, res };
}

export async function sendReveal(roomId, playerId, bit, nonce) {
  return api.reveal(roomId, playerId, bit, nonce);
}

export async function getResult(roomId) {
  return api.getGuessResult(roomId);
} 
