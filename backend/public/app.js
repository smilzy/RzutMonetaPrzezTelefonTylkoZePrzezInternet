import { renderMainPage } from './mainPage.js';
import { appState } from './state.js';
import * as api from './api.js';
import { generateCommitmentAndSend, sendReveal, getResult } from './gameLogic.js';

function setTheme(dark) {
  document.body.classList.toggle('dark-mode', dark);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

function setupThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.onclick = () => {
    setTheme(!document.body.classList.contains('dark-mode'));
  };
  // Ustaw motyw z localStorage lub systemowy
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
  } else {
    setTheme(false);
  }
}

function updateDebugInfoFields() {
  document.getElementById('debug-commitment').textContent = appState.commitment || '-';
  document.getElementById('debug-bit').textContent = appState.bit !== null && appState.bit !== undefined ? appState.bit : '-';
  document.getElementById('debug-nonce').textContent = appState.nonce || '-';
}

function setupDebugModal() {
  const openBtn = document.getElementById('open-debug-modal');
  const modal = document.getElementById('debug-modal');
  const closeBtn = document.getElementById('close-debug-modal');
  if (!openBtn || !modal || !closeBtn) return;
  const commitBtn = document.getElementById('commit-btn');
  const revealBtn = document.getElementById('reveal-btn');
  const checkResultBtn = document.getElementById('check-result');
  const commitStatus = document.getElementById('commitment-status');
  const revealStatus = document.getElementById('reveal-status');
  const resultStatus = document.getElementById('result-status');

  function resetModalFlow() {
    if (commitBtn) commitBtn.classList.remove('hidden');
    if (revealBtn) revealBtn.classList.add('hidden');
    if (checkResultBtn) checkResultBtn.classList.add('hidden');
    if (commitStatus) commitStatus.textContent = '';
    if (revealStatus) revealStatus.textContent = '';
    if (resultStatus) resultStatus.textContent = '';
  }

  openBtn.onclick = () => {
    updateDebugInfoFields();
    modal.style.display = '';
    resetModalFlow();
  };
  closeBtn.onclick = () => {
    modal.style.display = 'none';
    resetModalFlow();
  };
  // Zamknięcie po kliknięciu poza modalem
  window.addEventListener('click', (e) => {
    if (modal.style.display !== 'none' && e.target === modal) {
      modal.style.display = 'none';
      resetModalFlow();
    }
  });

  if (commitBtn && commitStatus) {
    commitBtn.onclick = async () => {
      // Generuj i wyślij commitment przez gameLogic.js
      commitStatus.textContent = 'Generowanie i wysyłanie...';
      try {
        const { bit, nonce, commitment, res } = await generateCommitmentAndSend(appState.roomId, appState.playerId);
        appState.bit = bit;
        appState.nonce = nonce;
        appState.commitment = commitment;
        updateDebugInfoFields();
        commitStatus.textContent = res && res.ok ? 'Commitment wysłany!' : JSON.stringify(res);
        if (revealBtn) revealBtn.classList.remove('hidden');
      } catch (e) {
        commitStatus.textContent = 'Błąd: ' + (e.message || e);
      }
    };
  }
  if (revealBtn && revealStatus) {
    revealBtn.onclick = async () => {
      revealStatus.textContent = 'Wysyłanie...';
      try {
        const res = await sendReveal(appState.roomId, appState.playerId, appState.bit, appState.nonce);
        revealStatus.textContent = res && res.ok ? 'Reveal wysłany!' : JSON.stringify(res);
        if (checkResultBtn) checkResultBtn.classList.remove('hidden');
        updateDebugInfoFields();
        let resultInfo = '';
        try {
          const resultRes = await getResult(appState.roomId);
          if (resultRes && resultRes.result !== undefined) {
            resultInfo = `\nWynik: ${resultRes.result} (${resultRes.meaning || ''})`;
          }
        } catch {}
        if (resultInfo) revealStatus.textContent += resultInfo;
      } catch (e) {
        revealStatus.textContent = 'Błąd: ' + (e.message || e);
      }
    };
  }
  if (checkResultBtn && resultStatus) {
    checkResultBtn.onclick = async () => {
      resultStatus.textContent = 'Pobieranie...';
      try {
        const res = await getResult(appState.roomId);
        resultStatus.textContent = res && res.result !== undefined ? `Wynik: ${res.result} (${res.meaning || ''})` : JSON.stringify(res);
      } catch (e) {
        resultStatus.textContent = 'Błąd: ' + (e.message || e);
      }
    };
  }
}

window.onload = () => {
  setupThemeToggle();
  setupDebugModal();
  renderMainPage();
}; 
