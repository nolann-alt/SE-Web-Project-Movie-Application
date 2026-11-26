import assert from "node:assert/strict";
import test from "node:test";
import { calculateMovieRating } from "./movieRating.js";

test("combines TMDB and community ratings using their vote counts", () => {
  const movie = { vote_average: 8, vote_count: 100 };
  const detailsRating = calculateMovieRating(
    movie,
    [{ rating: 10 }, { rating: 4 }],
  );
  const cardRating = calculateMovieRating(movie, { sum: 14, count: 2 });

  assert.deepEqual(cardRating, detailsRating);
  assert.deepEqual(cardRating, { average: 814 / 102, voteCount: 102 });
});

test("uses community ratings when the TMDB rating is missing", () => {
  const result = calculateMovieRating(
    { vote_average: null, vote_count: 100 },
    [{ rating: 8 }, { rating: 6 }],
  );

  assert.deepEqual(result, { average: 7, voteCount: 2 });
});

test("returns no average and zero votes when neither source has ratings", () => {
  assert.deepEqual(calculateMovieRating({}, []), {
    average: null,
    voteCount: 0,
  });
});
