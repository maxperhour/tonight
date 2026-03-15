// ui.js — Shared UI utilities (toasts, modals, confirm dialogs)

// === Toast ===
let toastTimer = null;

export function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
}

// === Modal helpers ===
export function openModal(overlayId) {
  document.getElementById(overlayId).hidden = false;
  document.body.style.overflow = 'hidden';
}

export function closeModal(overlayId) {
  document.getElementById(overlayId).hidden = true;
  document.body.style.overflow = '';
}

// === Confirm dialog ===
let confirmResolve = null;

export function confirm(message) {
  return new Promise(resolve => {
    confirmResolve = resolve;
    document.getElementById('confirm-text').textContent = message;
    openModal('confirm-overlay');
  });
}

export function initConfirmDialog() {
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    closeModal('confirm-overlay');
    if (confirmResolve) confirmResolve(false);
  });
  document.getElementById('confirm-ok').addEventListener('click', () => {
    closeModal('confirm-overlay');
    if (confirmResolve) confirmResolve(true);
  });
  // Close on backdrop tap
  document.getElementById('confirm-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeModal('confirm-overlay');
      if (confirmResolve) confirmResolve(false);
    }
  });
}

// === Placeholder SVG generator ===
const typeIcons = {
  game: '🎮',
  book: '📖',
  watch: '🍿'
};

const typeColors = {
  game: '#7C5CFC',
  book: '#2DD4BF',
  watch: '#FF6B8A'
};

export function getPlaceholderSvg(type) {
  const icon = typeIcons[type] || '📦';
  const color = typeColors[type] || '#7C5CFC';
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
      <rect width="200" height="280" rx="8" fill="${color}22"/>
      <text x="100" y="150" text-anchor="middle" font-size="60">${icon}</text>
    </svg>
  `.trim())}`;
}
