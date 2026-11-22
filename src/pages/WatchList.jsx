import MovieLibrary from "../components/MovieLibrary";
import Navbar from "../components/Navbar";
import { Link } from "react-router";
import { getCurrentUser } from "../services/auth";
import { getWatchlist } from "../services/movieLists";

export default function WatchList() {
  if (!getCurrentUser()) {
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
    <MovieLibrary
      title="My WatchList"
      ids={getWatchlist()}
      emptyMessage="You have not added any movies to your WatchList yet."
    />
  );
}