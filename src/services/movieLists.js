import { getCurrentUser } from "./auth";
import { getSupabaseClient } from "./supabaseClient";

const MOVIE_LISTS_KEY = "filmsphere-movie-lists";
const REVIEW_COLUMNS = "id,movie_id,user_id,author,rating,comment,created_at";

function readIds(key) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const allLists = JSON.parse(localStorage.getItem(MOVIE_LISTS_KEY) || "{}");
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

function mapMovieReview(review) {
  return {
    id: review.id,
    userId: review.user_id,
    author: review.author,
    rating: review.rating,
    text: review.comment,
    createdAt: new Date(review.created_at).toLocaleDateString(),
  };
}

export async function getMovieReviews(movieId) {
  const { data, error } = await getSupabaseClient()
    .from("movie_reviews")
    .select(REVIEW_COLUMNS)
    .eq("movie_id", movieId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapMovieReview);
}

export async function addMovieReview(movieId, review) {
  const { data, error } = await getSupabaseClient()
    .from("movie_reviews")
    .upsert(
      {
        movie_id: movieId,
        user_id: review.userId,
        author: review.author,
        rating: review.rating,
        comment: review.text,
      },
      { onConflict: "movie_id,user_id" },
    )
    .select(REVIEW_COLUMNS)
    .single();

  if (error) throw error;
  return mapMovieReview(data);
}

export async function deleteMovieReview(movieId, reviewId, userId) {
  const { data, error } = await getSupabaseClient()
    .from("movie_reviews")
    .delete()
    .eq("movie_id", movieId)
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getProfileUsername(userId) {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("username")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data.username;
}

export async function updateProfileUsername(userId, username) {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .update({ username })
    .eq("user_id", userId)
    .select("username")
    .single();

  if (error) throw error;
  return data.username;
}
