export default function Pager({ page, pages, total, limit, onPage, onLimit }) {
  if (total <= 0) return null;
  const from = (page - 1) * limit + 1, to = Math.min(page * limit, total);
  const nums = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p += 1) nums.push(p);
  return (
    <nav className="pager no-print" aria-label="Pagination">
      <span className="sub">Showing {from}–{to} of {total}</span>
      <div className="pager-btns">
        {onLimit && (
          <label className="sub">Rows <select value={limit} onChange={(e) => onLimit(Number(e.target.value))} aria-label="Rows per page">
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select></label>
        )}
        <button className="ghost sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        {nums[0] > 1 && <><button className="ghost sm" onClick={() => onPage(1)}>1</button>{nums[0] > 2 && <span className="sub">…</span>}</>}
        {nums.map((p) => <button key={p} className={`sm ${p === page ? '' : 'ghost'}`} aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)}>{p}</button>)}
        {nums[nums.length - 1] < pages && <>{nums[nums.length - 1] < pages - 1 && <span className="sub">…</span>}<button className="ghost sm" onClick={() => onPage(pages)}>{pages}</button></>}
        <button className="ghost sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </nav>
  );
}
