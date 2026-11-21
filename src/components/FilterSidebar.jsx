import { useRef } from "react";

const GENRES = [
  { id: "genre-28", name: "Action", apiId: 28 },
  { id: "genre-18", name: "Drama", apiId: 18 },
  { id: "genre-878", name: "Sci-Fi", apiId: 878 },
  { id: "genre-35", name: "Comedy", apiId: 35 },
  { id: "genre-27", name: "Horror", apiId: 27 },
  { id: "genre-10749", name: "Romance", apiId: 10749 },
  { id: "genre-12", name: "Adventure", apiId: 12 },
];

export default function FilterSidebar({
  selectedCategories,
  onCategoryChange,
  categoryOrder,
  onMoveCategory,
  sortBy,
  onSortChange,
}) {
  const sidebarRef = useRef(null);

  return (
    <div className="hidden w-48 shrink-0 self-stretch md:block">
      <aside
        ref={sidebarRef}
        className="sticky top-24 z-30 h-fit max-h-[calc(100vh-112px)] w-48 overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-800/95 to-slate-900/90 px-4 pt-4 pb-6 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-sm"
      >
        <h2 className="mb-4 border-l-4 border-sky-400 pl-3 text-base font-bold tracking-tight text-slate-100">
          Filter Movies
        </h2>

        <div className="mb-6 rounded-xl border border-slate-700/60 bg-slate-900/40 p-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-300">Add genre</p>
          {GENRES.map((genre) => (
            <label key={genre.id} className="mb-1 flex cursor-pointer items-center text-sm text-slate-300 transition hover:text-white last:mb-0">
              <input
                type="checkbox"
                checked={selectedCategories.includes(genre.id)}
                onChange={() => onCategoryChange(genre.id)}
                className="mr-2 h-3.5 w-3.5 accent-sky-400"
              />
              {genre.name}
            </label>
          ))}
        </div>

        <div className="mb-6 rounded-xl border border-slate-700/60 bg-slate-900/40 p-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-300">Category order</p>
          <div className="space-y-1">
            {categoryOrder.map((category, index) => (
              <div key={category.id} className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-800/70 px-2 py-1">
                <span className="truncate text-xs text-slate-300">{category.title}</span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${category.title} up`}
                    disabled={index === 0}
                    onClick={() => onMoveCategory(category.id, "up")}
                    className="flex h-5 w-5 items-center justify-center rounded text-[9px] text-slate-400 transition hover:bg-sky-400/15 hover:text-sky-300 disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${category.title} down`}
                    disabled={index === categoryOrder.length - 1}
                    onClick={() => onMoveCategory(category.id, "down")}
                    className="flex h-5 w-5 items-center justify-center rounded text-[9px] text-slate-400 transition hover:bg-sky-400/15 hover:text-sky-300 disabled:opacity-20"
                  >
                    ▼
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-2">
          <label htmlFor="movie-sort" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-sky-300">
            Sort movies
          </label>
          <select
            id="movie-sort"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className="w-full rounded-lg border border-slate-600/80 bg-slate-950/70 p-2 text-sm text-slate-200 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          >
            <option value="vote_average">By grade</option>
            <option value="title">By name</option>
            <option value="release_date">By date</option>
          </select>
        </div>
      </aside>
    </div>
  );
}