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

window.onload = () => {
  setupThemeToggle();
  renderMainPage();
}; 
