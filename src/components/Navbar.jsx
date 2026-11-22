import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import logo from "../assets/logo.jpg";
import ProfileButton from "./ProfileButton";
import { searchMovies } from "../api/tmdb";
import { getFavorites, getWatchlist } from "../services/movieLists";

export default function Navbar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimer = useRef(null);
  const searchFormRef = useRef(null);
  const [watchlistCount, setWatchlistCount] = useState(getWatchlist().length);
  const [favoritesCount, setFavoritesCount] = useState(getFavorites().length);

  useEffect(() => {
    function updateCounts() {
      setWatchlistCount(getWatchlist().length);
      setFavoritesCount(getFavorites().length);
    }
    window.addEventListener("filmsphere-library-updated", updateCounts);
    window.addEventListener("filmsphere-auth-updated", updateCounts);
    return () => {
      window.removeEventListener("filmsphere-library-updated", updateCounts);
      window.removeEventListener("filmsphere-auth-updated", updateCounts);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        searchFormRef.current &&
        !searchFormRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    clearTimeout(suggestionTimer.current);
    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestionTimer.current = setTimeout(() => {
      searchMovies(trimmedQuery)
        .then((movies) => {
          setSuggestions(movies.slice(0, 6));
          setShowSuggestions(true);
        })
        .catch(() => {
          setSuggestions([]);
          setShowSuggestions(false);
        });
    }, 300);

    return () => clearTimeout(suggestionTimer.current);
  }, [query]);

  function handleSubmit(e) {
    e.preventDefault(); // do not reload the page
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(query);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sky-950/70 bg-slate-950/90 px-4 py-2 shadow-[0_8px_24px_rgba(2,6,23,0.38)] backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-5">
        <Link to="/" className="group shrink-0">
          <div className="flex items-center gap-2 transition-transform group-hover:scale-105">
            <img src={logo} alt="FilmSphere logo" className="h-12 w-12 object-contain" />
            <h1 className="text-xl font-black tracking-tight text-sky-300 sm:text-2xl">
              Film<span className="text-white">Sphere</span>
            </h1>
          </div>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm md:flex">
          <Link
            to="/"
            className="py-2 text-slate-200 transition hover:text-sky-300"
          >
            Home
          </Link>
          <Link
            to="/watchlist"
            className="py-2 text-slate-200 transition hover:text-sky-300"
          >
            WatchList
            {watchlistCount > 0 && (
              <span className="ml-2 rounded-full bg-sky-400/15 px-2 py-0.5 text-xs text-sky-300">
                {watchlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/favorites"
            className="py-2 text-slate-200 transition hover:text-sky-300"
          >
            Favorites
            {favoritesCount > 0 && (
              <span className="ml-2 rounded-full bg-rose-400/15 px-2 py-0.5 text-xs text-rose-300">
                {favoritesCount}
              </span>
            )}
          </Link>
        </nav>

        <form
          ref={searchFormRef}
          onSubmit={handleSubmit}
          className="group relative flex min-w-0 flex-1 items-center sm:max-w-sm"
        >
          <label htmlFor="movie-search" className="sr-only">
            Search movies
          </label>
          <div className="flex w-full items-center rounded-full border border-slate-700/80 bg-slate-900/90 px-4 shadow-inner transition focus-within:border-sky-300/70 focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-400/15">
            <svg
              aria-hidden="true"
              className="mr-2 h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              />
            </svg>
            <input
              id="movie-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <kbd className="hidden rounded border border-slate-700 px-1.5 py-0.5 text-xs text-slate-500 lg:inline-block">
              Enter
            </kbd>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
              {suggestions.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 px-3 py-2 transition hover:bg-slate-800"
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt=""
                      className="h-12 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-8 items-center justify-center rounded bg-slate-700 text-[8px] text-slate-400">
                      N/A
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{movie.title}</p>
                    {movie.release_date && (
                      <p className="mt-0.5 text-xs text-sky-300">
                        {movie.release_date.slice(0, 4)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </form>

        <ProfileButton />
      </div>
    </header>
  );
}