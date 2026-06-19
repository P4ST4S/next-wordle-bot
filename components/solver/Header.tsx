/**
 * App header — logo mark, title, "Shannon entropy" badge, and GitHub link.
 *
 * Pure presentational/static markup, so this stays a Server Component (no
 * "use client"): it renders once and ships no client JS.
 */

const LOGO_SQUARES = [
  'bg-wordle-correct',
  'bg-wordle-present',
  'bg-wordle-absent',
  'bg-background border-2 border-wordle-empty-border',
];

export function Header() {
  return (
    <header className="mx-auto flex max-w-290 items-center justify-between border-b border-border px-10 py-4.5">
      <div className="flex items-center gap-3.25">
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5">
          {LOGO_SQUARES.map((cls, i) => (
            <div key={i} className={`size-3 rounded-xs ${cls}`} />
          ))}
        </div>
        <span className="text-[21px] font-extrabold tracking-[-0.4px] text-ink">
          Wordle Solver
        </span>
        <span className="rounded-[20px] bg-muted px-2.25 py-0.75 text-xs font-semibold text-ink-muted">
          Shannon entropy
        </span>
      </div>

      <a
        href="https://github.com/P4ST4S"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.25 rounded-[10px] border border-input/70 px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:border-wordle-empty-border hover:bg-surface-row"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span>P4ST4S</span>
      </a>
    </header>
  );
}
