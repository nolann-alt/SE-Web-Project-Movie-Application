import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { getWeeklyTrendingMovies } from "../api/tmdb";

// Big banner at the top
export default function Hero() {
  const [discoverMovies, setDiscoverMovies] = useState([]);
  const [discoverError, setDiscoverError] = useState("");
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [transition, setTransition] = useState(null);
  const transitionTimer = useRef(null);

  useEffect(() => {
    getWeeklyTrendingMovies()
      .then((movies) => {
        const uniqueMovies = movies.filter(
          (movie, index, list) =>
            list.findIndex((item) => item.id === movie.id) === index
        );
        setDiscoverMovies(uniqueMovies.slice(0, 5));
        setCurrentMovieIndex(0);
      })
      .catch(() => {
        setDiscoverError("Unable to load new films.");
      });
  }, []);

  useEffect(() => {
    return () => clearTimeout(transitionTimer.current);
  }, []);

  function moveToMovie(nextIndex, direction) {
    clearTimeout(transitionTimer.current);

    setTransition({ direction, nextIndex });
    transitionTimer.current = setTimeout(() => {
      setCurrentMovieIndex(nextIndex);
      setTransition(null);
    }, 700);
  }

  function showPreviousMovie() {
    const nextIndex =
      currentMovieIndex === 0
        ? discoverMovies.length - 1
        : currentMovieIndex - 1;
    moveToMovie(nextIndex, "previous");
  }

  function showNextMovie() {
    const nextIndex =
      currentMovieIndex === discoverMovies.length - 1
        ? 0
        : currentMovieIndex + 1;
    moveToMovie(nextIndex, "next");
  }

  useEffect(() => {
    if (discoverMovies.length < 2 || transition) return;

    const interval = setInterval(() => {
      const nextIndex =
        currentMovieIndex === discoverMovies.length - 1
          ? 0
          : currentMovieIndex + 1;

      setTransition({ direction: "next", nextIndex });
      transitionTimer.current = setTimeout(() => {
        setCurrentMovieIndex(nextIndex);
        setTransition(null);
      }, 700);
    }, 10000);

    return () => clearInterval(interval);
  }, [discoverMovies.length, currentMovieIndex, transition]);

  function renderMovie(movie, animationClass) {
    return (
      <article
        key={movie.id}
        className={`absolute inset-0 min-h-64 overflow-hidden bg-slate-950 ${animationClass}`}
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/w1280${movie.backdrop_path || movie.poster_path})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/55 to-slate-950/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10" />
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.25)]" />
        <div className="relative flex min-h-64 max-w-xl flex-col justify-center px-20 py-6">
          <h3 className="text-4xl font-black tracking-tight drop-shadow-lg">{movie.title}</h3>
          <p className="mt-3 line-clamp-3 max-w-lg text-sm leading-6 text-slate-100/90 drop-shadow">
            {movie.overview || "Discover more about this movie."}
          </p>
          <Link
            to={`/movie/${movie.id}`}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-sky-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Discover <span aria-hidden="true">→</span>
          </Link>
        </div>
      </article>
    );
  }

  return (
    <section className="w-full bg-transparent">
      {discoverError && <p className="text-sm text-red-300">{discoverError}</p>}
      {!discoverError && discoverMovies.length === 0 && (
        <p className="text-sm text-slate-400">Loading films...</p>
      )}
      <div
        aria-label="Discover new films"
        className="relative min-h-64 touch-pan-y overscroll-x-none overflow-hidden"
      >
        {discoverMovies.length > 0 && (
          <>
            {renderMovie(
              discoverMovies[currentMovieIndex],
              transition
                ? `carousel-out-${transition.direction}`
                : ""
            )}
            {transition &&
              renderMovie(
                discoverMovies[transition.nextIndex],
                `carousel-in-${transition.direction}`
              )}
            <button
              type="button"
              onClick={showPreviousMovie}
              aria-label="Previous movie"
              className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={showNextMovie}
              aria-label="Next movie"
              className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
              {discoverMovies.map((movie, index) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => {
                    if (index === currentMovieIndex) return;
                    moveToMovie(
                      index,
                      index > currentMovieIndex ? "next" : "previous"
                    );
                  }}
                  aria-label={`Show movie ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    index === currentMovieIndex
                      ? "w-6 bg-white"
                      : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}