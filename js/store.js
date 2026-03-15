// store.js — localStorage data layer

const STORAGE_KEY = 'tonight_library';
const CURRENT_VERSION = 1;

function generateId() {
  return Math.random().toString(16).slice(2, 10);
}

function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefault();
    const data = JSON.parse(raw);
    if (data.version !== CURRENT_VERSION) return migrate(data);
    return data;
  } catch {
    return createDefault();
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createDefault() {
  const data = {
    version: CURRENT_VERSION,
    items: [],
    settings: { apiKeys: { rawg: '', tmdb: '' } },
    history: []
  };
  save(data);
  return data;
}

function migrate(data) {
  // Future migrations go here
  data.version = CURRENT_VERSION;
  save(data);
  return data;
}

// === Items ===

export function getItems() {
  return getAll().items;
}

export function addItem(item) {
  const data = getAll();
  const newItem = {
    id: generateId(),
    title: item.title,
    type: item.type,
    energy: item.energy,
    coverUrl: item.coverUrl || null,
    addedAt: Date.now(),
    lastPicked: null
  };
  data.items.push(newItem);
  save(data);
  return newItem;
}

export function updateItem(id, updates) {
  const data = getAll();
  const idx = data.items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  Object.assign(data.items[idx], updates);
  save(data);
  return data.items[idx];
}

export function deleteItem(id) {
  const data = getAll();
  data.items = data.items.filter(i => i.id !== id);
  // Also clean history
  data.history = data.history.filter(h => h.itemId !== id);
  save(data);
}

export function getItem(id) {
  return getAll().items.find(i => i.id === id) || null;
}

// === History ===

export function getHistory() {
  return getAll().history;
}

export function recordPick(itemId, mood) {
  const data = getAll();
  data.history.unshift({ itemId, pickedAt: Date.now(), mood });
  if (data.history.length > 10) data.history = data.history.slice(0, 10);
  // Update item's lastPicked
  const item = data.items.find(i => i.id === itemId);
  if (item) item.lastPicked = Date.now();
  save(data);
}

// === API Keys ===

export function getApiKey(service) {
  return getAll().settings.apiKeys[service] || '';
}

export function setApiKey(service, key) {
  const data = getAll();
  data.settings.apiKeys[service] = key;
  save(data);
}

// === Backup / Restore ===

export function exportData() {
  return JSON.stringify(getAll(), null, 2);
}

export function importData(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.version || !Array.isArray(data.items)) {
    throw new Error('Invalid backup file');
  }
  save(data);
}
