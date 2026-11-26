import assert from "node:assert/strict";
import test from "node:test";
import { createLatestRequest } from "./latestRequest.js";

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function applyWhenCurrent(request, promise, results) {
  const result = await promise;
  if (request.isCurrent()) results.push(result);
}

test("an older search response cannot replace the latest query", async () => {
  const requests = createLatestRequest();
  const results = [];
  const oldResponse = deferred();
  const latestResponse = deferred();
  const oldRequest = requests.start();
  const oldSearch = applyWhenCurrent(oldRequest, oldResponse.promise, results);
  const latestRequest = requests.start();
  const latestSearch = applyWhenCurrent(latestRequest, latestResponse.promise, results);

  assert.equal(oldRequest.signal.aborted, true);
  latestResponse.resolve("latest query results");
  await latestSearch;
  oldResponse.resolve("old query results");
  await oldSearch;

  assert.deepEqual(results, ["latest query results"]);
});

test("a previous movie route response is ignored after route change or cleanup", async () => {
  const requests = createLatestRequest();
  const results = [];
  const firstMovieResponse = deferred();
  const secondMovieResponse = deferred();
  const firstMovieRequest = requests.start();
  const firstMovieLoad = applyWhenCurrent(
    firstMovieRequest,
    firstMovieResponse.promise,
    results,
  );
  const secondMovieRequest = requests.start();
  const secondMovieLoad = applyWhenCurrent(
    secondMovieRequest,
    secondMovieResponse.promise,
    results,
  );

  secondMovieResponse.resolve("movie for current route");
  await secondMovieLoad;
  firstMovieResponse.resolve("movie for old route");
  await firstMovieLoad;
  assert.deepEqual(results, ["movie for current route"]);

  const unmountedRequest = requests.start();
  requests.cancel();
  assert.equal(unmountedRequest.signal.aborted, true);
  assert.equal(unmountedRequest.isCurrent(), false);
});
