export default function MovieReviewsSection({
  reviews,
  existingReview,
  isLoadingReviews,
  isSubmittingReview,
  reviewError,
  rating,
  setRating,
  reviewText,
  setReviewText,
  onSubmit,
  onDelete,
}) {
  return (
    <section>
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold">
        <span className="h-8 w-1 rounded-full bg-sky-400" />
        Community Reviews & Ratings
        {reviews.length > 0 && (
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300">
            {reviews.length}
          </span>
        )}
      </h2>
      {reviewError && (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">
          {reviewError}
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        <form onSubmit={onSubmit} className="h-fit space-y-4 rounded-2xl border border-slate-800/90 bg-slate-900/85 p-6 shadow-[0_16px_40px_rgba(2,6,23,0.22)]">
          <h3 className="border-b border-slate-800 pb-3 text-lg font-bold">{existingReview ? "Update Your Rating" : "Rate This Movie"}</h3>
          {existingReview && (
            <p className="text-sm text-sky-300">You already rated this movie. Submit to change your rating or review.</p>
          )}
          <label className="block text-xs text-slate-400">
            Rating: <span className="font-bold text-sky-300">{rating} / 10</span>
            <input type="range" min="1" max="10" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full accent-sky-400" />
          </label>
          <label className="block text-xs text-slate-400">
            Comment (optional)
            <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} rows="4" className="mt-1.5 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm leading-6 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15" />
          </label>
          <button type="submit" disabled={isSubmittingReview} className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold shadow-[0_10px_25px_rgba(14,165,233,0.18)] transition hover:-translate-y-0.5 hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60">{isSubmittingReview ? "Saving..." : existingReview ? "Update Rating" : "Submit Rating"}</button>
          {existingReview && (
            <button type="button" onClick={onDelete} disabled={isSubmittingReview} className="w-full rounded-xl border border-red-400/30 py-3 text-sm font-bold text-red-300 transition hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-60">Delete My Rating</button>
          )}
        </form>

        <div className="space-y-4 lg:col-span-2">
          {isLoadingReviews ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">No shared reviews yet. Be the first to rate this movie.</p>
          ) : reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{review.author}</h3>
                  <p className="mt-1 text-xs text-slate-400">{review.createdAt}</p>
                </div>
                <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">★ {review.rating} / 10</span>
              </div>
              {review.text
                ? <p className="mt-3 text-sm leading-6 text-slate-300">{review.text}</p>
                : <p className="mt-3 text-sm italic text-slate-500">Rating only</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
