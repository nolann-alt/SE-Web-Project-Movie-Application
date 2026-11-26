import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMovieDetails } from "../api/tmdb";
import { useAuth } from "../services/auth";
import { loadMoviesIndividually } from "../utils/loadMoviesIndividually";
import {
  getFavorites,
  getFavoriteMetadata,
  getPinnedFavorite,
  getWatchlist,
  setFavoriteMetadata,
  setPinnedFavorite,
  toggleFavoriteMovie,
  toggleWatchlistMovie,
} from "../services/movieLists";

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

export default function Favorites() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const currentUserId = user?.id ?? null;
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedMovieCount, setFailedMovieCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("personal_rating_desc");
  const [viewMode, setViewMode] = useState("grid");
  const [watchlistIds, setWatchlistIds] = useState(getWatchlist());
  const [pinnedId, setPinnedId] = useState(getPinnedFavorite());
  const [removedMovie, setRemovedMovie] = useState(null);
  const [toast, setToast] = useState("");
  const [editingMovie, setEditingMovie] = useState(null);
  const [editRating, setEditRating] = useState(8);
  const [editReview, setEditReview] = useState("");

  useEffect(() => {
    if (isAuthLoading) return undefined;
    if (!currentUserId) {
      setMovies([]);
      setFailedMovieCount(0);
      setLoadError("");
      setWatchlistIds([]);
      setPinnedId(null);
      setLoading(false);
      return undefined;
    }

    const ids = getFavorites();
    setWatchlistIds(getWatchlist());
    setLoading(true);
    setMovies([]);
    setFailedMovieCount(0);
    setLoadError("");
    if (ids.length === 0) {
      setMovies([]);
      setLoading(false);
      setPinnedId(null);
      setPinnedFavorite(null);
      return undefined;
    }

    let isActive = true;
    loadMoviesIndividually(ids, async (id) => {
      const movie = await getMovieDetails(id);
      return {
        ...movie,
        personal: getFavoriteMetadata(movie.id),
      };
    })
      .then(({ movies: withMetadata, failedCount }) => {
        if (!isActive) return;
        setMovies(withMetadata);
        setFailedMovieCount(failedCount);
        if (failedCount > 0) {
          setLoadError("Some favorite movies could not be loaded.");
        }

        if (withMetadata.length === 0) {
          setPinnedId(null);
          return;
        }

        const savedPinnedId = getPinnedFavorite();
        const savedPinnedMovieIsInCollection = ids.includes(savedPinnedId);
        const validPinnedId = withMetadata.some((movie) => String(movie.id) === savedPinnedId)
          ? savedPinnedId
          : savedPinnedMovieIsInCollection
            ? savedPinnedId
            : String(withMetadata[0].id);
        setPinnedId(validPinnedId);
        if (!savedPinnedId) setPinnedFavorite(validPinnedId);
      })
      .catch(() => {
        if (isActive) setLoadError("Unable to load your favorite movies.");
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
      setWatchlistIds(getWatchlist());
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

  const genreOptions = useMemo(() => {
    const genres = new Set();
    movies.forEach((movie) => movie.genres?.forEach((genre) => genres.add(genre.name)));
    return ["All", ...Array.from(genres).sort()];
  }, [movies]);

  const visibleMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = movies.filter((movie) => {
      if (genreFilter !== "All" && !movie.genres?.some((genre) => genre.name === genreFilter)) return false;
      if (normalizedQuery) {
        const director = movie.credits?.crew?.find((person) => person.job === "Director")?.name || "";
        if (!`${movie.title} ${director}`.toLowerCase().includes(normalizedQuery)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "personal_rating_desc") return (b.personal.rating || 0) - (a.personal.rating || 0);
      if (sortBy === "filmsphere_rating_desc") return (b.vote_average || 0) - (a.vote_average || 0);
      if (sortBy === "year_desc") return (b.release_date || "").localeCompare(a.release_date || "");
      if (sortBy === "title_asc") return (a.title || "").localeCompare(b.title || "");
      const ids = getFavorites();
      return ids.indexOf(String(b.id)) - ids.indexOf(String(a.id));
    });
  }, [movies, genreFilter, query, sortBy]);

  const pinnedMovie = movies.find((movie) => String(movie.id) === pinnedId) || movies[0] || null;
  const genreCounts = useMemo(() => {
    const counts = {};
    movies.forEach((movie) => movie.genres?.forEach((genre) => {
      counts[genre.name] = (counts[genre.name] || 0) + 1;
    }));
    return counts;
  }, [movies]);
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
  const averagePersonalRating = movies.length
    ? movies.reduce((sum, movie) => sum + (movie.personal.rating || 0), 0) / movies.length
    : 0;
  const totalMinutes = movies.reduce((sum, movie) => sum + (movie.runtime || 0), 0);
  const directorCounts = useMemo(() => {
    const counts = {};
    movies.forEach((movie) => {
      const director = movie.credits?.crew?.find((person) => person.job === "Director");
      if (director) counts[director.name] = (counts[director.name] || 0) + 1;
    });
    return counts;
  }, [movies]);
  const topDirector = Object.entries(directorCounts).sort((a, b) => b[1] - a[1])[0];

  function toggleWatchlist(movie) {
    toggleWatchlistMovie(movie.id);
    setWatchlistIds(getWatchlist());
    setToast(getWatchlist().includes(String(movie.id))
      ? `"${movie.title}" added to your WatchList`
      : `"${movie.title}" removed from your WatchList`);
  }

  function removeFavorite(movie) {
    const index = getFavorites().indexOf(String(movie.id));
    toggleFavoriteMovie(movie.id);
    setRemovedMovie({ movie, index });
    setMovies((current) => current.filter((item) => item.id !== movie.id));
    setToast(`"${movie.title}" removed from Favorites`);

    if (String(movie.id) === pinnedId) {
      const nextMovie = movies.find((item) => item.id !== movie.id);
      const nextPinnedId = nextMovie ? String(nextMovie.id) : null;
      setPinnedId(nextPinnedId);
      setPinnedFavorite(nextPinnedId);
    }
  }

  function undoRemoval() {
    if (!removedMovie) return;
    const id = String(removedMovie.movie.id);
    if (!getFavorites().includes(id)) toggleFavoriteMovie(id);
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
    setToast("Favorite restored");
  }

  function pinMovie(movie) {
    setPinnedId(String(movie.id));
    setPinnedFavorite(movie.id);
    setToast(`"${movie.title}" pinned as your favorite`);
  }

  function openReviewEditor(movie) {
    setEditingMovie(movie);
    setEditRating(movie.personal.rating || 8);
    setEditReview(movie.personal.review || "");
  }

  function saveReview() {
    if (!editingMovie) return;
    const metadata = { rating: editRating, review: editReview.trim() };
    setFavoriteMetadata(editingMovie.id, metadata);
    setMovies((current) => current.map((movie) =>
      movie.id === editingMovie.id ? { ...movie, personal: metadata } : movie,
    ));
    setToast(`Review updated for "${editingMovie.title}"`);
    setEditingMovie(null);
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
          <h1 className="text-3xl font-bold">My Favorites</h1>
          <p className="mt-3 text-slate-400">Log in to save and view your favorite movies.</p>
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-rose-600 px-5 py-3 font-bold text-white">
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
          <div className="flex items-center gap-3">
            <span className="h-8 w-1.5 rounded-full bg-rose-500" />
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My Favorites</h1>
            <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-400">
              <Icon className="h-2.5 w-2.5 fill-rose-400"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" /></Icon>
              {movies.length} {movies.length === 1 ? "Movie" : "Movies"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <FavoriteStat icon={<Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></Icon>} label="Top Genre" value={topGenre ? `${topGenre[0]} (${topGenre[1]})` : "N/A"} tone="rose" />
            <FavoriteStat icon={<Icon><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></Icon>} label="My Average Rating" value={`★ ${averagePersonalRating.toFixed(1)} / 10`} tone="amber" />
            <FavoriteStat icon={<Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>} label="Favorite Runtime" value={formatRuntime(totalMinutes)} tone="sky" />
            <FavoriteStat icon={<Icon><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 6V4h8v2M8 18v2M16 18v2" /></Icon>} label="Top Director" value={topDirector ? topDirector[0] : "N/A"} tone="purple" />
          </div>
        </section>

        {loadError && movies.length > 0 && (
          <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {loadError} {movies.length > 0
              ? "The movies that loaded are still shown."
              : "Your Favorites are not empty; please try again later."}
            {failedMovieCount > 0 && ` (${failedMovieCount} failed).`}
          </p>
        )}

        {!loading && pinnedMovie && (
          <section className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 shadow-2xl">
            {pinnedMovie.backdrop_path && (
              <img src={`https://image.tmdb.org/t/p/w1280${pinnedMovie.backdrop_path}`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-sm" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-6 p-6 sm:p-8 md:flex-row md:items-start">
              <Link to={`/movie/${pinnedMovie.id}`} className="relative h-64 w-44 shrink-0 overflow-hidden rounded-2xl border-2 border-rose-500/50 shadow-2xl">
                {pinnedMovie.poster_path
                  ? <img src={`https://image.tmdb.org/t/p/w500${pinnedMovie.poster_path}`} alt={pinnedMovie.title} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center bg-slate-800 text-slate-500">No poster</div>}
                <span className="absolute left-2 top-2 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Favorite #1</span>
              </Link>
              <div className="flex-1 space-y-3 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">
                  <Icon className="h-3 w-3 fill-amber-400 text-amber-400"><path d="m12 3 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 21l1.1-6.4L2.5 10l6.5-1 3-6Z" /></Icon>
                  My Top Favorite
                </span>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{pinnedMovie.title}</h2>
                <div className="flex flex-wrap justify-center gap-3 text-xs font-bold md:justify-start">
                  <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
                    FilmSphere: {(pinnedMovie.vote_average || 0).toFixed(1)} / 10
                  </span>
                  <span className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-300">
                    My Rating: {(pinnedMovie.personal.rating || 0).toFixed(1)} / 10
                  </span>
                </div>
                {pinnedMovie.personal.review && (
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-left backdrop-blur">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-400">My Review</span>
                    <p className="mt-1 text-xs italic leading-relaxed text-slate-200">"{pinnedMovie.personal.review}"</p>
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                  <Link to={`/movie/${pinnedMovie.id}`} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500">
                    View Movie
                  </Link>
                  <button type="button" onClick={() => openReviewEditor(pinnedMovie)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-sky-400/60">
                    Edit Rating & Review
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 lg:flex-row lg:items-center">
          <div className="relative max-w-md flex-1">
            <Icon className="absolute left-3.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></Icon>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter title or director..." className="w-full rounded-xl border border-slate-700 bg-[#111A26] py-2.5 pl-9 pr-4 text-xs text-white outline-none placeholder:text-slate-500 focus:border-rose-500" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-[#111A26] px-3 py-2.5 text-xs font-medium text-slate-200 outline-none focus:border-rose-500">
              {genreOptions.map((genre) => <option key={genre} value={genre}>{genre === "All" ? "All Genres" : genre}</option>)}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-slate-700 bg-[#111A26] px-3 py-2.5 text-xs font-medium text-slate-200 outline-none focus:border-rose-500">
              <option value="personal_rating_desc">My Rating (Highest)</option>
              <option value="recently_added">Recently Added</option>
              <option value="filmsphere_rating_desc">FilmSphere Rating</option>
              <option value="year_desc">Release Year</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
            <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-[#111A26] p-1">
              <button type="button" title="Grid view" onClick={() => setViewMode("grid")} className={`flex h-8 w-8 items-center justify-center rounded-lg ${viewMode === "grid" ? "border border-rose-500/40 bg-rose-500/20 text-rose-400" : "text-slate-400"}`}>
                <Icon className="h-3 w-3"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>
              </button>
              <button type="button" title="List view" onClick={() => setViewMode("list")} className={`flex h-8 w-8 items-center justify-center rounded-lg ${viewMode === "list" ? "border border-rose-500/40 bg-rose-500/20 text-rose-400" : "text-slate-400"}`}>
                <Icon className="h-3 w-3"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" /></Icon>
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <p className="py-12 text-center text-slate-400">Loading your favorites...</p>
        ) : visibleMovies.length === 0 && movies.length === 0 && loadError ? (
          <div role="alert" className="mx-auto my-12 max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-12 text-center">
            <h2 className="text-xl font-bold">Unable to load your Favorites</h2>
            <p className="mt-3 text-sm text-slate-400">{loadError} Your saved movies may still be available; please try again later.</p>
          </div>
        ) : visibleMovies.length === 0 ? (
          <div className="mx-auto my-12 max-w-md space-y-4 rounded-3xl border border-slate-700/80 bg-slate-900 p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400">
              <Icon className="h-8 w-8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" /></Icon>
            </div>
            <h2 className="text-xl font-bold">No Favorite Movies Found</h2>
            <p className="text-sm text-slate-400">
              {movies.length === 0 ? "You have not added any favorite movies yet." : "No titles match your search or genre filter."}
            </p>
            {movies.length > 0 && (
              <button type="button" onClick={() => { setGenreFilter("All"); setQuery(""); }} className="mt-2 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-500">
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 transition-all sm:grid-cols-2 md:grid-cols-3">
            {visibleMovies.map((movie) => (
              <FavoriteGridCard
                key={movie.id}
                movie={movie}
                pinned={String(movie.id) === pinnedId}
                inWatchlist={watchlistIds.includes(String(movie.id))}
                onPin={() => pinMovie(movie)}
                onRemove={() => removeFavorite(movie)}
                onWatchlist={() => toggleWatchlist(movie)}
                onEdit={() => openReviewEditor(movie)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleMovies.map((movie, index) => (
              <FavoriteListRow
                key={movie.id}
                movie={movie}
                rank={index + 1}
                pinned={String(movie.id) === pinnedId}
                inWatchlist={watchlistIds.includes(String(movie.id))}
                onPin={() => pinMovie(movie)}
                onRemove={() => removeFavorite(movie)}
                onWatchlist={() => toggleWatchlist(movie)}
                onEdit={() => openReviewEditor(movie)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="flex items-center gap-2 text-base font-bold">
                Edit My Rating & Review
              </h2>
              <button type="button" onClick={() => setEditingMovie(null)} className="text-slate-400 hover:text-white" aria-label="Close">✕</button>
            </div>
            <label className="block text-xs font-semibold text-slate-300">
              My Rating: <span className="text-base font-bold text-rose-400">{editRating.toFixed(1)}</span> / 10
              <input type="range" min="1" max="10" step="0.1" value={editRating} onChange={(event) => setEditRating(Number(event.target.value))} className="mt-2 w-full accent-rose-500" />
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              My Review
              <textarea rows="4" value={editReview} onChange={(event) => setEditReview(event.target.value)} placeholder="A personal thought about this movie..." className="mt-1 w-full resize-none rounded-xl border border-slate-700 bg-[#111A26] p-3 text-xs text-slate-200 outline-none focus:border-rose-500" />
            </label>
            <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
              <button type="button" onClick={() => setEditingMovie(null)} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300">Cancel</button>
              <button type="button" onClick={saveReview} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex min-w-[280px] items-center justify-between gap-4 rounded-2xl border border-rose-500/40 bg-slate-900 px-4 py-3 text-xs text-white shadow-2xl">
          <span>{toast}</span>
          {removedMovie && (
            <button type="button" onClick={undoRemoval} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FavoriteStat({ icon, label, value, tone }) {
  const tones = {
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-400",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 transition hover:border-slate-600">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block text-xs font-medium text-slate-400">{label}</span>
        <span className="block truncate text-sm font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

function FavoriteGridCard({ movie, pinned, inWatchlist, onPin, onRemove, onWatchlist, onEdit }) {
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-slate-900 shadow-lg transition duration-300 ${pinned ? "border-rose-500/60 ring-1 ring-rose-500/30" : "border-slate-700/80 hover:border-rose-400/40"}`}>
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
        {poster ? <Link to={`/movie/${movie.id}`}><img src={poster} alt={movie.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link> : <div className="flex h-full items-center justify-center text-slate-500">No poster</div>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/50" />
        <div className="absolute left-3 top-3 rounded-lg bg-rose-600/90 px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
          ★ My Rating: {(movie.personal.rating || 0).toFixed(1)}
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button type="button" title={pinned ? "Top favorite" : "Pin as top favorite"} onClick={onPin} className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md ${pinned ? "bg-amber-500 text-slate-950" : "bg-black/60 text-slate-300 hover:text-amber-400"}`}>
            <Icon className="h-3.5 w-3.5 fill-current"><path d="m12 3 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 21l1.1-6.4L2.5 10l6.5-1 3-6Z" /></Icon>
          </button>
          <button type="button" title="Remove from Favorites" onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700">
            <Icon className="h-3.5 w-3.5 fill-current"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" /></Icon>
          </button>
        </div>
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-semibold text-slate-300">
          <span>{movie.runtime ? formatRuntime(movie.runtime) : "N/A"}</span>
          <span className="text-amber-400">★ {(movie.vote_average || 0).toFixed(1)}</span>
        </div>
      </div>
      <div className="flex min-h-[194px] flex-1 flex-col p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <Link to={`/movie/${movie.id}`} className="h-12 line-clamp-2 text-base font-bold leading-6 text-white group-hover:text-rose-400">{movie.title}</Link>
            <span className="shrink-0 rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">{year}</span>
          </div>
          <div className="mt-2.5 min-h-[74px] rounded-xl border border-slate-700/80 bg-[#0D1520] p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">My Review</span>
              <button type="button" onClick={onEdit} className="text-[10px] text-slate-400 hover:text-sky-400">Edit</button>
            </div>
            {movie.personal.review
              ? <p className="mt-1 line-clamp-2 text-[11px] italic leading-relaxed text-slate-300">"{movie.personal.review}"</p>
              : <p className="mt-1 text-[11px] italic text-slate-500">No personal review yet.</p>}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-700/50 pt-3">
          <button type="button" onClick={onWatchlist} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${inWatchlist ? "border-sky-500/40 bg-sky-500/15 text-sky-400" : "border-slate-700 text-slate-300 hover:bg-sky-500/20 hover:text-sky-400"}`}>
            {inWatchlist ? "✓ In WatchList" : "+ WatchList"}
          </button>
          <Link to={`/movie/${movie.id}`} className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-400 hover:bg-rose-600 hover:text-white">View</Link>
        </div>
      </div>
    </article>
  );
}

function FavoriteListRow({ movie, rank, pinned, inWatchlist, onPin, onRemove, onWatchlist, onEdit }) {
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : "";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const director = movie.credits?.crew?.find((person) => person.job === "Director");
  return (
    <article className={`group flex flex-col items-start justify-between gap-4 rounded-2xl border p-4 transition duration-300 lg:flex-row lg:items-center ${pinned ? "border-rose-500/60 ring-1 ring-rose-500/30" : "border-slate-700/80 hover:border-rose-400/40"} bg-slate-900`}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${rank === 1 ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30" : "bg-slate-800 text-slate-300"}`}>#{rank}</div>
        <Link to={`/movie/${movie.id}`} className="h-24 w-16 shrink-0 overflow-hidden rounded-xl">
          {poster ? <img src={poster} alt={movie.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-slate-800 text-xs text-slate-500">N/A</div>}
        </Link>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/movie/${movie.id}`} className="text-base font-bold text-white group-hover:text-rose-400">{movie.title}</Link>
            <span className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">{year}</span>
            {director && <span className="text-xs text-slate-400">By {director.name}</span>}
          </div>
          {movie.personal.review && <p className="line-clamp-1 max-w-xl text-xs italic text-slate-300">"{movie.personal.review}"</p>}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="rounded border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-rose-400">My Rating: {(movie.personal.rating || 0).toFixed(1)} / 10</span>
            <span className="text-slate-400">FilmSphere: ★ {(movie.vote_average || 0).toFixed(1)}</span>
            <span className="text-slate-400">{movie.runtime ? formatRuntime(movie.runtime) : "Runtime N/A"}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 self-end md:self-center">
        <button type="button" onClick={onEdit} className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-sky-400/50">Edit</button>
        <button type="button" onClick={onWatchlist} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${inWatchlist ? "border-sky-500/40 bg-sky-500/20 text-sky-400" : "border-slate-700 text-slate-300"}`}>
          {inWatchlist ? "✓ WatchList" : "+ WatchList"}
        </button>
        <button type="button" title="Pin as top favorite" onClick={onPin} className={`flex h-9 w-9 items-center justify-center rounded-xl ${pinned ? "bg-amber-500 text-slate-950" : "border border-slate-700 bg-[#111A26] text-slate-400 hover:text-amber-400"}`}>
          <Icon className="h-3 w-3 fill-current"><path d="m12 3 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 21l1.1-6.4L2.5 10l6.5-1 3-6Z" /></Icon>
        </button>
        <button type="button" title="Remove favorite" onClick={onRemove} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white">
          <Icon className="h-3 w-3 fill-current"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" /></Icon>
        </button>
      </div>
    </article>
  );
}
