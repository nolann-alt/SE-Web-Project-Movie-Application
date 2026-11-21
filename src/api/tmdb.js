// Address of the API and our key (the key is in .env.local)
const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Send a request to TMDB and return the movie results
async function requestMovies(endpoint) {
  const response = await fetch(
    `${BASE_URL}${endpoint}&api_key=${API_KEY}`
  );

  // fetch does NOT fail when the API answers with an error,
  // so we check the response status ourselves
  if (!response.ok) {
    throw new Error("TMDB answered with status " + response.status);
  }

  const data = await response.json();

  // Make sure TMDB returned a valid list of movies
  if (!Array.isArray(data.results)) {
    throw new Error("TMDB returned an invalid movie list");
  }

  return data.results;
}

async function requestMovie(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}&api_key=${API_KEY}`);

  if (!response.ok) {
    throw new Error("TMDB answered with status " + response.status);
  }

  return response.json();
}

// Get the popular movies
export function getPopularMovies() {
  return requestMovies("/movie/popular?");
}

// Get movies from one genre
export function getMoviesByGenre(genreId) {
  return requestMovies(`/discover/movie?with_genres=${genreId}&language=en-US&sort_by=popularity.desc&page=1`);
}

// Get movies currently playing in cinemas
export function getNowPlayingMovies() {
  return requestMovies("/movie/now_playing?language=en-US&page=1");
}

// Get the five best weekly trending movies
export function getWeeklyTrendingMovies() {
  return requestMovies("/trending/movie/week?language=en-US");
}

// Get one movie for its detail page
export function getMovieDetails(movieId) {
  return requestMovie(`/movie/${movieId}?language=en-US`);
}

// Search movies with the text of the user
export function searchMovies(query) {
  // encodeURIComponent safely handles spaces and special characters
  return requestMovies(
    `/search/movie?query=${encodeURIComponent(query)}`
  );
}