function summarizeCommunityRatings(communityRatings) {
  if (Array.isArray(communityRatings)) {
    const ratings = communityRatings
      .map((review) => Number(review.rating))
      .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 10);
    return {
      sum: ratings.reduce((total, rating) => total + rating, 0),
      count: ratings.length,
    };
  }

  const sum = Number(communityRatings?.sum);
  const count = Number(communityRatings?.count);
  if (
    !Number.isFinite(sum) ||
    !Number.isInteger(count) ||
    count <= 0 ||
    sum < count ||
    sum > count * 10
  ) {
    return { sum: 0, count: 0 };
  }

  return { sum, count };
}

export function calculateMovieRating(movie, communityRatings = []) {
  const community = summarizeCommunityRatings(communityRatings);
  const hasTmdbAverage =
    movie?.vote_average !== null &&
    movie?.vote_average !== undefined &&
    movie?.vote_average !== "";
  const tmdbAverage = Number(movie?.vote_average);
  const tmdbCount = Number(movie?.vote_count);
  const hasTmdbRating =
    hasTmdbAverage &&
    Number.isFinite(tmdbAverage) &&
    tmdbAverage >= 0 &&
    tmdbAverage <= 10 &&
    Number.isInteger(tmdbCount) &&
    tmdbCount > 0;
  const tmdbVoteCount = hasTmdbRating ? tmdbCount : 0;
  const voteCount = tmdbVoteCount + community.count;

  if (voteCount === 0) return { average: null, voteCount: 0 };

  const totalRating =
    (hasTmdbRating ? tmdbAverage * tmdbVoteCount : 0) + community.sum;
  return { average: totalRating / voteCount, voteCount };
}
