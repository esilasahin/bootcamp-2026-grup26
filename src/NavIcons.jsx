const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  "study-agent": (
    <>
      <rect x="4" y="4" width="15" height="4" rx="1.2" />
      <rect x="5" y="10" width="15" height="4" rx="1.2" />
      <rect x="4" y="16" width="15" height="4" rx="1.2" />
    </>
  ),
  quiz: (
    <>
      <text x="7" y="13" fontSize="10" fontWeight="700" fill="currentColor" stroke="none">?</text>
      <text x="15" y="9.5" fontSize="6" fill="currentColor" stroke="none">?</text>
      <text x="12" y="20" fontSize="6" textAnchor="middle" letterSpacing="1" fill="currentColor" stroke="none">ABCD</text>
    </>
  ),
  "career-agent": (
    <>
      <g fill="currentColor" stroke="none">
        <ellipse cx="6.5" cy="6" rx="3" ry="1.6" />
        <circle cx="5.2" cy="5.4" r="1.3" />
        <circle cx="7.4" cy="5.2" r="1.6" />
        <ellipse cx="18" cy="8.5" rx="2.6" ry="1.4" />
        <circle cx="17" cy="8" r="1.1" />
        <circle cx="19" cy="7.9" r="1.3" />
      </g>
      <path d="M7 21 L10.4 12 L13.6 12 L17 21 Z" strokeWidth="2" />
      <line x1="12" y1="13.5" x2="12" y2="15.2" strokeWidth="2" />
      <line x1="12" y1="16.6" x2="12" y2="18.3" strokeWidth="2" />
      <line x1="12" y1="19.4" x2="12" y2="20.6" strokeWidth="2" />
    </>
  ),
  coach: (
    <>
      <circle cx="10" cy="14.5" r="5.2" />
      <rect x="13.5" y="11" width="7.5" height="3.4" rx="1.7" />
      <circle cx="10" cy="8" r="1.5" />
      <circle cx="10" cy="14.5" r="1.4" />
    </>
  ),
};

export default function NavIcon({ name }) {
  const cizim = ICONS[name];
  if (!cizim) return null;
  return (
    <svg
      className="nav-icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {cizim}
    </svg>
  );
}

export function GradCap() {
  return (
    <svg className="grad-cap-svg" viewBox="0 0 64 50" aria-hidden="true">
      <defs>
        <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path className="cap-band" d="M16 20 L16 30 C16 37 23 40 32 40 C41 40 48 37 48 30 L48 20 L32 27 Z" fill="#1e40af" />
      <polygon className="cap-board" points="32,4 61,17 32,30 3,17" fill="url(#capGrad)" />
      <circle cx="32" cy="17" r="2.4" fill="#fbbf24" />
      <path d="M32 17 L57 20 L57 34" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="57" cy="37" r="3" fill="#fbbf24" />
    </svg>
  );
}
