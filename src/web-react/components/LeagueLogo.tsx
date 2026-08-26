import { useState } from 'react';

interface LeagueLogoProps {
  logo?: string | null;
  flag: string;
  name: string;
  className?: string;
}

export function LeagueLogo({ logo, flag, name, className = 'size-4 shrink-0' }: LeagueLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        className={`${className} object-contain`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className={`${className} inline-flex items-center justify-center text-base leading-none`} title={name}>
      {flag}
    </span>
  );
}
