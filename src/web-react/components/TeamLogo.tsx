import { useState } from 'react';

const TEAM_COLORS: Record<string, string> = {
  'Arsenal': '#EF0107', 'Aston Villa': '#670E36', 'Bournemouth': '#DA291C',
  'Brentford': '#E30613', 'Brighton and Hove Albion': '#0057B8',
  'Chelsea': '#034694', 'Crystal Palace': '#1B458F', 'Everton': '#003399',
  'Fulham': '#000000', 'Ipswich Town': '#3A64A3', 'Leicester City': '#003090',
  'Liverpool': '#C8102E', 'Manchester City': '#6CABDD', 'Manchester United': '#DA291C',
  'Newcastle United': '#241F20', 'Nottingham Forest': '#DD0000',
  'Southampton': '#D71920', 'Tottenham Hotspur': '#132257',
  'West Ham United': '#7A263A', 'Wolverhampton Wanderers': '#FDB913',
  'Real Madrid': '#FEBE10', 'FC Barcelona': '#A50044', 'Atletico Madrid': '#CB3524',
  'Athletic Bilbao': '#EE2523', 'Real Sociedad': '#0067B1', 'Real Betis': '#00954C',
  'Villarreal': '#FFE114', 'Girona': '#CD2534', 'Getafe': '#004FA3',
  'Sevilla': '#D40D27', 'Celta Vigo': '#8AC3EE', 'Mallorca': '#E20613',
  'Osasuna': '#D91A21', 'Rayo Vallecano': '#E53027', 'Las Palmas': '#FFCC00',
  'Leganes': '#004D98', 'Alaves': '#003DA5', 'Espanyol': '#007FC8',
  'Real Valladolid': '#800080', 'Valencia': '#EE3524',
  'Bayern Munich': '#DC052D', 'Bayer Leverkusen': '#E32221',
  'Borussia Dortmund': '#FDE100', 'RB Leipzig': '#DD0741',
  'VfB Stuttgart': '#E32219', 'Eintracht Frankfurt': '#E1000F',
  'VfL Wolfsburg': '#65B32E', 'SC Freiburg': '#000000',
  'Borussia Monchengladbach': '#18A950', 'Werder Bremen': '#1D9053',
  '1. FC Union Berlin': '#EB1923', '1. FC Heidenheim': '#E30613',
  '1. FSV Mainz 05': '#C3002F', 'FC Augsburg': '#BA372A',
  'TSG 1899 Hoffenheim': '#1961B5', 'SV Darmstadt 98': '#004B97',
  '1. FC Koln': '#EC1C24', 'Holstein Kiel': '#003F87', 'FC St. Pauli': '#930013',
  'Inter': '#0068A8', 'AC Milan': '#FB090B', 'Juventus': '#000000',
  'Napoli': '#12A0D7', 'AS Roma': '#8E1F2F', 'Lazio': '#87D8F7',
  'Atalanta': '#1E71B8', 'Fiorentina': '#623D7E', 'Bologna': '#1A2F48',
  'Torino': '#8B0000', 'Monza': '#AC1E2C', 'Genoa': '#8B0000',
  'Lecce': '#FFEB3B', 'Cagliari': '#A51E36', 'Udinese': '#231F20',
  'Sassuolo': '#006B3F', 'Empoli': '#004B97', 'Verona': '#003F87',
  'Frosinone': '#F9A825', 'Salernitana': '#8B0000', 'Parma': '#004B97',
  'Venezia': '#FF6600', 'Como': '#003DA5',
  'Paris Saint-Germain': '#004170', 'Marseille': '#2FAEE0', 'Monaco': '#E7192D',
  'Lyon': '#0A4FA2', 'Lille': '#E30613', 'Nice': '#E7192D',
  'Rennes': '#E30613', 'Lens': '#FDCA01', 'Brest': '#E30613',
  'Strasbourg': '#009FE3', 'Nantes': '#F5E642', 'Montpellier': '#FF6600',
  'Toulouse': '#7B2D8E', 'Reims': '#E30613', 'Le Havre': '#004B97',
  'PSV': '#ED1C24', 'Ajax': '#D2122E', 'Feyenoord': '#EE3124',
  'AZ Alkmaar': '#E30613', 'FC Twente': '#E30613',
  'Sporting CP': '#00593E', 'Benfica': '#FF0000', 'Porto': '#003893',
  'Celtic': '#009739', 'Rangers': '#003199',
};

function getInitial(name: string) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function getColor(name: string) {
  if (!name) return '#555';
  if (TEAM_COLORS[name]) return TEAM_COLORS[name];
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (key.toLowerCase() === lower) return color;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

interface TeamLogoProps {
  logo?: string | null;
  name: string;
  className?: string;
}

export function TeamLogo({ logo, name, className = 'size-5 shrink-0' }: TeamLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt=""
        className={`${className} rounded-sm object-contain`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  const bg = getColor(name);
  const initials = getInitial(name);

  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-sm font-mono text-[8px] font-bold text-white`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {initials}
    </span>
  );
}
