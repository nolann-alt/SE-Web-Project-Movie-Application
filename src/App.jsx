import { useEffect, useState } from "react";
import {
  getPopularMovies,
  getNowPlayingMovies,
  getWeeklyTrendingMovies,
  getMoviesByGenre,
  searchMovies,
} from "./api/tmdb";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FilterSidebar from "./components/FilterSidebar";
import MovieCard from "./components/MovieCard";
import Footer from "./components/Footer";

export default function App() {
  const [categories, setCategories] = useState([]);
  const [searchMoviesFound, setSearchMoviesFound] = useState(null);
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

  useEffect(() => {
    Promise.all([
      Promise.all([1, 2, 3].map((page) => getPopularMovies(page))),
      Promise.all([1, 2, 3].map((page) => getNowPlayingMovies(page))),
      Promise.all([1, 2, 3].map((page) => getWeeklyTrendingMovies(page))),
    ])
      .then(([popularPages, nowPlayingPages, trendingPages]) => {
        const mergeUnique = (pages) =>
          pages.flat().filter(
            (movie, index, movies) =>
              movies.findIndex((item) => item.id === movie.id) === index
          );

        setCategories([
          { id: "popular", title: "Popular Movies", movies: mergeUnique(popularPages), reloadPage: 3 },
          { id: "now-playing", title: "Now in Cinemas", movies: mergeUnique(nowPlayingPages), reloadPage: 3 },
          { id: "trending", title: "Trending This Week", movies: mergeUnique(trendingPages), reloadPage: 3 },
        ]);
      })
      .catch(() => setError("Unable to load movies."));
  }, []);

  function handleSearch(query) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchMoviesFound(null);
      return;
    }

    setError("");
    searchMovies(trimmedQuery)
      .then((movies) => setSearchMoviesFound({ query: trimmedQuery, movies }))
      .catch(() => setError("Unable to search for movies."));
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

    const genres = {
      "genre-28": { name: "Action", apiId: 28 },
      "genre-18": { name: "Drama", apiId: 18 },
      "genre-878": { name: "Sci-Fi", apiId: 878 },
      "genre-35": { name: "Comedy", apiId: 35 },
      "genre-27": { name: "Horror", apiId: 27 },
      "genre-10749": { name: "Romance", apiId: 10749 },
      "genre-12": { name: "Adventure", apiId: 12 },
    };
    const genre = genres[categoryId];

    setSelectedCategories((current) =>
      current.includes(categoryId) ? current : [...current, categoryId]
    );
    setCategoryOrder((current) =>
      current.includes(categoryId) ? current : [...current, categoryId]
    );
    Promise.all([1, 2, 3].map((page) => getMoviesByGenre(genre.apiId, page)))
      .then((pages) => {
        const movies = pages
          .flat()
          .filter(
            (movie, index, list) =>
              list.findIndex((item) => item.id === movie.id) === index
          );
        setCategories((current) => [
          ...current.filter((category) => category.id !== categoryId),
          {
            id: categoryId,
            title: `${genre.name} Movies`,
            movies,
            apiId: genre.apiId,
            reloadPage: 3,
          },
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
      return (b.vote_average || 0) - (a.vote_average || 0);
    });
  }

  function reloadCategory(category) {
    const currentIndex = category.reloadPage || reloadPages[category.id] || 3;
    const startPage = currentIndex + 1;
    const pageNumbers = Array.from({ length: 5 }, (_, index) => startPage + index);

    let request;
    if (category.id === "popular") {
      request = Promise.all(pageNumbers.map((page) => getPopularMovies(page)));
    } else if (category.id === "now-playing") {
      request = Promise.all(pageNumbers.map((page) => getNowPlayingMovies(page)));
    } else if (category.id === "trending") {
      request = Promise.all(pageNumbers.map((page) => getWeeklyTrendingMovies(page)));
    } else {
      request = Promise.all(
        pageNumbers.map((page) => getMoviesByGenre(category.apiId, page))
      );
    }

    request
      .then((pages) => {
        const usedByOtherCategories = new Set(
          categories
            .filter((item) => item.id !== category.id)
            .flatMap((item) => item.movies.map((movie) => movie.id))
        );
        const currentMovieIds = new Set(
          category.movies.map((movie) => movie.id)
        );
        const candidates = pages
          .flat()
          .filter(
            (movie, index, movies) =>
              !usedByOtherCategories.has(movie.id) &&
              !currentMovieIds.has(movie.id) &&
              movies.findIndex((item) => item.id === movie.id) === index
          );

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
                    reloadPage: startPage + pageNumbers.length - 1,
                  }
                : item
            )
          );
          setReloadPages((current) => ({
            ...current,
            [category.id]: startPage + pageNumbers.length - 1,
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

  const fixedCategoryIds = ["popular", "now-playing", "trending"];
  const usedMovieIds = new Set();
  const deduplicatedCategories = [...orderedCategories]
    .sort((a, b) => {
      const aFixed = fixedCategoryIds.includes(a.id);
      const bFixed = fixedCategoryIds.includes(b.id);
      if (aFixed !== bFixed) return aFixed ? -1 : 1;
      return 0;
    })
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

          {searchMoviesFound ? (
            <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <h2 className="mb-4 text-xl font-bold">
                Search results for "{searchMoviesFound.query}"
              </h2>
              {searchMoviesFound.movies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {sortMovies(searchMoviesFound.movies).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
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
                        <MovieCard key={movie.id} movie={movie} inCategoryRow />
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