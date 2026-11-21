import { useEffect, useRef, useState } from "react";

export default function FilterSidebar() {
  const sidebarRef = useRef(null);
  const documentTopRef = useRef(null);
  const [sidebarHeight, setSidebarHeight] = useState("auto");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    function updateSidebarHeight() {
      if (!sidebarRef.current) return;

      if (documentTopRef.current === null) {
        documentTopRef.current =
          sidebarRef.current.getBoundingClientRect().top + window.scrollY;
      }

      const currentTop = documentTopRef.current - window.scrollY;
      const pinned = currentTop <= 96;
      const top = pinned ? 96 : currentTop;
      const footerTop =
        document.querySelector("footer")?.getBoundingClientRect().top ??
        window.innerHeight;
      const bottom = Math.min(window.innerHeight - 16, footerTop - 16);

      setIsPinned(pinned);
      setSidebarHeight(`${Math.max(0, bottom - top)}px`);
    }

    updateSidebarHeight();
    window.addEventListener("scroll", updateSidebarHeight, { passive: true });
    window.addEventListener("resize", updateSidebarHeight);

    return () => {
      window.removeEventListener("scroll", updateSidebarHeight);
      window.removeEventListener("resize", updateSidebarHeight);
    };
  }, []);

  return (
    <div className="hidden w-48 shrink-0 md:block" style={{ height: sidebarHeight }}>
      <aside
        ref={sidebarRef}
        style={{ height: sidebarHeight }}
        className={`${isPinned ? "fixed left-4 top-24" : "sticky top-24"} z-30 w-48 self-start overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 p-4`}
      >
        <h2 className="mb-2 font-semibold">Filter Movies</h2>

        <p className="text-sm">Genre</p>
        <label className="block text-sm"><input type="checkbox" /> Action</label>
        <label className="block text-sm"><input type="checkbox" /> Drama</label>
        <label className="block text-sm"><input type="checkbox" /> Sci-Fi</label>
      </aside>
    </div>
  );
}