'use client';

import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({
  width = 112,
  height = 28,
  className = 'h-7 w-auto',
  priority = false,
}: LogoProps) {
  return (
    <span className="inline-flex items-center select-none">
      {/* Light Theme Logo — dark navy "OUT" */}
      <Image
        src="/outsyd-logo.png"
        alt="OUTSYD"
        width={width}
        height={height}
        className={`logo-light ${className}`}
        priority={priority}
      />
      {/* Dark Theme Logo — crisp luminous white "OUT" & metallic blue/orange mark */}
      <Image
        src="/outsyd-logo-dark.png"
        alt="OUTSYD"
        width={width}
        height={height}
        className={`logo-dark ${className}`}
        priority={priority}
      />
    </span>
  );
}
