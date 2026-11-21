import { Link } from "react-router";

// Start of the link for the posters
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// movie is one movie from the API
export default function MovieCard({ movie, inCategoryRow = false }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className={`group ${
        inCategoryRow ? "category-movie-card" : "w-44"
      } relative z-0 shrink-0 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800/90 shadow-[0_8px_24px_rgba(2,6,23,0.28)] transition-[border-color,background-color,box-shadow] duration-300 ease-out hover:z-30 hover:border-sky-400/60 hover:bg-slate-800 hover:shadow-[0_16px_32px_rgba(14,165,233,0.16)]`}
    >
      {movie.poster_path ? (
        <div className="relative overflow-hidden">
          <img
            src={IMAGE_URL + movie.poster_path}
            alt={movie.title}
            className="h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/70 to-transparent" />
        </div>
      ) : (
        <div className="flex h-60 items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 text-sm text-slate-400">
          No poster
        </div>
      )}
      <div className="border-t border-slate-700/60 p-3">
        <h3 className="truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-sky-300">
          {movie.title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="inline-flex items-center rounded-full bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-300">
            <span aria-hidden="true" className="mr-1">★</span>
            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
          </p>
          {movie.release_date && (
            <p className="rounded-full bg-sky-400/10 px-2 py-1 text-xs font-medium text-sky-300">
              {new Date(`${movie.release_date}T00:00:00`).getFullYear()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}