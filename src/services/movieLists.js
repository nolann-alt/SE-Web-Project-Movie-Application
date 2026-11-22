import { getCurrentUser } from "./auth";

const MOVIE_LISTS_KEY = "filmsphere-movie-lists";
const WATCHLIST_STATUSES_KEY = "filmsphere-watchlist-statuses";
const REVIEWS_KEY = "filmsphere_reviews";

function readIds(key) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const allLists = JSON.parse(localStorage.getItem(MOVIE_LISTS_KEY) || "{}");
    if (!allLists[currentUser]?.[key]) {
      const legacyKey =
        key === "watchlist" ? "filmsphere_watchlist" : "filmsphere_favorites";
      const legacyIds = JSON.parse(localStorage.getItem(legacyKey) || "[]");
      if (Array.isArray(legacyIds) && legacyIds.length > 0) {
        allLists[currentUser] = {
          ...allLists[currentUser],
          [key]: legacyIds.map(String),
        };
        localStorage.setItem(MOVIE_LISTS_KEY, JSON.stringify(allLists));
        localStorage.removeItem(legacyKey);
      }
    }
    const value = allLists[currentUser]?.[key];
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function saveIds(key, ids) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  let allLists = {};
  try {
    allLists = JSON.parse(localStorage.getItem(MOVIE_LISTS_KEY) || "{}");
  } catch {
    allLists = {};
  }

  allLists[currentUser] = {
    ...allLists[currentUser],
    [key]: ids,
  };
  localStorage.setItem(MOVIE_LISTS_KEY, JSON.stringify(allLists));
  window.dispatchEvent(new Event("filmsphere-library-updated"));
  return true;
}

export function getWatchlist() {
  return readIds("watchlist");
}

export function getFavorites() {
  return readIds("favorites");
}

export function toggleWatchlistMovie(movieId) {
  if (!getCurrentUser()) return false;
  const id = String(movieId);
  const ids = getWatchlist();
  const nextIds = ids.includes(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id];
  saveIds("watchlist", nextIds);
  return nextIds.includes(id);
}

export function toggleFavoriteMovie(movieId) {
  if (!getCurrentUser()) return false;
  const id = String(movieId);
  const ids = getFavorites();
  const nextIds = ids.includes(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id];
  saveIds("favorites", nextIds);
  return nextIds.includes(id);
}

export function getWatchlistStatus(movieId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return "To Watch";

  try {
    const allStatuses = JSON.parse(
      localStorage.getItem(WATCHLIST_STATUSES_KEY) || "{}",
    );
    return allStatuses[currentUser]?.[String(movieId)] || "To Watch";
  } catch {
    return "To Watch";
  }
}

export function setWatchlistStatus(movieId, status) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  let allStatuses = {};
  try {
    allStatuses = JSON.parse(
      localStorage.getItem(WATCHLIST_STATUSES_KEY) || "{}",
    );
  } catch {
    allStatuses = {};
  }

  allStatuses[currentUser] = {
    ...allStatuses[currentUser],
    [String(movieId)]: status,
  };
  localStorage.setItem(
    WATCHLIST_STATUSES_KEY,
    JSON.stringify(allStatuses),
  );
  window.dispatchEvent(new Event("filmsphere-library-updated"));
  return true;
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
