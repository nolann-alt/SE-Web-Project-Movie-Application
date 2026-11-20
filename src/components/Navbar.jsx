import { useState } from "react";
import { Link } from "react-router";
import logo from "../assets/logo.jpg";
import ProfileButton from "./ProfileButton";

export default function Navbar({ onSearch }) {
  const [query, setQuery] = useState("");

  function handleSubmit(e) {
    e.preventDefault(); // do not reload the page
    if (onSearch) {
      onSearch(query);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex w-full items-center gap-4">
        <Link to="/" className="group shrink-0">
          <div className="flex items-center gap-2 transition-transform group-hover:scale-105">
            <img src={logo} alt="FilmSphere logo" className="h-14 w-14 object-contain" />
            <h1 className="text-xl font-black tracking-tight text-sky-400 sm:text-2xl">
              Film<span className="text-white">Sphere</span>
            </h1>
          </div>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 rounded-full bg-slate-900 p-1 text-sm md:flex">
          <Link
            to="/"
            className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Home
          </Link>
          <Link
            to="/watchlist"
            className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            WatchList
          </Link>
          <Link
            to="/favorites"
            className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Favorites
          </Link>
        </nav>

        <form
          onSubmit={handleSubmit}
          className="group flex min-w-0 flex-1 items-center sm:max-w-sm"
        >
          <label htmlFor="movie-search" className="sr-only">
            Search movies
          </label>
          <div className="flex w-full items-center rounded-full border border-slate-700 bg-slate-900 px-4 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20">
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
        </form>

        <ProfileButton />
      </div>
    </header>
  );
}