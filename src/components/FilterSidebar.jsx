// Only a design for now, it does not filter yet
export default function FilterSidebar() {
  return (
    <aside className="hidden w-48 rounded bg-slate-800 p-4 md:block">
      <h2 className="mb-2 font-semibold">Filter Movies</h2>

      <p className="text-sm">Genre</p>
      <label className="block text-sm"><input type="checkbox" /> Action</label>
      <label className="block text-sm"><input type="checkbox" /> Drama</label>
      <label className="block text-sm"><input type="checkbox" /> Sci-Fi</label>
    </aside>
  );
}