// app.js — Entry point: tab routing, settings, initialization

import * as store from './store.js';
import { initLibrary, renderLibrary } from './library.js';
import { initTonight } from './tonight.js';
import { initConfirmDialog, openModal, closeModal, showToast } from './ui.js';

// === PWA standalone viewport fix (iOS 26+) ===
// Sets --app-height to the true viewport height so the flex layout
// works even when 100dvh lies in home-screen mode.
if (document.documentElement.classList.contains('standalone')) {
  const setAppHeight = () => {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', h + 'px');
  };
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
  }
}

// === Tab switching ===
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update tab content
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');

      // Re-render library when switching to it (picks up any changes)
      if (tab === 'library') renderLibrary();
    });
  });
}

// === Settings ===
function initSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsClose = document.getElementById('settings-close');
  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsSave = document.getElementById('settings-save');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  settingsBtn.addEventListener('click', () => {
    // Load current keys
    document.getElementById('rawg-key').value = store.getApiKey('rawg');
    document.getElementById('tmdb-key').value = store.getApiKey('tmdb');
    openModal('settings-overlay');
  });

  settingsClose.addEventListener('click', () => closeModal('settings-overlay'));
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal('settings-overlay');
  });

  settingsSave.addEventListener('click', () => {
    store.setApiKey('rawg', document.getElementById('rawg-key').value.trim());
    store.setApiKey('tmdb', document.getElementById('tmdb-key').value.trim());
    closeModal('settings-overlay');
    showToast('Settings saved');
  });

  // Export
  exportBtn.addEventListener('click', () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tonight-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported');
  });

  // Import
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importData(reader.result);
        renderLibrary();
        showToast('Backup restored');
      } catch {
        showToast('Invalid backup file');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });
}

// === Service Worker ===
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// === Init everything ===
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initConfirmDialog();
  initLibrary();
  initTonight();
  initSettings();
  registerSW();
});
