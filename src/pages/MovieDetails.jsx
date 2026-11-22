import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getMovieDetails } from "../api/tmdb";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../services/auth";
import {
  addMovieReview,
  getFavorites,
  getMovieReviews,
  getWatchlist,
  toggleFavoriteMovie,
  toggleWatchlistMovie,
} from "../services/movieLists";

const imageUrl = (path, size = "w780") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : "";

export default function MovieDetails() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(8);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [accountPromptMessage, setAccountPromptMessage] = useState("");

  useEffect(() => {
    setError("");
    setMovie(null);
    getMovieDetails(movieId)
      .then(setMovie)
      .catch(() => setError("Unable to load this movie."));
  }, [movieId]);

  useEffect(() => {
    setInWatchlist(getWatchlist().includes(String(movieId)));
    setIsFavorite(getFavorites().includes(String(movieId)));
    setReviews(getMovieReviews(movieId));
  }, [movieId]);

  useEffect(() => {
    function updateLibraryState() {
      setInWatchlist(getWatchlist().includes(String(movieId)));
      setIsFavorite(getFavorites().includes(String(movieId)));
    }
    window.addEventListener("filmsphere-auth-updated", updateLibraryState);
    window.addEventListener("filmsphere-library-updated", updateLibraryState);
    return () => {
      window.removeEventListener("filmsphere-auth-updated", updateLibraryState);
      window.removeEventListener("filmsphere-library-updated", updateLibraryState);
    };
  }, [movieId]);

  function requireAccount(message) {
    setAccountPromptMessage(message);
    setShowAccountPrompt(true);
  }

  function handleWatchlist() {
    if (!getCurrentUser()) {
      requireAccount("Log in or create an account before saving movies to your WatchList.");
      return;
    }
    setInWatchlist(toggleWatchlistMovie(movieId));
  }

  function handleFavorite() {
    if (!getCurrentUser()) {
      requireAccount("Log in or create an account before adding movies to your favorites.");
      return;
    }
    setIsFavorite(toggleFavoriteMovie(movieId));
  }

  function handleReviewSubmit(event) {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      requireAccount("Log in or create an account before posting your review.");
      return;
    }

    const author = currentUser.includes("@")
      ? currentUser.split("@")[0]
      : currentUser;

    const review = {
      id: Date.now(),
      author,
      text: reviewText.trim(),
      rating,
      createdAt: "Just now",
    };
    addMovieReview(movieId, review);
    setReviews((current) => [review, ...current]);
    setReviewText("");
    setRating(8);
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <p className="p-8 text-red-300">{error}</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <p className="p-8 text-slate-400">Loading movie...</p>
      </div>
    );
  }

  const director = movie.credits?.crew?.find((person) => person.job === "Director");
  const writers = movie.credits?.crew
    ?.filter((person) => ["Writer", "Screenplay", "Original Story"].includes(person.job))
    .slice(0, 3);
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const trailer = movie.videos?.results?.find(
    (video) => video.site === "YouTube" && video.type === "Trailer"
  ) || movie.videos?.results?.find((video) => video.site === "YouTube");
  const usRelease = movie.release_dates?.results?.find((entry) => entry.iso_3166_1 === "US");
  const certification = usRelease?.release_dates?.find((entry) => entry.certification)?.certification;
  const genres = movie.genres?.map((genre) => genre.name).join(" • ");
  const hours = Math.floor((movie.runtime || 0) / 60);
  const minutes = (movie.runtime || 0) % 60;
  const production = movie.production_companies?.map((company) => company.name).join(", ");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main>
        <section
          className="relative min-h-[500px] overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: movie.backdrop_path
              ? `url(${imageUrl(movie.backdrop_path, "original")})`
              : "none",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/35" />
          <div className="absolute inset-0 shadow-[inset_0_-80px_100px_rgba(2,6,23,0.75)]" />
          <div className="relative mx-auto min-h-[500px] max-w-7xl px-4 py-5 lg:px-8">
            <div className="mb-5 max-w-4xl">
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">{movie.title}</h1>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="mt-1 text-sm text-slate-400">Original title: {movie.original_title}</p>
              )}
              {movie.tagline && (
                <p className="mt-1.5 text-sm italic text-sky-300 sm:text-base">"{movie.tagline}"</p>
              )}
            </div>

            <div className="flex w-full flex-col gap-6 md:flex-row md:items-end">
              {movie.poster_path ? (
                <img
                  src={imageUrl(movie.poster_path, "w500")}
                  alt={`${movie.title} poster`}
                  className="mx-auto h-[360px] w-[240px] rounded-2xl border border-white/15 object-cover shadow-[0_24px_60px_rgba(0,0,0,0.55)] md:mx-0"
                />
              ) : (
                <div className="mx-auto flex h-[360px] w-[240px] items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-400 md:mx-0">
                  No poster
                </div>
              )}

              <div className="max-w-3xl flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                  {certification && (
                    <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 font-semibold text-sky-300 backdrop-blur">
                      {certification}
                    </span>
                  )}
                  {genres && <span className="rounded-full border border-white/10 bg-slate-950/30 px-3 py-1 backdrop-blur">{genres}</span>}
                  {movie.release_date && <span className="text-slate-300">{movie.release_date.slice(0, 4)}</span>}
                </div>

                <div className="flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-slate-950/55 px-4 py-2.5 shadow-lg backdrop-blur-md">
                  <span className="text-xl text-amber-300" aria-hidden="true">★</span>
                  <div>
                    <span className="font-bold">{movie.vote_average?.toFixed(1) || "N/A"}</span>
                    <span className="text-xs text-slate-400"> / 10</span>
                    <p className="text-[10px] text-slate-400">{movie.vote_count?.toLocaleString()} votes</p>
                  </div>
                  {movie.runtime > 0 && (
                    <>
                      <div className="h-8 w-px bg-slate-700" />
                      <span className="text-xs text-slate-300">{hours}h {minutes}m</span>
                    </>
                  )}
                </div>

                <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                  {movie.overview || "No description is available for this movie."}
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  {trailer && (
                    <button
                      type="button"
                      onClick={() => setShowTrailer(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-400"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M8.25 5.4a1.25 1.25 0 0 1 1.91-1.06l9.1 6.6a1.25 1.25 0 0 1 0 2.12l-9.1 6.6a1.25 1.25 0 0 1-1.91-1.06V5.4Z" />
                      </svg>
                      Watch Trailer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleWatchlist}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      inWatchlist
                        ? "border-sky-400 bg-sky-400/20 text-sky-300"
                        : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-sky-400/60"
                    }`}
                  >
                    {inWatchlist ? "✓ In WatchList" : "+ Add to WatchList"}
                  </button>
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      isFavorite
                        ? "border-rose-400 bg-rose-400/20 text-rose-300"
                        : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-rose-400/60"
                    }`}
                  >
                    {isFavorite ? "♥ Favorited" : "♡ Favorite"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {cast.length > 0 && (
                <section>
                  <h2 className="mb-5 flex items-center gap-3 text-xl font-bold">
                    <span className="h-7 w-1 rounded-full bg-sky-400" />
                    Top Billed Cast
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {cast.map((person) => (
                      <article key={person.id} className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-3 text-center shadow-[0_10px_30px_rgba(2,6,23,0.15)] transition duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:bg-slate-900">
                        {person.profile_path ? (
                          <img
                            src={imageUrl(person.profile_path, "w185")}
                            alt={person.name}
                            className="mx-auto mb-3 h-16 w-16 rounded-full border-2 border-sky-400/20 object-cover"
                          />
                        ) : (
                          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-500">N/A</div>
                        )}
                        <h3 className="text-sm font-semibold">{person.name}</h3>
                        <p className="mt-1 text-xs text-slate-400">{person.character}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {trailer && (
                <section>
                  <h2 className="mb-5 flex items-center gap-3 text-xl font-bold">
                    <span className="h-7 w-1 rounded-full bg-sky-400" />
                    Official Trailer & Teasers
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowTrailer(true)}
                    className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_18px_45px_rgba(2,6,23,0.28)]"
                  >
                    {movie.backdrop_path && (
                      <img src={imageUrl(movie.backdrop_path, "w1280")} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-950/70 via-black/20 to-transparent">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-sky-500/95 shadow-[0_12px_35px_rgba(14,165,233,0.45)] transition group-hover:scale-110 group-hover:bg-sky-400">
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                          <path d="M8.25 5.4a1.25 1.25 0 0 1 1.91-1.06l9.1 6.6a1.25 1.25 0 0 1 0 2.12l-9.1 6.6a1.25 1.25 0 0 1-1.91-1.06V5.4Z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                </section>
              )}
            </div>

            <aside className="h-fit self-start rounded-2xl border border-slate-800/90 bg-slate-900/85 p-6 shadow-[0_16px_40px_rgba(2,6,23,0.22)] backdrop-blur lg:mt-12">
              <h2 className="mb-5 flex items-center gap-3 border-b border-slate-800 pb-3 text-lg font-bold">
                <span className="h-5 w-1 rounded-full bg-sky-400" />
                Movie Info
              </h2>
              <dl className="space-y-4 text-sm">
                {director && (
                  <div><dt className="text-xs font-semibold uppercase text-slate-400">Director</dt><dd className="mt-1 font-medium">{director.name}</dd></div>
                )}
                {writers?.length > 0 && (
                  <div className="border-t border-slate-800/80 pt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Writers</dt><dd className="mt-1 font-medium">{writers.map((person) => person.name).join(", ")}</dd></div>
                )}
                {movie.release_date && (
                  <div className="border-t border-slate-800/80 pt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Release Date</dt><dd className="mt-1 font-medium">{new Date(`${movie.release_date}T00:00:00`).toLocaleDateString("en-US", { dateStyle: "long" })}</dd></div>
                )}
                {movie.production_countries?.length > 0 && (
                  <div className="border-t border-slate-800/80 pt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Production Locations</dt><dd className="mt-1 text-slate-300">{movie.production_countries.map((country) => country.name).join(", ")}</dd></div>
                )}
                {movie.budget > 0 && (
                  <div className="border-t border-slate-800/80 pt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Budget</dt><dd className="mt-1 font-medium">${movie.budget.toLocaleString()}</dd></div>
                )}
                {production && (
                  <div className="border-t border-slate-800/80 pt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Production</dt><dd className="mt-1 text-slate-300">{production}</dd></div>
                )}
                {movie.original_language && (
                  <div className="border-t border-slate-800/80 pt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Original Language</dt><dd className="mt-1 font-medium">{movie.original_language.toUpperCase()}</dd></div>
                )}
              </dl>
            </aside>
          </div>

          <section>
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold">
              <span className="h-8 w-1 rounded-full bg-sky-400" />
              Community Reviews & Ratings
              {reviews.length > 0 && (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {reviews.length}
                </span>
              )}
            </h2>
            <div className="grid gap-8 lg:grid-cols-3">
              <form onSubmit={handleReviewSubmit} className="h-fit space-y-4 rounded-2xl border border-slate-800/90 bg-slate-900/85 p-6 shadow-[0_16px_40px_rgba(2,6,23,0.22)]">
                <h3 className="border-b border-slate-800 pb-3 text-lg font-bold">Write Your Review</h3>
                <label className="block text-xs text-slate-400">
                  Rating: <span className="font-bold text-sky-300">{rating} / 10</span>
                  <input type="range" min="1" max="10" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full accent-sky-400" />
                </label>
                <label className="block text-xs text-slate-400">
                  Your Review
                  <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} required rows="4" className="mt-1.5 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm leading-6 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15" />
                </label>
                <button type="submit" className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold shadow-[0_10px_25px_rgba(14,165,233,0.18)] transition hover:-translate-y-0.5 hover:bg-sky-400">Submit Review</button>
              </form>

              <div className="space-y-4 lg:col-span-2">
                {reviews.length === 0 ? (
                  <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">No local reviews yet. Be the first to review this movie.</p>
                ) : reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold">{review.author}</h3>
                        <p className="mt-1 text-xs text-slate-400">{review.createdAt}</p>
                      </div>
                      <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">★ {review.rating} / 10</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{review.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {showTrailer && trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-sm font-bold">{movie.title} - Trailer</h2>
              <button type="button" onClick={() => setShowTrailer(false)} className="text-slate-400 hover:text-white" aria-label="Close trailer">✕</button>
            </div>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                title={`${movie.title} trailer`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {showAccountPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="review-account-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10 text-sky-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
              </svg>
            </div>
            <h2 id="review-account-title" className="text-xl font-bold text-white">An account is required</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {accountPromptMessage || "Log in or create an account to continue."}
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/login"
                className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-sky-400/60 hover:text-sky-300"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-400"
              >
                Create account
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowAccountPrompt(false)}
              className="mt-4 text-sm text-slate-400 transition hover:text-white"
            >
              Continue browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
