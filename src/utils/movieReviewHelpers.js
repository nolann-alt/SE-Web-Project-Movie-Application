export function getMovieReviewForUser(reviews, userId) {
  return userId
    ? reviews.find((review) => review.userId === userId) || null
    : null;
}

export function replaceMovieReviewForUser(reviews, savedReview, userId) {
  return [
    savedReview,
    ...reviews.filter((review) => review.userId !== userId),
  ];
}

export function removeMovieReviewForUser(reviews, userId) {
  return reviews.filter((review) => review.userId !== userId);
}
