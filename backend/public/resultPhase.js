import { appState } from './state.js';

export function renderResultPhase(result, onRematch, guesses = null, playerId = null) {
  const resultDiv = document.getElementById('guess-result-main');
  let html = '';
  // Ustal wybór przeciwnika
  let opponentText = '';
  if (guesses && playerId) {
    const allPlayers = Object.keys(guesses);
    const opponentId = allPlayers.find(pid => pid !== playerId);
    const opponentGuess = opponentId ? guesses[opponentId] : undefined;
    if (opponentGuess === 0) opponentText = '<div style="margin-top:0.7em;font-size:1.1em;">Przeciwnik wybrał: <b>orzeł (awers)</b></div>';
    else if (opponentGuess === 1) opponentText = '<div style="margin-top:0.7em;font-size:1.1em;">Przeciwnik wybrał: <b>reszka (rewers)</b></div>';
    else opponentText = '<div style="margin-top:0.7em;font-size:1.1em;">Przeciwnik nie wybrał</div>';
  }
  if (result === 'timeout') {
    html = '<img src="/img/wyleciales.jpg" style="width:300px; margin-top:1em; border-radius:12px;">' +
           '<div style="margin-top:1em; font-size:1.5em; color:#b71c1c; font-weight:bold;">BARDZO SIĘ STARAŁEŚ, LECZ Z GRY WYLECIAŁEŚ</div>' + opponentText;
  } else if (result === 'win') {
    html = '<img src="https://i1.memy.pl/obrazki/a87d950287_masz_tu_piatke.jpg" style="width:220px; margin-top:1em; border-radius:12px;">' +
           '<div style="margin-top:1em; font-size:1.5em; color:#388e3c; font-weight:bold;">BRAWO! WYGRAŁEŚ IPHONA!</div>' + opponentText;
  } else {
    html = '<img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2o1d3J4d3M2MWVkdjkzMWE4NDZwZmF3MjM0aHoxZ3l4YTh3ZmVjaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QNuQ2a8DZUJU0QOHPd/giphy.gif" style="width:120px; margin-top:1em; border-radius:12px;">' +
           '<div style="margin-top:1em; font-size:1.5em; color:#b71c1c; font-weight:bold;">BOOM! nie żyjesz, hahahahaha</div>' + opponentText;
  }
  html += '<br><button id="play-again-btn-main" class="big-btn" style="margin-top:2em;">JESZCZE RAZ?</button>';
  resultDiv.innerHTML = html;
  resultDiv.style.display = '';
  document.getElementById('choose-section').style.display = 'none';
  document.getElementById('waiting-info-main').style.display = 'none';
  const btn = document.getElementById('play-again-btn-main');
  btn.onclick = () => {
    if (typeof onRematch === 'function') onRematch();
  };
} 
