import MovieLibrary from "../components/MovieLibrary";
import { getFavorites } from "../services/movieLists";

export default function Favorites() {
  return (
    <MovieLibrary
      title="My Favorites"
      ids={getFavorites()}
      emptyMessage="You have not added any favorite movies yet."
    />
  );
}