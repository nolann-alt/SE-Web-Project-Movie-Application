import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeUniqueMovies,
  selectAvailableReplacementMovies,
} from "./movieCategoryUtils.js";

test("merges movie pages without duplicates while preserving first occurrence order", () => {
  const first = { id: 1, title: "First" };
  const second = { id: 2, title: "Second" };
  const duplicate = { id: 1, title: "Duplicate" };

  assert.deepEqual(mergeUniqueMovies([[first, second], [duplicate]]), [
    first,
    second,
  ]);
});

test("selects only replacement movies not present in other or current categories", () => {
  const replacement = { id: 3 };
  const pages = [[{ id: 1 }, replacement], [{ id: 2 }, replacement]];
  const categories = [
    { id: "popular", movies: [{ id: 1 }] },
    { id: "trending", movies: [{ id: 2 }] },
  ];

  assert.deepEqual(
    selectAvailableReplacementMovies(
      pages,
      categories[0],
      categories,
    ),
    [replacement],
  );
});
