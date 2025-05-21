import { appState } from './state.js';

export function startTimerBar(timerBar, durationSec, onTimeout) {
  let timeLeft = durationSec;
  timerBar.style.width = '100%';
  let timer = setInterval(() => {
    timeLeft -= 0.1;
    timerBar.style.width = (Math.max(0, timeLeft/durationSec)*100)+"%";
    if (timeLeft <= 0) {
      clearInterval(timer);
      timerBar.style.width = '0%';
      if (onTimeout) onTimeout();
    }
  }, 100);
  return timer;
}

export function renderCoinSelectionPhase(onSelection) {
  // Pokaż sekcję wyboru monety
  document.getElementById('choose-section').style.display = '';
  document.getElementById('guess-result-main').innerHTML = '';
  document.getElementById('waiting-info-main').style.display = 'none';
  // Resetuj przyciski
  document.getElementById('guess-awers-main').classList.remove('selected-pending');
  document.getElementById('guess-rewers-main').classList.remove('selected-pending');
  document.getElementById('guess-awers-main').disabled = false;
  document.getElementById('guess-rewers-main').disabled = false;
  document.getElementById('guess-rewers-main').style.opacity = '1';
  document.getElementById('guess-awers-main').style.opacity = '1';
  // Timer
  const timerBar = document.getElementById('guess-timer-bar-main');
  let timer = startTimerBar(timerBar, 10, () => {
    document.getElementById('choose-section').style.display = 'none';
    onSelection(null); // timeout
  });
  // Obsługa kliknięć
  document.getElementById('guess-awers-main').onclick = () => {
    clearInterval(timer);
    document.getElementById('guess-awers-main').classList.add('selected-pending');
    document.getElementById('guess-rewers-main').classList.remove('selected-pending');
    document.getElementById('guess-awers-main').disabled = true;
    document.getElementById('guess-rewers-main').disabled = true;
    document.getElementById('guess-rewers-main').style.opacity = '0.5';
    document.getElementById('guess-awers-main').style.opacity = '1';
    document.getElementById('waiting-info-main').style.display = '';
    onSelection(0);
  };
  document.getElementById('guess-rewers-main').onclick = () => {
    clearInterval(timer);
    document.getElementById('guess-rewers-main').classList.add('selected-pending');
    document.getElementById('guess-awers-main').classList.remove('selected-pending');
    document.getElementById('guess-rewers-main').disabled = true;
    document.getElementById('guess-awers-main').disabled = true;
    document.getElementById('guess-awers-main').style.opacity = '0.5';
    document.getElementById('guess-rewers-main').style.opacity = '1';
    document.getElementById('waiting-info-main').style.display = '';
    onSelection(1);
  };
} 
