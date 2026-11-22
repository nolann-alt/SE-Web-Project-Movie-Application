import { getCurrentUser } from "./auth";

const MOVIE_LISTS_KEY = "filmsphere-movie-lists";
const WATCHLIST_STATUSES_KEY = "filmsphere-watchlist-statuses";
const REVIEWS_KEY = "filmsphere_reviews";
const FAVORITE_METADATA_KEY = "filmsphere-favorite-metadata";
const PINNED_FAVORITE_KEY = "filmsphere-pinned-favorite";

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

export function getFavoriteMetadata(movieId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return { rating: 8, review: "" };

  try {
    const allMetadata = JSON.parse(
      localStorage.getItem(FAVORITE_METADATA_KEY) || "{}",
    );
    return allMetadata[currentUser]?.[String(movieId)] || { rating: 8, review: "" };
  } catch {
    return { rating: 8, review: "" };
  }
}

export function setFavoriteMetadata(movieId, metadata) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  let allMetadata = {};
  try {
    allMetadata = JSON.parse(
      localStorage.getItem(FAVORITE_METADATA_KEY) || "{}",
    );
  } catch {
    allMetadata = {};
  }

  allMetadata[currentUser] = {
    ...allMetadata[currentUser],
    [String(movieId)]: metadata,
  };
  localStorage.setItem(FAVORITE_METADATA_KEY, JSON.stringify(allMetadata));
  window.dispatchEvent(new Event("filmsphere-library-updated"));
  return true;
}

export function getPinnedFavorite() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  try {
    const pinned = JSON.parse(
      localStorage.getItem(PINNED_FAVORITE_KEY) || "{}",
    );
    return pinned[currentUser] ? String(pinned[currentUser]) : null;
  } catch {
    return null;
  }
}

export function setPinnedFavorite(movieId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  let pinned = {};
  try {
    pinned = JSON.parse(
      localStorage.getItem(PINNED_FAVORITE_KEY) || "{}",
    );
  } catch {
    pinned = {};
  }

  pinned[currentUser] = movieId ? String(movieId) : null;
  localStorage.setItem(PINNED_FAVORITE_KEY, JSON.stringify(pinned));
  window.dispatchEvent(new Event("filmsphere-library-updated"));
  return true;
}
