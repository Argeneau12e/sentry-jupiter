import React from 'react';

const SentryLogo = ({ size = 32, variant = 'full', className = '' }) => {
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        aria-label="Sentry"
      >
        {/* Shield outline with gradient */}
        <path
          d="M16 2 L26 6 L26 16 C26 24 16 30 16 30 C16 30 6 24 6 16 L6 6 L16 2 Z"
          stroke="url(#shieldGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Scanning line (Jupiter green) */}
        <line
          x1="8"
          y1="16"
          x2="24"
          y2="16"
          stroke="#c8f559"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Eye scan bars (vigilance motif) */}
        <line
          x1="13"
          y1="20"
          x2="13"
          y2="26"
          stroke="#c8f559"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="19"
          y1="20"
          x2="19"
          y2="26"
          stroke="#c8f559"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="shieldGradient" x1="16" y1="2" x2="16" y2="30">
            <stop stopColor="#c8f559" />
            <stop offset="0.5" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 40"
      fill="none"
      className={className}
      aria-label="Sentry DeFi Security"
    >
      {/* Shield icon */}
      <g transform="translate(0, 4)">
        <path
          d="M20 2 L38 6 L38 18 C38 26 29 31 29 31 C29 31 20 26 20 18 L20 6 L29 2 Z"
          stroke="url(#shieldGradientFull)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Scanning line */}
        <line
          x1="24"
          y1="18"
          x2="34"
          y2="18"
          stroke="#c8f559"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Eye scan bars */}
        <line
          x1="27"
          y1="22"
          x2="27"
          y2="28"
          stroke="#c8f559"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="31"
          y1="22"
          x2="31"
          y2="28"
          stroke="#c8f559"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="shieldGradientFull" x1="20" y1="2" x2="38" y2="31">
            <stop stopColor="#c8f559" />
            <stop offset="0.5" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </g>
      {/* Text */}
      <text
        x="48"
        y="28"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        fontSize="22"
        fontWeight="700"
        fill="#f8fafc"
        letterSpacing="-0.02em"
      >
        Sentry
      </text>
    </svg>
  );
};

export default SentryLogo;