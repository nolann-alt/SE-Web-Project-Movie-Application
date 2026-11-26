import assert from "node:assert/strict";
import test from "node:test";
import {
  getMovieReviewForUser,
  removeMovieReviewForUser,
  replaceMovieReviewForUser,
} from "./movieReviewHelpers.js";

test("replaces a user's existing movie review without removing other reviews", () => {
  const otherReview = { id: 1, userId: "other" };
  const previousReview = { id: 2, userId: "current" };
  const savedReview = { id: 2, userId: "current", rating: 9 };

  assert.deepEqual(
    replaceMovieReviewForUser(
      [otherReview, previousReview],
      savedReview,
      "current",
    ),
    [savedReview, otherReview],
  );
  assert.equal(getMovieReviewForUser([savedReview], "current"), savedReview);
});

test("removes only the requested user's movie review", () => {
  const reviews = [
    { id: 1, userId: "first" },
    { id: 2, userId: "second" },
  ];

  assert.deepEqual(removeMovieReviewForUser(reviews, "first"), [reviews[1]]);
});
