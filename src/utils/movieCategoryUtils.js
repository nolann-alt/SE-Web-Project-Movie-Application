export function mergeUniqueMovies(pages) {
  const seenIds = new Set();
  return pages.flat().filter((movie) => {
    if (seenIds.has(movie.id)) return false;
    seenIds.add(movie.id);
    return true;
  });
}

export function selectAvailableReplacementMovies(pages, category, categories) {
  const usedByOtherCategories = new Set(
    categories
      .filter((item) => item.id !== category.id)
      .flatMap((item) => item.movies.map((movie) => movie.id)),
  );
  const currentMovieIds = new Set(category.movies.map((movie) => movie.id));

  return pages
    .flat()
    .filter((movie, index, movies) =>
      !usedByOtherCategories.has(movie.id) &&
      !currentMovieIds.has(movie.id) &&
      movies.findIndex((item) => item.id === movie.id) === index,
    );
}
