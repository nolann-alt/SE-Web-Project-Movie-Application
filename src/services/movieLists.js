const WATCHLIST_KEY = "filmsphere_watchlist";
const FAVORITES_KEY = "filmsphere_favorites";
const REVIEWS_KEY = "filmsphere_reviews";

function readIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function saveIds(key, ids) {
  localStorage.setItem(key, JSON.stringify(ids));
  window.dispatchEvent(new Event("filmsphere-library-updated"));
}

export function getWatchlist() {
  return readIds(WATCHLIST_KEY);
}

export function getFavorites() {
  return readIds(FAVORITES_KEY);
}

export function toggleWatchlistMovie(movieId) {
  const id = String(movieId);
  const ids = getWatchlist();
  const nextIds = ids.includes(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id];
  saveIds(WATCHLIST_KEY, nextIds);
  return nextIds.includes(id);
}

export function toggleFavoriteMovie(movieId) {
  const id = String(movieId);
  const ids = getFavorites();
  const nextIds = ids.includes(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id];
  saveIds(FAVORITES_KEY, nextIds);
  return nextIds.includes(id);
}

export function getMovieReviews(movieId) {
  try {
    const allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
    return Array.isArray(allReviews[String(movieId)]) ? allReviews[String(movieId)] : [];
  } catch {
    return [];
  }
}

export function addMovieReview(movieId, review) {
  let allReviews = {};
  try {
    allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
  } catch {
    allReviews = {};
  }

  const key = String(movieId);
  allReviews[key] = [review, ...(Array.isArray(allReviews[key]) ? allReviews[key] : [])];
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
}
