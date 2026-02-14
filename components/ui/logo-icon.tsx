interface LogoIconProps {
  className?: string;
  size?: number;
}

export function LogoIcon({ className, size = 20 }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      {/* Stem */}
      <path
        d="M16 25 Q16 19 16 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Left leaf */}
      <path
        d="M16 17 Q12 12 9 10 Q11 14 16 17Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Right leaf */}
      <path
        d="M16 14 Q21 9 24 7 Q22 12 16 14Z"
        fill="currentColor"
      />
      {/* AI dot */}
      <circle cx="24" cy="7" r="1.5" fill="currentColor" />
      <circle
        cx="24"
        cy="7"
        r="3"
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
        opacity="0.4"
      />
      {/* Ground */}
      <path
        d="M11 25 Q16 24 21 25"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}
