import { useEffect, useState } from "react";
import { getPopularMovies, searchMovies } from "./api/tmdb";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FilterSidebar from "./components/FilterSidebar";
import MovieCard from "./components/MovieCard";
import Footer from "./components/Footer";

export default function App() {
  // The list of movies shown, and how we sort them
  const [movies, setMovies] = useState([]);
  const [sortBy, setSortBy] = useState("vote_average");

  // When the page opens, load the popular movies
  useEffect(() => {
    getPopularMovies().then(setMovies);
  }, []);

  // When the user searches something
  function handleSearch(query) {
    searchMovies(query).then(setMovies);
  }

  // Sort a copy of the list, biggest number first
  const sortedMovies = [...movies].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar onSearch={handleSearch} />
      <Hero />

      <main className="flex gap-4 p-4">
        <FilterSidebar />

        <section className="flex-1">
          {/* Dropdown to choose the sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="mb-4 rounded bg-slate-800 p-1"
          >
            <option value="vote_average">Rating</option>
            <option value="popularity">Popularity</option>
          </select>

          {/* Grid of movies */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {sortedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}