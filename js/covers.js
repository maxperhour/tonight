// covers.js — Cover art fetching from free APIs

import { getApiKey } from './store.js';

// === Open Library (books, no key required) ===
async function fetchOpenLibraryCover(title) {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`
  );
  const data = await res.json();
  if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
    return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-M.jpg`;
  }
  return null;
}

// === RAWG (games, free key required) ===
async function fetchRawgCover(title, key) {
  const res = await fetch(
    `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(title)}&page_size=1`
  );
  const data = await res.json();
  if (data.results && data.results.length > 0 && data.results[0].background_image) {
    return data.results[0].background_image;
  }
  return null;
}

// === TMDB (movies & TV, free key required) ===
async function fetchTmdbCover(title, key) {
  // Try movie first, then TV
  for (const mediaType of ['movie', 'tv']) {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${mediaType}?api_key=${key}&query=${encodeURIComponent(title)}`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0 && data.results[0].poster_path) {
      return `https://image.tmdb.org/t/p/w300${data.results[0].poster_path}`;
    }
  }
  return null;
}

// === Main entry point ===
export async function fetchCover(title, type) {
  if (!title || !title.trim()) return null;

  try {
    if (type === 'book') {
      return await fetchOpenLibraryCover(title);
    }
    if (type === 'game') {
      const key = getApiKey('rawg');
      if (key) return await fetchRawgCover(title, key);
      return null;
    }
    if (type === 'watch') {
      const key = getApiKey('tmdb');
      if (key) return await fetchTmdbCover(title, key);
      return null;
    }
  } catch (err) {
    console.warn(`Cover fetch failed for "${title}":`, err);
  }
  return null;
}
