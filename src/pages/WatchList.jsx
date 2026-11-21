import MovieLibrary from "../components/MovieLibrary";
import { getWatchlist } from "../services/movieLists";

export default function WatchList() {
  return (
    <MovieLibrary
      title="My WatchList"
      ids={getWatchlist()}
      emptyMessage="You have not added any movies to your WatchList yet."
    />
  );
}