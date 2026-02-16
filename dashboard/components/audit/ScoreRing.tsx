"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  label,
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 50);

    return () => clearTimeout(timer);
  }, [score]);

  // Calculate SVG circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on score
  const getColor = (value: number): string => {
    if (value < 30) return "#dc2626"; // red
    if (value <= 60) return "#d97706"; // amber
    return "#059669"; // green
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1s ease-in-out",
          }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="transform rotate-90"
          style={{
            fontSize: size * 0.25,
            fontWeight: "bold",
            fill: color,
            transformOrigin: "center",
          }}
        >
          {Math.round(score)}%
        </text>
      </svg>
      {label && (
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      )}
    </div>
  );
}
