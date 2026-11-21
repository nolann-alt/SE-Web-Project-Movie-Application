import { useEffect, useState } from "react";
import {
  getPopularMovies,
  getNowPlayingMovies,
  getWeeklyTrendingMovies,
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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar onSearch={handleSearch} />
      <Hero />

      <main className="flex gap-4 p-4">
        <FilterSidebar />

        <section className="min-w-0 flex-1">
          {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

          {searchMoviesFound ? (
            <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <h2 className="mb-4 text-xl font-bold">
                Search results for "{searchMoviesFound.query}"
              </h2>
              {searchMoviesFound.movies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {searchMoviesFound.movies.map((movie) => (
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
              {categories.map((category) => (
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
                      {category.movies.slice(0, 20).map((movie) => (
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