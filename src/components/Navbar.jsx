import { useState } from "react";

// onSearch is a function that comes from App
export default function Navbar({ onSearch }) {
  // The text written in the search box
  const [query, setQuery] = useState("");

  // When the user presses Enter
  function handleSubmit(e) {
    e.preventDefault(); // do not reload the page
    onSearch(query);
  }

  return (
    <header className="flex items-center gap-6 bg-slate-950 p-4">
      <h1 className="text-xl font-bold text-sky-400">FilmSphere</h1>

      {/* Menu links (they do nothing for now) */}
      <nav className="hidden gap-4 text-sm md:flex">
        <a href="#">Home</a>
        <a href="#">Movies</a>
        <a href="#">Forums</a>
        <a href="#">Help</a>
      </nav>

      {/* Search box */}
      <form onSubmit={handleSubmit} className="ml-auto">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
          className="rounded bg-slate-800 px-3 py-1"
        />
      </form>

      {/* Buttons for later */}
      <button>Log in</button>
      <button className="rounded border border-sky-500 px-3 py-1">Sign up</button>
    </header>
  );
}