type IconName =
  | "arrow"
  | "external"
  | "close"
  | "grid"
  | "sun"
  | "moon"
  | "motion"
  | "book"
  | "back";

const paths: Record<IconName, string[]> = {
  arrow: ["M4 12h16", "m13 5 7 7-7 7"],
  external: ["M6 18 18 6", "M6 6h12v12"],
  close: ["m6 6 12 12", "M18 6 6 18"],
  grid: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  sun: [
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5",
  ],
  moon: ["M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z"],
  motion: ["M3 7h10M3 12h6M3 17h10", "m16 7 5 5-5 5"],
  book: [
    "M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z",
    "M12 6v14",
  ],
  back: ["M20 12H4", "m11 5-7 7 7 7"],
};

export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name].map((d, i) => (
        <path d={d} key={i} />
      ))}
    </svg>
  );
}
