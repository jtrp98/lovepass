/** Decorative drawing; the adjacent text carries all meaning. */
export function LoveDoodle() {
  return (
    <svg className="love-doodle" viewBox="0 0 240 180" fill="none" aria-hidden="true">
      <ellipse cx="122" cy="158" rx="88" ry="9" fill="var(--color-love)" opacity=".08" />
      <g className="doodle-friend doodle-friend-left" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M39 131C25 105 38 63 69 59c31-4 52 25 49 57-2 26-21 39-44 37-16-1-29-9-35-22Z" fill="var(--color-butter-soft)" />
        <path d="m47 70-6-15m17 9-1-17M62 151l-5 9m35-10 5 9" />
        <path d="M64 101v4m27-4v4m-18 8q5 6 10 0" />
        <path d="M100 126q13 10 24-2" />
        <ellipse cx="56" cy="114" rx="7" ry="4" fill="var(--color-love)" stroke="none" opacity=".24" />
        <ellipse cx="98" cy="114" rx="7" ry="4" fill="var(--color-love)" stroke="none" opacity=".24" />
      </g>
      <g className="doodle-friend doodle-friend-right" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M122 124c-8-30 8-62 36-64 32-3 56 32 47 63-7 23-24 33-47 30-18-2-31-12-36-29Z" fill="var(--color-love-soft)" />
        <path d="m176 63 6-15m6 20 12-10M144 151l-4 9m37-9 6 9" />
        <path d="M145 102v4m27-4v4m-19 8q5 6 10 0" />
        <path d="M139 128q-12 9-20-1" />
        <ellipse cx="137" cy="115" rx="7" ry="4" fill="var(--color-love)" stroke="none" opacity=".24" />
        <ellipse cx="180" cy="115" rx="7" ry="4" fill="var(--color-love)" stroke="none" opacity=".24" />
      </g>
      <path className="doodle-heart" d="M116 48s-19-12-19-23c0-12 14-15 19-5 6-10 20-7 20 5 0 11-20 23-20 23Z" fill="var(--color-love)" />
      <g className="doodle-sparkles" stroke="var(--color-love)" strokeWidth="2" strokeLinecap="round">
        <path d="M29 39v10m-5-5h10m171-14v10m-5-5h10M218 102v8m-4-4h8" />
      </g>
    </svg>
  );
}
