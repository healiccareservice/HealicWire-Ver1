import React from "react";

interface HealicLogoProps {
  className?: string;
}

export default function HealicLogo({ className = "w-10 h-10" }: HealicLogoProps) {
  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left Pillar - Dark Blue */}
      <rect
        x="8"
        y="5"
        width="17"
        height="80"
        rx="3.5"
        fill="#041E42"
      />

      {/* Right Pillar - Teal */}
      <rect
        x="50"
        y="5"
        width="16"
        height="80"
        rx="3.5"
        fill="#149B9E"
      />

      {/* Heartbeat Line Cutout / Mask (using background color) */}
      <path
        d="M 8 60 C 8 46 16 38 28 38 L 68 38 L 72 48 L 78 12 L 85 68 L 90 38 L 112 38"
        stroke="var(--color-white-custom, #FCFAF7)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Blue Heartbeat Line */}
      <path
        d="M 8 60 C 8 46 16 38 28 38 L 68 38 L 72 48 L 78 12 L 85 68 L 90 38 L 112 38"
        stroke="#0A60B3"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
