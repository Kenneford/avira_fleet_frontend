import { useState, useEffect } from "react";

// Client-side pagination helper. Pass the full list and (optionally) the filter
// deps that should reset the page to 1. Returns the current page slice + controls.
export function usePaged(list, perPage = 10, deps = []) {
  const [page, setPage] = useState(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, deps);
  const safe = Array.isArray(list) ? list : [];
  const pageCount = Math.max(1, Math.ceil(safe.length / perPage));
  const current = Math.min(page, pageCount);
  const paged = safe.slice((current - 1) * perPage, current * perPage);
  return { paged, page: current, setPage, pageCount, total: safe.length };
}
