import assert from "node:assert/strict";
import test from "node:test";
import { loadMoviesIndividually } from "./loadMoviesIndividually.js";

test("keeps successfully loaded movies when another saved movie request fails", async () => {
  const moviesById = new Map([
    ["movie-1", { id: "movie-1", title: "First movie" }],
    ["movie-3", { id: "movie-3", title: "Third movie" }],
  ]);
  const result = await loadMoviesIndividually(
    ["movie-1", "movie-2", "movie-3"],
    async (movieId) => {
      if (!moviesById.has(movieId)) throw new Error("TMDB request failed");
      return moviesById.get(movieId);
    },
  );

  assert.deepEqual(result, {
    movies: [moviesById.get("movie-1"), moviesById.get("movie-3")],
    failedCount: 1,
  });
});
