import { useEffect, useRef, useState } from "react";
import { searchMovies, isAbortError } from "./api/tmdb";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FilterSidebar from "./components/FilterSidebar";
import MovieCard from "./components/MovieCard";
import Footer from "./components/Footer";
import {
  loadCategoryReplacements,
  loadGenreMovieCategory,
  loadInitialMovieCategories,
} from "./services/movieCategories";
import { getMovieReviewRatingSummaries } from "./services/movieLists";
import { createLatestRequest } from "./utils/latestRequest";
import { calculateMovieRating } from "./utils/movieRating";

export default function App() {
  const searchRequests = useRef(null);
  if (!searchRequests.current) searchRequests.current = createLatestRequest();
  const [categories, setCategories] = useState([]);
  const [searchMoviesFound, setSearchMoviesFound] = useState(null);
  const [communityRatings, setCommunityRatings] = useState({});
  const [communityRatingError, setCommunityRatingError] = useState("");
  const [error, setError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([
    "popular",
    "now-playing",
    "trending",
  ]);
  const [categoryOrder, setCategoryOrder] = useState([
    "popular",
    "now-playing",
    "trending",
  ]);
  const [sortBy, setSortBy] = useState("vote_average");
  const [reloadPages, setReloadPages] = useState({});

  useEffect(() => () => searchRequests.current.cancel(), []);

  useEffect(() => {
    loadInitialMovieCategories()
      .then(setCategories)
      .catch(() => setError("Unable to load movies."));
  }, []);

  useEffect(() => {
    const movieIds = [...new Set([
      ...categories.flatMap((category) => category.movies.map((movie) => String(movie.id))),
      ...(searchMoviesFound?.movies || []).map((movie) => String(movie.id)),
    ])];

    if (movieIds.length === 0) {
      setCommunityRatings({});
      setCommunityRatingError("");
      return undefined;
    }

    let isActive = true;
    setCommunityRatingError("");
    getMovieReviewRatingSummaries(movieIds)
      .then((summaries) => {
        if (isActive) setCommunityRatings(summaries);
      })
      .catch(() => {
        if (!isActive) return;
        setCommunityRatings({});
        setCommunityRatingError("Community ratings are unavailable; showing TMDB ratings.");
      });

    return () => {
      isActive = false;
    };
  }, [categories, searchMoviesFound]);

  function handleSearch(query) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      searchRequests.current.cancel();
      setSearchMoviesFound(null);
      setError("");
      return;
    }

    setError("");
    const request = searchRequests.current.start();
    searchMovies(trimmedQuery, request.signal)
      .then((movies) => {
        if (request.isCurrent()) setSearchMoviesFound({ query: trimmedQuery, movies });
      })
      .catch((searchError) => {
        if (!request.isCurrent() || isAbortError(searchError)) return;
        setError("Unable to search for movies.");
      });
  }

  function handleCategoryChange(categoryId) {
    if (!categoryId.startsWith("genre-")) return;

    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories((current) =>
        current.filter((id) => id !== categoryId)
      );
      setCategories((current) =>
        current.filter((category) => category.id !== categoryId)
      );
      setCategoryOrder((current) =>
        current.filter((id) => id !== categoryId)
      );
      return;
    }

    setSelectedCategories((current) =>
      current.includes(categoryId) ? current : [...current, categoryId]
    );
    setCategoryOrder((current) =>
      current.includes(categoryId) ? current : [...current, categoryId]
    );
    loadGenreMovieCategory(categoryId)
      .then((genreCategory) => {
        if (!genreCategory) return;
        setCategories((current) => [
          ...current.filter((category) => category.id !== genreCategory.id),
          genreCategory,
        ]);
      })
      .catch(() => setError("Unable to load this genre."));
  }

  function handleMoveCategory(categoryId, direction) {
    setCategoryOrder((current) => {
      const currentIndex = current.indexOf(categoryId);
      const targetIndex =
        direction === "up"
          ? currentIndex - 1
          : direction === "down"
            ? currentIndex + 1
            : current.indexOf(direction);

      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, categoryId);
      return next;
    });
  }

  function sortMovies(movies) {
    return [...movies].sort((a, b) => {
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "release_date") {
        return (b.release_date || "").localeCompare(a.release_date || "");
      }
      const bRating = calculateMovieRating(
        b,
        communityRatings[String(b.id)],
      ).average || 0;
      const aRating = calculateMovieRating(
        a,
        communityRatings[String(a.id)],
      ).average || 0;
      return bRating - aRating;
    });
  }

  function reloadCategory(category) {
    const currentIndex = category.reloadPage || reloadPages[category.id] || 3;
    const startPage = currentIndex + 1;
    loadCategoryReplacements(category, categories, startPage)
      .then(({ candidates, nextPage }) => {
        if (category.id === "now-playing" && candidates.length === 0) {
          return;
        }

        if (candidates.length > 0) {
          setCategories((current) =>
            current.map((item) =>
              item.id === category.id
                ? {
                    ...item,
                    movies: candidates.slice(0, 20),
                    reloadPage: nextPage,
                  }
                : item
            )
          );
          setReloadPages((current) => ({
            ...current,
            [category.id]: nextPage,
          }));
        }
      })
      .catch(() => setError("Unable to reload this category."));
  }

  const orderedCategories = categoryOrder
    .map((categoryId) => categories.find((category) => category.id === categoryId))
    .filter(
      (category) =>
        category &&
        (
          ["popular", "now-playing", "trending"].includes(category.id) ||
          selectedCategories.includes(category.id)
        )
    );

  const usedMovieIds = new Set();
  const deduplicatedCategories = orderedCategories
    .map((category) => {
      const uniqueMovies = [];

      for (const movie of category.movies) {
        if (usedMovieIds.has(movie.id)) continue;
        usedMovieIds.add(movie.id);
        uniqueMovies.push(movie);
        if (uniqueMovies.length === 20) break;
      }

      return { ...category, movies: uniqueMovies };
    })
    .filter((category) => category.movies.length > 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar onSearch={handleSearch} />
      <Hero />

      <main className="flex gap-4 p-4">
        <FilterSidebar
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          categoryOrder={categories.length > 0
            ? categoryOrder
                .map((categoryId) => categories.find((category) => category.id === categoryId))
                .filter(Boolean)
            : [
                { id: "popular", title: "Popular Movies" },
                { id: "now-playing", title: "Now in Cinemas" },
                { id: "trending", title: "Trending This Week" },
              ]}
          onMoveCategory={handleMoveCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <section data-movie-content className="min-w-0 flex-1">
          {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
          {communityRatingError && (
            <p role="alert" className="mb-4 text-sm text-amber-300">
              {communityRatingError}
            </p>
          )}

          {searchMoviesFound ? (
            <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <h2 className="mb-4 text-xl font-bold">
                Search results for "{searchMoviesFound.query}"
              </h2>
              {searchMoviesFound.movies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {sortMovies(searchMoviesFound.movies).map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      communityRatings={communityRatings[String(movie.id)]}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No movies found.</p>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {categories.length === 0 && !error && (
                <p className="text-slate-400">Loading movies...</p>
              )}
              {deduplicatedCategories.length === 0 ? (
                <p className="rounded-xl border border-slate-700 bg-slate-800/40 p-6 text-slate-400">
                  Select at least one category to display movies.
                </p>
              ) : deduplicatedCategories.map((category) => (
                  <section
                    key={category.id}
                    className="relative rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-3 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-sm"
                  >
                    <div className="relative z-10 mb-2 flex items-center justify-between">
                      <h2 className="border-l-4 border-sky-400 pl-3 text-xl font-bold tracking-tight text-slate-100">
                        {category.title}
                      </h2>
                      <button
                        type="button"
                        onClick={() => reloadCategory(category)}
                        aria-label={`Reload ${category.title}`}
                        title="Suggest new movies"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600/70 bg-slate-800/80 text-slate-300 shadow-sm transition hover:border-sky-400/60 hover:bg-sky-400/10 hover:text-sky-300"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="category-scroll relative isolate flex gap-4 overflow-x-auto px-1 pb-1">
                      {sortMovies(category.movies).slice(0, 20).map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          inCategoryRow
                          communityRatings={communityRatings[String(movie.id)]}
                        />
                      ))}
                    </div>
                  </section>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}