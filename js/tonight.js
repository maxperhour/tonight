// tonight.js — Mood selection + recommendation engine

import * as store from './store.js';
import { getPlaceholderSvg } from './ui.js';

let currentMood = null;

const ENERGY_MAP = {
  exhausted: ['chill'],
  relaxed:   ['chill', 'moderate'],
  upbeat:    ['moderate', 'intense']
};

// === Recommendation algorithm ===
function getRecommendation(mood, category) {
  const items = store.getItems();

  // Filter by category
  let candidates = category === 'any'
    ? items
    : items.filter(i => i.type === category);

  // Filter by energy level
  const allowed = ENERGY_MAP[mood];
  candidates = candidates.filter(i => allowed.includes(i.energy));

  if (candidates.length === 0) return null;

  // De-prioritize recently picked items
  const recentIds = store.getHistory().slice(0, 5).map(h => h.itemId);
  const fresh = candidates.filter(i => !recentIds.includes(i.id));
  const pool = fresh.length > 0 ? fresh : candidates;

  // Weighted random — prefer items not picked recently
  const weighted = pool.map(item => ({
    item,
    weight: item.lastPicked
      ? Math.max(1, (Date.now() - item.lastPicked) / (1000 * 60 * 60))
      : 100
  }));

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const { item, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) return item;
  }

  return pool[0];
}

// === Step navigation ===
function showStep(stepId) {
  document.querySelectorAll('.tonight-step').forEach(s => s.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');
}

function showResult(item) {
  const resultCard = document.querySelector('.result-card');
  const resultEmpty = document.getElementById('result-empty');
  const resultActions = document.querySelector('.result-actions');

  if (!item) {
    resultCard.style.display = 'none';
    resultActions.style.display = 'none';
    resultEmpty.hidden = false;

    const hasItems = store.getItems().length > 0;
    document.getElementById('empty-text').textContent = hasItems
      ? 'Nothing matches that vibe yet. Try a different mood or add more to your library.'
      : 'Your library is empty! Add some things to get started.';
    return;
  }

  resultEmpty.hidden = true;
  resultCard.style.display = '';
  resultActions.style.display = '';

  const coverSrc = item.coverUrl || getPlaceholderSvg(item.type);
  document.getElementById('result-cover-img').src = coverSrc;
  document.getElementById('result-cover-img').alt = item.title;
  document.getElementById('result-title').textContent = item.title;

  const typeLabels = { game: 'Game', book: 'Book', watch: 'Watch' };
  document.getElementById('result-type').textContent = typeLabels[item.type] || item.type;

  const energyEl = document.getElementById('result-energy');
  energyEl.textContent = item.energy;
  energyEl.dataset.energy = item.energy;
}

// === State for current pick ===
let currentCategory = null;
let currentItem = null;

function pickAndShow(category) {
  currentCategory = category;
  const item = getRecommendation(currentMood, category);
  currentItem = item;

  if (item) {
    store.recordPick(item.id, currentMood);
  }

  showResult(item);
  showStep('tonight-result');
}

// === Init ===
export function initTonight() {
  // Mood cards
  document.querySelectorAll('.mood-card').forEach(card => {
    card.addEventListener('click', () => {
      currentMood = card.dataset.mood;
      showStep('tonight-category');
    });
  });

  // Category cards
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      pickAndShow(card.dataset.category);
    });
  });

  // Back buttons
  document.getElementById('back-to-mood').addEventListener('click', () => {
    showStep('tonight-mood');
  });
  document.getElementById('back-to-category').addEventListener('click', () => {
    showStep('tonight-category');
  });

  // Pick Again
  document.getElementById('pick-again').addEventListener('click', () => {
    pickAndShow(currentCategory);
  });

  // Let's Go! — return to mood selection
  document.getElementById('lets-go').addEventListener('click', () => {
    showStep('tonight-mood');
  });

  // Empty state → go to library
  document.getElementById('empty-go-library').addEventListener('click', () => {
    showStep('tonight-mood');
    // Switch to library tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="library"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-library').classList.add('active');
  });
}
