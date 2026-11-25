import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMovieDetails } from "../api/tmdb";
import { useAuth } from "../services/auth";
import { loadMoviesIndividually } from "../utils/loadMoviesIndividually";
import {
  getFavorites,
  getWatchlist,
  getWatchlistStatus,
  setWatchlistStatus,
  toggleFavoriteMovie,
  toggleWatchlistMovie,
} from "../services/movieLists";

const STATUS_OPTIONS = ["To Watch", "Watching", "Watched"];

function Icon({ children, className = "h-4 w-4" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      {children}
    </svg>
  );
}

function formatRuntime(minutes) {
  const safeMinutes = Number(minutes) || 0;
  return `${Math.floor(safeMinutes / 60)}h ${safeMinutes % 60}m`;
}

export default function WatchList() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const currentUserId = user?.id ?? null;
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedMovieCount, setFailedMovieCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recently_added");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [favoriteIds, setFavoriteIds] = useState(getFavorites());
  const [removedMovie, setRemovedMovie] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (isAuthLoading) return undefined;
    if (!currentUserId) {
      setMovies([]);
      setFailedMovieCount(0);
      setLoadError("");
      setFavoriteIds([]);
      setLoading(false);
      return undefined;
    }

    const ids = getWatchlist();
    setFavoriteIds(getFavorites());
    setLoading(true);
    setMovies([]);
    setFailedMovieCount(0);
    setLoadError("");
    if (ids.length === 0) {
      setMovies([]);
      setLoading(false);
      return undefined;
    }

    let isActive = true;
    loadMoviesIndividually(ids, async (id) => {
      const movie = await getMovieDetails(id);
      return {
        ...movie,
        watchlistStatus: getWatchlistStatus(movie.id),
      };
    })
      .then(({ movies: loadedMovies, failedCount }) => {
        if (isActive) {
          setMovies(loadedMovies);
          setFailedMovieCount(failedCount);
          if (failedCount > 0) {
            setLoadError("Some saved movies could not be loaded.");
          }
        }
      })
      .catch(() => {
        if (isActive) setLoadError("Unable to load your saved movies.");
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [currentUserId, isAuthLoading]);

  useEffect(() => {
    function updateLibrary() {
      setFavoriteIds(getFavorites());
    }
    window.addEventListener("filmsphere-library-updated", updateLibrary);
    return () => window.removeEventListener("filmsphere-library-updated", updateLibrary);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast("");
      setRemovedMovie(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const statusCounts = useMemo(() => ({
    All: movies.length,
    "To Watch": movies.filter((movie) => movie.watchlistStatus === "To Watch").length,
    Watching: movies.filter((movie) => movie.watchlistStatus === "Watching").length,
    Watched: movies.filter((movie) => movie.watchlistStatus === "Watched").length,
  }), [movies]);

  const genreOptions = useMemo(() => {
    const genres = new Set();
    movies.forEach((movie) => movie.genres?.forEach((genre) => genres.add(genre.name)));
    return ["All", ...Array.from(genres).sort()];
  }, [movies]);

  const visibleMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = movies.filter((movie) => {
      if (statusFilter !== "All" && movie.watchlistStatus !== statusFilter) return false;
      if (genreFilter !== "All" && !movie.genres?.some((genre) => genre.name === genreFilter)) return false;
      if (normalizedQuery) {
        const director = movie.credits?.crew?.find((person) => person.job === "Director")?.name || "";
        if (!`${movie.title} ${director}`.toLowerCase().includes(normalizedQuery)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "rating_high") return (b.vote_average || 0) - (a.vote_average || 0);
      if (sortBy === "year_desc") return (b.release_date || "").localeCompare(a.release_date || "");
      if (sortBy === "title_asc") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "runtime_desc") return (b.runtime || 0) - (a.runtime || 0);
      const ids = getWatchlist();
      return ids.indexOf(String(b.id)) - ids.indexOf(String(a.id));
    });
  }, [movies, statusFilter, genreFilter, query, sortBy]);

  const totalMinutes = movies.reduce((sum, movie) => sum + (movie.runtime || 0), 0);
  const averageRating = movies.length
    ? movies.reduce((sum, movie) => sum + (movie.vote_average || 0), 0) / movies.length
    : 0;
  const completion = movies.length ? Math.round((statusCounts.Watched / movies.length) * 100) : 0;

  function cycleStatus(movie) {
    const currentIndex = STATUS_OPTIONS.indexOf(movie.watchlistStatus);
    const nextStatus = STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];
    setWatchlistStatus(movie.id, nextStatus);
    setMovies((current) => current.map((item) =>
      item.id === movie.id ? { ...item, watchlistStatus: nextStatus } : item,
    ));
  }

  function toggleFavorite(movie) {
    toggleFavoriteMovie(movie.id);
    setFavoriteIds(getFavorites());
  }

  function removeMovie(movie) {
    const index = getWatchlist().indexOf(String(movie.id));
    toggleWatchlistMovie(movie.id);
    setRemovedMovie({ movie, index });
    setMovies((current) => current.filter((item) => item.id !== movie.id));
    setToast(`Removed "${movie.title}" from WatchList`);
  }

  function undoRemoval() {
    if (!removedMovie) return;
    const ids = getWatchlist();
    const id = String(removedMovie.movie.id);
    if (!ids.includes(id)) {
      toggleWatchlistMovie(id);
    }
    setMovies((current) => {
      const next = [...current];
      const targetIndex = Math.min(
        removedMovie.index >= 0 ? removedMovie.index : next.length,
        next.length,
      );
      next.splice(targetIndex, 0, removedMovie.movie);
      return next;
    });
    setRemovedMovie(null);
    setToast("Movie restored to WatchList");
  }

  if (isAuthLoading || authError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <p role={authError ? "alert" : undefined} className={authError ? "text-red-300" : "text-slate-400"}>
            {authError ? "Unable to restore your session. Refresh the page to try again." : "Restoring your session..."}
          </p>
        </main>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Your WatchList</h1>
          <p className="mt-3 text-slate-400">Log in to save and view your WatchList.</p>
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-sky-500 px-5 py-3 font-bold text-slate-950">
            Log in
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B131E] text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 lg:px-8">
        <section className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-sky-500" />
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My WatchList</h1>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-400">
                {movies.length} {movies.length === 1 ? "Movie" : "Movies"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>}
              label="Total Watch Time"
              value={formatRuntime(totalMinutes)}
              tone="sky"
            />
            <StatCard
              icon={<Icon><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></Icon>}
              label="Status Progress"
              value={`${statusCounts.Watched} / ${movies.length} Watched`}
              tone="emerald"
            />
            <StatCard
              icon={<Icon><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></Icon>}
              label="Average Rating"
              value={`★ ${averageRating.toFixed(1)} / 10`}
              tone="amber"
            />
            <div className="flex flex-col justify-center space-y-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-400">Completion Rate</span>
                <span className="font-bold text-sky-400">{completion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        </section>

        {loadError && movies.length > 0 && (
          <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {loadError} {movies.length > 0
              ? "The movies that loaded are still shown."
              : "Your WatchList is not empty; please try again later."}
            {failedMovieCount > 0 && ` (${failedMovieCount} failed).`}
          </p>
        )}

        <section className="space-y-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {["All", ...STATUS_OPTIONS].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    statusFilter === status
                      ? "border border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20"
                      : "border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {status} <span className={statusFilter === status ? "opacity-80" : "text-slate-400"}>({statusCounts[status]})</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-48 lg:w-44">
                <Icon className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></Icon>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter title..."
                  className="w-full rounded-xl border border-slate-700 bg-[#111A26] py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
              <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-[#111A26] px-3 py-2 text-xs font-medium text-slate-200 outline-none focus:border-sky-500">
                {genreOptions.map((genre) => <option key={genre} value={genre}>{genre === "All" ? "All Genres" : genre}</option>)}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-slate-700 bg-[#111A26] px-3 py-2 text-xs font-medium text-slate-200 outline-none focus:border-sky-500">
                <option value="recently_added">Recently Added</option>
                <option value="rating_high">Rating (High to Low)</option>
                <option value="year_desc">Release Year</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="runtime_desc">Runtime (Longest)</option>
              </select>
              <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-[#111A26] p-1">
                <button type="button" title="Grid view" onClick={() => setViewMode("grid")} className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${viewMode === "grid" ? "border border-sky-500/40 bg-sky-500/20 text-sky-400" : "text-slate-400"}`}>
                  <Icon className="h-3 w-3"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>
                </button>
                <button type="button" title="List view" onClick={() => setViewMode("list")} className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${viewMode === "list" ? "border border-sky-500/40 bg-sky-500/20 text-sky-400" : "text-slate-400"}`}>
                  <Icon className="h-3 w-3"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" /></Icon>
                </button>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <p className="py-12 text-center text-slate-400">Loading your WatchList...</p>
        ) : visibleMovies.length === 0 && movies.length === 0 && loadError ? (
          <div role="alert" className="mx-auto my-12 max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-12 text-center">
            <h2 className="text-xl font-bold">Unable to load your WatchList</h2>
            <p className="mt-3 text-sm text-slate-400">{loadError} Your saved movies may still be available; please try again later.</p>
          </div>
        ) : visibleMovies.length === 0 ? (
          <div className="mx-auto my-12 max-w-md space-y-4 rounded-3xl border border-slate-700/80 bg-slate-900 p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-400">
              <Icon className="h-8 w-8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></Icon>
            </div>
            <h2 className="text-xl font-bold">No Movies Found</h2>
            <p className="text-sm text-slate-400">
              {movies.length === 0
                ? "You have not added any movies to your WatchList yet."
                : "No titles match your current search or filter criteria."}
            </p>
            {movies.length > 0 && (
              <button type="button" onClick={() => { setStatusFilter("All"); setGenreFilter("All"); setQuery(""); }} className="mt-2 rounded-full bg-sky-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-400">
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 transition-all sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visibleMovies.map((movie) => (
              <GridMovieCard
                key={movie.id}
                movie={movie}
                favorite={favoriteIds.includes(String(movie.id))}
                onStatus={() => cycleStatus(movie)}
                onFavorite={() => toggleFavorite(movie)}
                onRemove={() => removeMovie(movie)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleMovies.map((movie) => (
              <ListMovieRow
                key={movie.id}
                movie={movie}
                favorite={favoriteIds.includes(String(movie.id))}
                onStatus={() => cycleStatus(movie)}
                onFavorite={() => toggleFavorite(movie)}
                onRemove={() => removeMovie(movie)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex min-w-[280px] items-center justify-between gap-4 rounded-2xl border border-sky-500/40 bg-slate-900 px-4 py-3 text-xs text-white shadow-2xl">
          <span>{toast}</span>
          {removedMovie && (
            <button type="button" onClick={undoRemoval} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  const tones = {
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 sm:gap-4 sm:p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block text-xs font-medium text-slate-400">{label}</span>
        <span className="block truncate text-base font-bold text-white sm:text-lg">{value}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status, onClick, compact = false }) {
  const styles = status === "Watched"
    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
    : status === "Watching"
      ? "border-amber-500/40 bg-amber-500/20 text-amber-400"
      : "border-sky-500/40 bg-sky-500/20 text-sky-400";
  return (
    <button type="button" onClick={onClick} title="Click to change status" className={`${styles} ${compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"} flex items-center gap-1.5 rounded-xl border font-semibold uppercase tracking-wider transition hover:scale-105`}>
      <Icon className="h-3 w-3">
        {status === "Watched" ? <path d="m5 12 4 4L19 7" /> : status === "Watching" ? <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></> : <path d="M6 3h12v18l-6-4-6 4V3Z" />}
      </Icon>
      {status}
    </button>
  );
}

function GridMovieCard({ movie, favorite, onStatus, onFavorite, onRemove }) {
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-lg transition duration-300 hover:border-sky-400/40 hover:bg-slate-800">
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
        {poster ? <Link to={`/movie/${movie.id}`}><img src={poster} alt={movie.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link> : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">No poster</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={movie.watchlistStatus} onClick={onStatus} compact />
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button type="button" title={favorite ? "Remove favorite" : "Add favorite"} onClick={onFavorite} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black">
            <Icon className={`h-3.5 w-3.5 ${favorite ? "fill-rose-500 text-rose-500" : "text-slate-300"}`}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></Icon>
          </button>
          <button type="button" title="Remove from WatchList" onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-rose-600/80">
            <Icon className="h-3.5 w-3.5"><path d="m6 6 12 12M18 6 6 18" /></Icon>
          </button>
        </div>
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-medium text-slate-300">
          <span>{movie.runtime ? formatRuntime(movie.runtime) : "N/A"}</span>
          <span>{year}</span>
        </div>
      </div>
      <div className="flex min-h-[168px] flex-1 flex-col p-4">
        <Link to={`/movie/${movie.id}`}>
          <h2 className="h-12 line-clamp-2 text-base font-bold leading-6 text-white transition-colors group-hover:text-sky-400">{movie.title}</h2>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-300">★ {(movie.vote_average || 0).toFixed(1)}</span>
          <span className="rounded-md border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-xs font-semibold text-sky-300">{year}</span>
        </div>
        <div className="mt-auto flex min-h-10 flex-wrap content-end items-end gap-1 pt-3">
          {movie.genres?.slice(0, 3).map((genre) => (
            <span key={genre.id} className="rounded border border-slate-700 bg-[#0D1520] px-2 py-0.5 text-[10px] text-slate-400">{genre.name}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function ListMovieRow({ movie, favorite, onStatus, onFavorite, onRemove }) {
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : "";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const director = movie.credits?.crew?.find((person) => person.job === "Director");
  return (
    <article className="group flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-700/80 bg-slate-900 p-4 transition duration-300 hover:border-sky-400/40 hover:bg-slate-800 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link to={`/movie/${movie.id}`} className="h-28 w-20 shrink-0 overflow-hidden rounded-xl">
          {poster ? <img src={poster} alt={movie.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-slate-800 text-xs text-slate-500">N/A</div>}
        </Link>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/movie/${movie.id}`} className="text-base font-bold text-white group-hover:text-sky-400">{movie.title}</Link>
            <span className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">{year}</span>
            {director && <span className="text-xs text-slate-400">Dir. {director.name}</span>}
          </div>
          <p className="line-clamp-2 max-w-2xl text-xs text-slate-300">{movie.overview || "No description available."}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="font-bold text-amber-300">★ {(movie.vote_average || 0).toFixed(1)} / 10</span>
            <span className="text-slate-400">{movie.runtime ? formatRuntime(movie.runtime) : "Runtime N/A"}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-center">
        <StatusBadge status={movie.watchlistStatus} onClick={onStatus} />
        <Link to={`/movie/${movie.id}`} className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500 hover:text-white">
          Details
        </Link>
        <button type="button" title="Toggle favorite" onClick={onFavorite} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-[#111A26] hover:border-rose-500/50">
          <Icon className={`h-3.5 w-3.5 ${favorite ? "fill-rose-500 text-rose-500" : "text-slate-400"}`}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></Icon>
        </button>
        <button type="button" title="Remove" onClick={onRemove} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-[#111A26] text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-400">
          <Icon className="h-3.5 w-3.5"><path d="M3 6h18M8 6V3h8v3M19 6l-1 15H6L5 6M10 10v7M14 10v7" /></Icon>
        </button>
      </div>
    </article>
  );
}