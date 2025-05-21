import { appState } from '../state.js';
import { startPrimeGame, guessPrime, revealPrime, verifyPrime } from './primeApi.js';

export function renderPrimeMain() {
  document.getElementById('prime-start-btn').onclick = async () => {
    document.getElementById('prime-game-panel').style.display = 'none';
    document.getElementById('prime-game-panel').innerHTML = 'Generowanie liczb pierwszych...';
    const data = await startPrimeGame();
    appState.primeRoomId = data.room_id;
    appState.N = data.n;
    // Pokaż panel z N i przyciskiem do zgadywania
    document.getElementById('prime-game-panel').style.display = '';
    document.getElementById('prime-game-panel').innerHTML = `
      <div style="font-size:1.2em;margin-bottom:1em;">N = <b>${data.n}</b></div>
      <div style="margin-bottom:1em;">Zgadnij: p i q są ≡ <b>1</b> czy <b>3</b> (mod 4)?</div>
      <button id="prime-guess-1" class="big-btn" style="margin-right:1em;">1 (mod 4)</button>
      <button id="prime-guess-3" class="big-btn">3 (mod 4)</button>
      <div id="prime-guess-status" style="margin-top:1em;"></div>
      <div id="prime-reveal-panel" style="margin-top:2em;"></div>
    `;
    document.getElementById('prime-guess-1').onclick = () => submitPrimeGuess(1);
    document.getElementById('prime-guess-3').onclick = () => submitPrimeGuess(3);
  };
}

async function submitPrimeGuess(guess) {
  document.getElementById('prime-guess-status').textContent = 'Wysyłanie zgadywania...';
  const data = await guessPrime(appState.primeRoomId, guess);
  if(data.ok) {
    document.getElementById('prime-guess-status').textContent = 'Zgadywanie zapisane. Czekaj na ujawnienie p, q...';
    // Dodaj przycisk do ujawnienia (symulacja: gracz A)
    document.getElementById('prime-reveal-panel').innerHTML = `<button id="prime-reveal-btn" class="big-btn">Ujawnij p, q</button><div id="prime-reveal-status" style="margin-top:1em;"></div>`;
    document.getElementById('prime-reveal-btn').onclick = revealPrimePQ;
  } else {
    document.getElementById('prime-guess-status').textContent = data.error || 'Błąd';
  }
}

async function revealPrimePQ() {
  document.getElementById('prime-reveal-status').textContent = 'Ujawnianie...';
  const data = await revealPrime(appState.primeRoomId);
  if(data.p && data.q) {
    document.getElementById('prime-reveal-status').innerHTML = `p = <b>${data.p}</b><br>q = <b>${data.q}</b><br>modulo 4: <b>${data.mod}</b><br>Twój wybór: <b>${data.guess}</b><br><span style="color:${data.correct ? 'green' : 'red'};font-weight:bold;">${data.correct ? 'ZGADŁEŚ!' : 'NIE ZGADŁEŚ'}</span><br><button id="prime-verify-btn" class="big-btn" style="margin-top:1em;">Zweryfikuj liczby</button><div id="prime-verify-status" style="margin-top:1em;"></div>`;
    document.getElementById('prime-verify-btn').onclick = verifyPrimePQ;
  } else {
    document.getElementById('prime-reveal-status').textContent = data.error || 'Błąd';
  }
}

async function verifyPrimePQ() {
  document.getElementById('prime-verify-status').textContent = 'Weryfikacja...';
  const data = await verifyPrime(appState.primeRoomId);
  document.getElementById('prime-verify-status').innerHTML = `p pierwsza: <b>${data.is_p_prime ? 'TAK' : 'NIE'}</b><br>q pierwsza: <b>${data.is_q_prime ? 'TAK' : 'NIE'}</b><br>p*q = N: <b>${data.n_ok ? 'TAK' : 'NIE'}</b>`;
} 
