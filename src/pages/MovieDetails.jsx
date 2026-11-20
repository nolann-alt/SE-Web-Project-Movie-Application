import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getMovieDetails } from "../api/tmdb";

export default function MovieDetails() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMovieDetails(movieId)
      .then(setMovie)
      .catch(() => setError("Unable to load this movie."));
  }, [movieId]);

  if (error) {
    return <p className="p-8 text-red-300">{error}</p>;
  }

  if (!movie) {
    return <p className="p-8 text-slate-400">Loading movie...</p>;
  }

  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white">
      <Link to="/" className="text-sky-400 hover:text-sky-300">← Back to movies</Link>
      <h1 className="mt-6 text-4xl font-bold">{movie.title}</h1>
      <p className="mt-4 max-w-2xl text-slate-300">{movie.overview}</p>
      <p className="mt-4">★ {movie.vote_average.toFixed(1)}</p>
    </main>
  );
}
