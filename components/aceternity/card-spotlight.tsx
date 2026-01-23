"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CardSpotlightProps {
  children: React.ReactNode;
  /** Radius of the spotlight effect in pixels */
  radius?: number;
  /** Color of the spotlight gradient (use rgba for best results) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** 
   * When true, applies full card styling (background, border, padding).
   * When false, only applies the spotlight effect as a wrapper.
   */
  asCard?: boolean;
}

export const CardSpotlight = ({
  children,
  radius = 350,
  color = "rgba(120, 119, 198, 0.5)",
  className,
  asCard = false,
}: CardSpotlightProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative rounded-xl overflow-hidden",
        asCard && "border border-neutral-800 bg-neutral-950 p-6",
        className
      )}
    >
      {/* Spotlight gradient overlay - absolute positioned on top */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-xl transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, ${color}, transparent 50%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  );
};
