import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import MovieCard from "./MovieCard";
import { getMovieDetails } from "../api/tmdb";

export default function MovieLibrary({ title, ids, emptyMessage }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const idsKey = ids.join(",");

  useEffect(() => {
    setLoading(true);
    Promise.all(ids.map((id) => getMovieDetails(id)))
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [idsKey]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <h1 className="mb-6 border-l-4 border-sky-400 pl-3 text-3xl font-bold">{title}</h1>
        {loading ? (
          <p className="text-slate-400">Loading movies...</p>
        ) : movies.length > 0 ? (
          <div className="flex flex-wrap gap-5">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            {emptyMessage}
          </p>
        )}
      </main>
    </div>
  );
}
