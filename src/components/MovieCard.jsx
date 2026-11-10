// Start of the link for the posters
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// movie is one movie from the API
export default function MovieCard({ movie }) {
  return (
    <div className="rounded bg-slate-800 p-2">
      <img src={IMAGE_URL + movie.poster_path} alt={movie.title} />
      <h3 className="mt-2 text-sm font-semibold">{movie.title}</h3>
      <p className="text-xs">★ {movie.vote_average}</p>
    </div>
  );
}