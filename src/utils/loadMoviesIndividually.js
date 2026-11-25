export async function loadMoviesIndividually(movieIds, loadMovie) {
  const results = await Promise.allSettled(
    movieIds.map(async (movieId) => loadMovie(movieId)),
  );
  const movies = [];
  let failedCount = 0;

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      movies.push(result.value);
    } else {
      failedCount += 1;
    }
  });

  return { movies, failedCount };
}
