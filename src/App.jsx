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

  useEffect(() => {
    Promise.all([
      getPopularMovies(),
      getNowPlayingMovies(),
      getWeeklyTrendingMovies(),
    ])
      .then(([popular, nowPlaying, trending]) =>
        setCategories([
          { id: "popular", title: "Popular Movies", movies: popular },
          { id: "now-playing", title: "Now in Cinemas", movies: nowPlaying },
          { id: "trending", title: "Trending This Week", movies: trending },
        ])
      )
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
    getMoviesByGenre(genre.apiId)
      .then((movies) =>
        setCategories((current) => [
          ...current.filter((category) => category.id !== categoryId),
          { id: categoryId, title: `${genre.name} Movies`, movies },
        ])
      )
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
              {orderedCategories.length === 0 ? (
                <p className="rounded-xl border border-slate-700 bg-slate-800/40 p-6 text-slate-400">
                  Select at least one category to display movies.
                </p>
              ) : orderedCategories.map((category) => (
                  <section
                    key={category.id}
                    className="relative rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-3 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-sm"
                  >
                    <div className="relative z-10 mb-2 flex items-center justify-between">
                      <h2 className="border-l-4 border-sky-400 pl-3 text-xl font-bold tracking-tight text-slate-100">
                        {category.title}
                      </h2>
                    </div>
                    <div className="category-scroll relative isolate flex gap-4 overflow-x-auto px-1 pb-3">
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