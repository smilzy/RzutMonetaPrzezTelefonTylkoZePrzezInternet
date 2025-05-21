import { appState } from './state.js';

export function renderWaitingPhase(onReady) {
  // Pokaż loader i status oczekiwania
  document.getElementById('waiting-cwaniak').style.display = '';
  // Ukryj inne sekcje gry
  document.getElementById('choose-section').style.display = 'none';
  document.getElementById('guess-result-main').innerHTML = '';
  // Polling na backend czy są już 2 gracze
  let interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/${appState.roomId}/commitments`);
      const data = await res.json();
      if (Object.keys(data.commitments).length === 2) {
        clearInterval(interval);
        document.getElementById('waiting-cwaniak').style.display = 'none';
        if(document.getElementById('cwaniak-img')) document.getElementById('cwaniak-img').style.display = 'none';
        onReady();
      }
    } catch (e) {
      // Możesz dodać obsługę błędów
    }
  }, 1000);
} 
