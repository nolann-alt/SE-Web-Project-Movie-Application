import { useEffect, useState } from "react";
import {
  addMovieReview,
  deleteMovieReview,
  getMovieReviews,
  getProfileUsername,
} from "../services/movieLists";
import {
  getMovieReviewForUser,
  removeMovieReviewForUser,
  replaceMovieReviewForUser,
} from "../utils/movieReviewHelpers";

export function useMovieReviews(movieId, currentUser, currentUserId, requireAccount) {
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [username, setUsername] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(8);
  const existingReview = getMovieReviewForUser(reviews, currentUserId);

  useEffect(() => {
    setReviewText(existingReview?.text || "");
    setRating(existingReview?.rating || 8);
  }, [currentUser, currentUserId, existingReview]);

  useEffect(() => {
    let isActive = true;
    if (!currentUserId) {
      setUsername("");
      return () => {
        isActive = false;
      };
    }

    function loadUsername() {
      getProfileUsername(currentUserId)
        .then((profileUsername) => {
          if (isActive) setUsername(profileUsername);
        })
        .catch(() => {
          if (isActive) setReviewError("Unable to load your username.");
        });
    }
    loadUsername();
    window.addEventListener("filmsphere-profile-updated", loadUsername);
    return () => {
      isActive = false;
      window.removeEventListener("filmsphere-profile-updated", loadUsername);
    };
  }, [currentUserId]);

  useEffect(() => {
    let isActive = true;
    setReviews([]);
    setReviewError("");
    setIsLoadingReviews(true);
    getMovieReviews(movieId)
      .then((movieReviews) => {
        if (isActive) setReviews(movieReviews);
      })
      .catch(() => {
        if (isActive) setReviewError("Unable to load shared reviews.");
      })
      .finally(() => {
        if (isActive) setIsLoadingReviews(false);
      });
    return () => {
      isActive = false;
    };
  }, [movieId]);

  async function handleReviewSubmit(event) {
    event.preventDefault();
    if (!currentUser || !currentUserId) {
      requireAccount("Log in or create an account before posting your review.");
      return;
    }
    if (!username) {
      setReviewError("Your username is not available yet. Please try again.");
      return;
    }

    setReviewError("");
    setIsSubmittingReview(true);
    const review = {
      id: existingReview?.id ?? Date.now(),
      userId: currentUserId,
      author: username,
      text: reviewText.trim(),
      rating,
    };
    try {
      const savedReview = await addMovieReview(movieId, review);
      setReviews((current) =>
        replaceMovieReviewForUser(current, savedReview, currentUserId),
      );
    } catch {
      setReviewError("Unable to save your rating. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleReviewDelete() {
    if (!currentUserId || !existingReview) return;
    if (!window.confirm("Delete your rating and comment for this movie?")) return;

    setReviewError("");
    try {
      const deleted = await deleteMovieReview(movieId, existingReview.id, currentUserId);
      if (!deleted) {
        setReviewError("Your rating could not be found. Please refresh the page.");
        return;
      }

      setReviews((current) => removeMovieReviewForUser(current, currentUserId));
      setReviewText("");
      setRating(8);
    } catch {
      setReviewError("Unable to delete your rating. Please try again.");
    }
  }

  return {
    reviews,
    isLoadingReviews,
    isSubmittingReview,
    reviewError,
    reviewText,
    setReviewText,
    rating,
    setRating,
    existingReview,
    handleReviewSubmit,
    handleReviewDelete,
  };
}
