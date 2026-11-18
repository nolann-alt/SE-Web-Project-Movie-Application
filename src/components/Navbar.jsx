import { useState } from "react";
import { Link } from "react-router";
import ProfileButton from "./ProfileButton";

export default function Navbar({ onSearch }) {
  const [query, setQuery] = useState("");

  // Search movies
  function handleSubmit(e) {
    e.preventDefault();

    if (onSearch) {
      onSearch(query);
    }
  }

  return (
    <header className="flex items-center gap-6 bg-slate-950 p-4">

      {/* Logo */}
      <h1 className="text-xl font-bold text-sky-400">
        FilmSphere
      </h1>

      {/* Navigation links */}
      <nav className="hidden items-center gap-4 text-sm md:flex">
        <Link to="/">Home</Link>
        <Link to="/watchlist">WatchList</Link>
        <Link to="/favorites">Favorites</Link>
      </nav>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="ml-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
          className="w-full rounded-3xl border border-white bg-slate-800 px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-sky-400"
        />
      </form>

      {/* Profile button */}
      <ProfileButton />

    </header>
  );
}
