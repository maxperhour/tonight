// library.js — Library tab: display, add, edit, delete items

import * as store from './store.js';
import { fetchCover } from './covers.js';
import { showToast, openModal, closeModal, confirm, getPlaceholderSvg } from './ui.js';

let currentFilter = 'all';
let editingId = null;
let coverFetchTimer = null;
let pendingCoverUrl = null;

// === Render library grid ===
export function renderLibrary() {
  const items = store.getItems();
  const grid = document.getElementById('library-grid');
  const empty = document.getElementById('library-empty');

  const filtered = currentFilter === 'all'
    ? items
    : items.filter(i => i.type === currentFilter);

  if (items.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="library-empty" style="grid-column:1/-1;padding-top:40px">
      <p class="empty-text">No ${currentFilter} items yet</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const coverSrc = item.coverUrl || getPlaceholderSvg(item.type);
    return `
      <div class="library-card" data-id="${item.id}">
        <div class="library-card-cover">
          <img src="${coverSrc}" alt="${escapeHtml(item.title)}" loading="lazy">
        </div>
        <div class="library-card-info">
          <div class="library-card-title">${escapeHtml(item.title)}</div>
          <span class="library-card-badge" data-energy="${item.energy}">${item.energy}</span>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// === Filter pills ===
function initFilters() {
  document.querySelectorAll('.filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderLibrary();
    });
  });
}

// === Add/Edit Modal ===
function resetModal() {
  editingId = null;
  pendingCoverUrl = null;
  document.getElementById('modal-title').textContent = 'Add to Library';
  document.getElementById('item-title').value = '';
  document.getElementById('cover-preview').hidden = true;
  document.getElementById('cover-preview-img').src = '';
  document.getElementById('modal-delete').hidden = true;
  document.getElementById('modal-save').textContent = 'Add to Library';

  // Reset type pills
  document.querySelectorAll('.type-pills .pill').forEach(p => p.classList.remove('active'));
  // Reset energy pills
  document.querySelectorAll('.energy-pills .pill').forEach(p => p.classList.remove('active'));
}

function openAddModal() {
  resetModal();
  openModal('modal-overlay');
}

function openEditModal(id) {
  resetModal();
  const item = store.getItem(id);
  if (!item) return;

  editingId = id;
  pendingCoverUrl = item.coverUrl;
  document.getElementById('modal-title').textContent = 'Edit Item';
  document.getElementById('item-title').value = item.title;
  document.getElementById('modal-delete').hidden = false;
  document.getElementById('modal-save').textContent = 'Save Changes';

  // Set type pill
  document.querySelectorAll('.type-pills .pill').forEach(p => {
    p.classList.toggle('active', p.dataset.type === item.type);
  });
  // Set energy pill
  document.querySelectorAll('.energy-pills .pill').forEach(p => {
    p.classList.toggle('active', p.dataset.energy === item.energy);
  });
  // Show cover
  if (item.coverUrl) {
    document.getElementById('cover-preview-img').src = item.coverUrl;
    document.getElementById('cover-preview').hidden = false;
  }

  openModal('modal-overlay');
}

function getSelectedType() {
  const active = document.querySelector('.type-pills .pill.active');
  return active ? active.dataset.type : null;
}

function getSelectedEnergy() {
  const active = document.querySelector('.energy-pills .pill.active');
  return active ? active.dataset.energy : null;
}

async function handleSave() {
  const title = document.getElementById('item-title').value.trim();
  const type = getSelectedType();
  const energy = getSelectedEnergy();

  if (!title) { showToast('Enter a title'); return; }
  if (!type) { showToast('Pick a type'); return; }
  if (!energy) { showToast('Pick an energy level'); return; }

  if (editingId) {
    store.updateItem(editingId, { title, type, energy, coverUrl: pendingCoverUrl });
    showToast('Item updated');
  } else {
    store.addItem({ title, type, energy, coverUrl: pendingCoverUrl });
    showToast('Added to library');
  }

  closeModal('modal-overlay');
  renderLibrary();
}

async function handleDelete() {
  const ok = await confirm('Delete this item from your library?');
  if (!ok) return;
  store.deleteItem(editingId);
  closeModal('modal-overlay');
  renderLibrary();
  showToast('Item deleted');
}

// === Cover art auto-fetch ===
function handleTitleInput() {
  clearTimeout(coverFetchTimer);
  const title = document.getElementById('item-title').value.trim();
  const type = getSelectedType();
  if (!title || !type) return;

  coverFetchTimer = setTimeout(async () => {
    const url = await fetchCover(title, type);
    if (url) {
      pendingCoverUrl = url;
      document.getElementById('cover-preview-img').src = url;
      document.getElementById('cover-preview').hidden = false;
    } else {
      pendingCoverUrl = null;
      document.getElementById('cover-preview').hidden = true;
    }
  }, 600);
}

// === Init ===
export function initLibrary() {
  initFilters();

  // Add button
  document.getElementById('add-item-btn').addEventListener('click', openAddModal);
  document.getElementById('empty-add-btn').addEventListener('click', openAddModal);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', () => closeModal('modal-overlay'));
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal('modal-overlay');
  });

  // Type pills
  document.querySelectorAll('.type-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.type-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      handleTitleInput(); // Re-fetch cover for new type
    });
  });

  // Energy pills
  document.querySelectorAll('.energy-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.energy-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // Title input — debounced cover fetch
  document.getElementById('item-title').addEventListener('input', handleTitleInput);

  // Save
  document.getElementById('modal-save').addEventListener('click', handleSave);

  // Delete
  document.getElementById('modal-delete').addEventListener('click', handleDelete);

  // Card tap → edit
  document.getElementById('library-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.library-card');
    if (card) openEditModal(card.dataset.id);
  });

  renderLibrary();
}
