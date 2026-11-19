import { useState } from "react";
import { Link } from "react-router";
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
    <header className="flex items-center gap-6 bg-slate-950 p-4">
      <h1 className="text-xl font-bold text-sky-400">FilmSphere</h1>

      <nav className="hidden items-center gap-4 text-sm md:flex">
        <Link to="/">Home</Link>
        <Link to="/watchlist">WatchList</Link>
        <Link to="/favorites">Favorites</Link>
      </nav>

      <form onSubmit={handleSubmit} className="ml-auto">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
          className="rounded bg-slate-800 px-3 py-1"
        />
      </form>

      <ProfileButton />
    </header>
  );
}