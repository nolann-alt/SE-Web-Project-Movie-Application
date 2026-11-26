import {
  getMoviesByGenre,
  getNowPlayingMovies,
  getPopularMovies,
  getWeeklyTrendingMovies,
} from "../api/tmdb";
import {
  mergeUniqueMovies,
  selectAvailableReplacementMovies,
} from "../utils/movieCategoryUtils";

const INITIAL_CATEGORIES = [
  { id: "popular", title: "Popular Movies", loadPage: getPopularMovies },
  { id: "now-playing", title: "Now in Cinemas", loadPage: getNowPlayingMovies },
  { id: "trending", title: "Trending This Week", loadPage: getWeeklyTrendingMovies },
];

const GENRES = {
  "genre-28": { name: "Action", apiId: 28 },
  "genre-18": { name: "Drama", apiId: 18 },
  "genre-878": { name: "Sci-Fi", apiId: 878 },
  "genre-35": { name: "Comedy", apiId: 35 },
  "genre-27": { name: "Horror", apiId: 27 },
  "genre-10749": { name: "Romance", apiId: 10749 },
  "genre-12": { name: "Adventure", apiId: 12 },
};

export async function loadInitialMovieCategories() {
  const categories = await Promise.all(
    INITIAL_CATEGORIES.map(async ({ id, title, loadPage }) => {
      const pages = await Promise.all([1, 2, 3].map((page) => loadPage(page)));
      return { id, title, movies: mergeUniqueMovies(pages), reloadPage: 3 };
    }),
  );
  return categories;
}

export async function loadGenreMovieCategory(categoryId) {
  const genre = GENRES[categoryId];
  if (!genre) return null;

  const pages = await Promise.all(
    [1, 2, 3].map((page) => getMoviesByGenre(genre.apiId, page)),
  );
  return {
    id: categoryId,
    title: `${genre.name} Movies`,
    movies: mergeUniqueMovies(pages),
    apiId: genre.apiId,
    reloadPage: 3,
  };
}

export async function loadCategoryReplacements(category, categories, startPage) {
  const loadPage = INITIAL_CATEGORIES.find(({ id }) => id === category.id)?.loadPage;
  const pages = await Promise.all(
    Array.from({ length: 5 }, (_, index) => {
      const page = startPage + index;
      return loadPage
        ? loadPage(page)
        : getMoviesByGenre(category.apiId, page);
    }),
  );

  return {
    candidates: selectAvailableReplacementMovies(pages, category, categories),
    nextPage: startPage + pages.length - 1,
  };
}
