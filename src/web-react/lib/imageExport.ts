import type { Fixture } from '../types';
import type { Theme } from '../hooks/useTheme';

const LIGHT = {
  bg: '#FDF2F8',
  card: '#FFFFFF',
  border: '#EFD0DF',
  text: '#3F0620',
  muted: '#C26694',
  accent: '#DB2777',
  win: '#16A34A',
  draw: '#CA8A04',
  lose: '#DC2626',
  chip: '#FBE4EF',
};

const DARK = {
  bg: '#070C0A',
  card: '#0F1B17',
  border: '#2A3630',
  text: '#EFF4EF',
  muted: '#6C8577',
  accent: '#6FDE8F',
  win: '#22C55E',
  draw: '#EAB308',
  lose: '#EF4444',
  chip: '#1B2E27',
};

let P = DARK;

const WIDTH = 860;
const SCALE = 2;
const LOGO_TIMEOUT_MS = 4000;

function outcomeColor(label: string): string {
  if (label === 'Draw') return P.draw;
  return P.win;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startPx: number, weight: number): number {
  let size = startPx;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  }
  return size;
}

function loadLogo(src: string | null | undefined): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), LOGO_TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

async function preloadEmblems(fixtures: Fixture[]) {
  const pairs = await Promise.all(
    fixtures.map(async (f) => ({
      home: await loadLogo(f.homeTeamLogo),
      away: await loadLogo(f.awayTeamLogo),
    }))
  );
  return pairs;
}

function drawEmblem(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  teamName: string,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img && img.naturalWidth > 0) {
    const ratio = Math.max((radius * 2) / img.naturalWidth, (radius * 2) / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = P.chip;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = P.muted;
    ctx.font = `800 ${Math.round(radius)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(teamName.charAt(0).toUpperCase(), cx, cy + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }
  ctx.restore();
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawProbBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  p: Fixture['prediction']['probabilities']
) {
  const total = p.homeWin + p.draw + p.awayWin || 1;
  const segments: [number, string][] = [
    [(p.homeWin / total) * w, P.win],
    [(p.draw / total) * w, P.draw],
    [(p.awayWin / total) * w, P.lose],
  ];
  let cx = x;
  for (const [sw, color] of segments) {
    ctx.fillStyle = color;
    ctx.fillRect(cx, y, sw, h);
    cx += sw;
  }
}

interface EmblemPair {
  home: HTMLImageElement | null;
  away: HTMLImageElement | null;
}

function drawFixtureRow(ctx: CanvasRenderingContext2D, f: Fixture, y: number, height: number, emblems: EmblemPair) {
  const pad = 24;
  const innerW = WIDTH - pad * 2;
  ctx.fillStyle = P.card;
  roundRect(ctx, pad, y, innerW, height - 14, 14);
  ctx.fill();
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  const topY = y + 26;
  ctx.fillStyle = P.muted;
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${f.flag} ${f.leagueName} · ${f.time}`, pad + 22, topY);

  const emblemX = pad + 40;
  const textX = pad + 74;

  drawEmblem(ctx, emblems.home, f.homeTeam, emblemX, topY + 28, 17);
  drawEmblem(ctx, emblems.away, f.awayTeam, emblemX, topY + 66, 17);

  ctx.fillStyle = P.text;
  ctx.font = '700 23px system-ui, sans-serif';
  ctx.fillText(f.homeTeam, textX, topY + 36);
  ctx.fillText(f.awayTeam, textX, topY + 74);

  const barX = pad + 22;
  const barY = topY + 88;
  const probs = f.prediction.probabilities;
  drawProbBar(ctx, barX, barY, 400, 10, probs);

  ctx.font = '600 13px ui-monospace, monospace';
  ctx.fillStyle = P.win;
  ctx.fillText(`${probs.homeWin}%`, barX, barY + 28);
  ctx.fillStyle = P.draw;
  ctx.textAlign = 'center';
  ctx.fillText(`${probs.draw}%`, barX + 200, barY + 28);
  ctx.fillStyle = P.lose;
  ctx.textAlign = 'left';
  ctx.fillText(`${probs.awayWin}%`, barX + 352, barY + 28);

  const outcomes = [
    { label: f.homeTeam, pct: probs.homeWin },
    { label: 'Draw', pct: probs.draw },
    { label: f.awayTeam, pct: probs.awayWin },
  ];
  const best = outcomes.reduce((a, b) => (b.pct > a.pct ? b : a));
  const color = outcomeColor(best.label);

  const panelX = pad + innerW - 250;
  const panelW = 226;
  ctx.strokeStyle = color;
  roundRect(ctx, panelX, y + 20, panelW, height - 48, 12);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = P.muted;
  ctx.font = '600 12px ui-monospace, monospace';
  ctx.fillText('PROJECTED RESULT', panelX + panelW / 2, y + 46);

  ctx.fillStyle = P.text;
  const nameSize = fitFont(ctx, best.label, panelW - 24, 24, 800);
  ctx.font = `800 ${nameSize}px system-ui, sans-serif`;
  ctx.fillText(best.label, panelX + panelW / 2, y + 78);

  ctx.fillStyle = color;
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText(`${best.pct}%`, panelX + panelW / 2, y + 114);

  ctx.textAlign = 'left';
}

export async function exportFixturesImage(fixtures: Fixture[], dateStr: string, theme: Theme = 'dark') {
  if (fixtures.length === 0 || typeof document === 'undefined') return;

  P = theme === 'light' ? LIGHT : DARK;

  const emblemsList = await preloadEmblems(fixtures);

  const headerH = 96;
  const rowH = 162;
  const footerH = 52;
  const height = headerH + fixtures.length * rowH + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = P.text;
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText('Euro Footy Predictor', 24, 46);

  ctx.fillStyle = P.muted;
  ctx.font = '500 16px ui-monospace, monospace';
  ctx.fillText(`${dateStr} · ${fixtures.length} game${fixtures.length === 1 ? '' : 's'}`, 24, 74);

  fixtures.forEach((f, i) => drawFixtureRow(ctx, f, headerH + i * rowH, rowH, emblemsList[i]));

  const footY = height - 24;
  ctx.fillStyle = P.muted;
  ctx.font = '500 13px system-ui, sans-serif';
  ctx.fillText('12-Factor Poisson · Dixon-Coles engine', 24, footY);
  ctx.textAlign = 'right';
  ctx.fillText(new Date().toISOString().slice(0, 16).replace('T', ' '), WIDTH - 24, footY);
  ctx.textAlign = 'left';

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fixtures-${dateStr || new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
