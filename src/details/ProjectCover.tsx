export function ProjectCover({ variant = "portfolio" }: { variant?: string }) {
  const background =
    variant === "classpulse"
      ? "#dfe7ed"
      : variant === "hermes"
        ? "#dce8e2"
        : "#dce4d8";

  return (
    <svg
      className="project-cover"
      viewBox="0 0 600 310"
      aria-hidden="true"
      style={{ backgroundColor: background }}
    >
      <rect width="600" height="310" fill={background} />
      <pattern
        id={`grid-${variant}`}
        width="30"
        height="30"
        patternUnits="userSpaceOnUse"
      >
        <path d="M30 0H0V30" fill="none" stroke="#314e4210" />
      </pattern>
      <rect width="600" height="310" fill={`url(#grid-${variant})`} />
      {variant === "portfolio" ? (
        <g stroke="#496b57" strokeWidth="1.5" strokeLinejoin="round">
          <path
            d="m300 48 148 85v103l-148 85-148-85V133Z"
            fill="#f6f3e9"
            transform="translate(0 -26)"
          />
          <path d="m152 107 148 86 148-86M300 193v102" fill="none" />
          <path d="m186 171 55-32 82 47-55 32Z" fill="#aa795a" />
          <path d="M186 171v48m82-1v47m55-79v47" />
          <path d="m230 119 37 21v33l-37-21Z" fill="#355548" />
          <path d="m308 215 74-43 30 17-74 43Z" fill="#c0cfb9" />
          <path d="m359 125 43-25v47l-43 25Z" fill="#bed2d5" />
          <circle cx="202" cy="135" r="7" fill="#bc6d49" stroke="none" />
        </g>
      ) : variant === "hermes" ? (
        <g stroke="#42685a" strokeWidth="1.5" strokeLinejoin="round">
          <rect
            x="235"
            y="34"
            width="130"
            height="210"
            rx="22"
            fill="#f8faf7"
          />
          <rect x="248" y="58" width="104" height="156" rx="8" fill="#e8f1ec" />
          <path
            d="m279 116 54-25-18 57-13-20-23-12Z"
            fill="#5d8d7c"
            stroke="none"
          />
          <path d="m302 128 31-37-43 30" fill="none" stroke="#f8faf7" />
          <circle cx="300" cy="228" r="5" fill="#42685a" stroke="none" />
          <circle cx="176" cy="91" r="18" fill="#f8faf7" />
          <circle cx="424" cy="91" r="18" fill="#f8faf7" />
          <circle cx="176" cy="188" r="18" fill="#f8faf7" />
          <circle cx="424" cy="188" r="18" fill="#f8faf7" />
          <path
            d="M194 91h41m130 0h41M194 188h41m130 0h41"
            strokeDasharray="4 5"
          />
          <path
            d="m169 91 5 5 10-11m233 6 5 5 10-11m-263 103 5 5 10-11m233 11 5 5 10-11"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g fill="none" stroke="#526d82" strokeWidth="1.4">
          <ellipse
            cx="300"
            cy="145"
            rx="145"
            ry="82"
            strokeDasharray="3 7"
            opacity=".5"
          />
          <path d="m191 91 109 54 109-54M300 145v88" opacity=".5" />
          <circle cx="191" cy="91" r="25" fill="#f8faf9" />
          <circle cx="409" cy="91" r="25" fill="#f8faf9" />
          <circle cx="300" cy="233" r="25" fill="#f8faf9" />
          <rect
            x="228"
            y="113"
            width="144"
            height="64"
            rx="10"
            fill="#36566d"
            stroke="none"
          />
          <path
            d="m182 91 6 6 12-12m91 148 6 6 12-12M400 91h18m-9-9v18"
            strokeLinecap="round"
          />
          <text
            x="300"
            y="151"
            textAnchor="middle"
            fill="#f8faf9"
            stroke="none"
            fontFamily="Georgia, serif"
            fontSize="22"
          >
            ClassPulse
          </text>
        </g>
      )}
      <text
        x="24"
        y="285"
        fill="#526959"
        fontFamily="sans-serif"
        fontSize="8"
        letterSpacing="2"
      >
        {variant === "portfolio"
          ? "ESPACE INTERACTIF / 01"
          : variant === "hermes"
            ? "AUTOMATISATION MOBILE / 03"
            : "CLASS PULSE / 02"}
      </text>
      <text
        x="576"
        y="285"
        textAnchor="end"
        fill="#526959"
        fontFamily="sans-serif"
        fontSize="7"
      >
        ILLUSTRATION
      </text>
    </svg>
  );
}
