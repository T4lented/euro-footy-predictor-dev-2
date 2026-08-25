/**
 * European Leagues, Domestic Cups & UEFA Competitions Configuration
 */

const DOMESTIC_LEAGUE_CODES = ['PL', 'PD', 'SA', 'BL', 'FL1', 'DED', 'PPL', 'BPL', 'SP', 'TSL'];
const UEFA_CODES = ['UCL', 'UEL', 'UECL'];
const DOMESTIC_CUP_CODES = ['FAC', 'CDR', 'CI', 'DFB', 'CDF', 'KNVB', 'TDP', 'BCP', 'SCO', 'TKC'];

export const LEAGUES = {
  // Domestic leagues
  PL: { code: 'PL', espnCode: 'eng.1', name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', avgGoalsPerGame: 2.85, homeAdvantageBase: 1.15, type: 'league' },
  PD: { code: 'PD', espnCode: 'esp.1', name: 'La Liga', country: 'Spain', flag: '🇪🇸', avgGoalsPerGame: 2.60, homeAdvantageBase: 1.18, type: 'league' },
  SA: { code: 'SA', espnCode: 'ita.1', name: 'Serie A', country: 'Italy', flag: '🇮🇹', avgGoalsPerGame: 2.65, homeAdvantageBase: 1.16, type: 'league' },
  BL: { code: 'BL', espnCode: 'ger.1', name: 'Bundesliga', country: 'Germany', flag: '🇩🇪', avgGoalsPerGame: 3.10, homeAdvantageBase: 1.14, type: 'league' },
  FL1: { code: 'FL1', espnCode: 'fra.1', name: 'Ligue 1', country: 'France', flag: '🇫🇷', avgGoalsPerGame: 2.70, homeAdvantageBase: 1.15, type: 'league' },
  DED: { code: 'DED', espnCode: 'ned.1', name: 'Eredivisie', country: 'Netherlands', flag: '🇳🇱', avgGoalsPerGame: 3.15, homeAdvantageBase: 1.17, type: 'league' },
  PPL: { code: 'PPL', espnCode: 'por.1', name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹', avgGoalsPerGame: 2.55, homeAdvantageBase: 1.20, type: 'league' },
  BPL: { code: 'BPL', espnCode: 'bel.1', name: 'Belgian Pro League', country: 'Belgium', flag: '🇧🇪', avgGoalsPerGame: 2.80, homeAdvantageBase: 1.15, type: 'league' },
  SP: { code: 'SP', espnCode: 'sco.1', name: 'Scottish Premiership', country: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', avgGoalsPerGame: 2.75, homeAdvantageBase: 1.22, type: 'league' },
  TSL: { code: 'TSL', espnCode: 'tur.1', name: 'Süper Lig', country: 'Turkey', flag: '🇹🇷', avgGoalsPerGame: 2.80, homeAdvantageBase: 1.25, type: 'league' },

  // Domestic cups
  FAC: { code: 'FAC', espnCode: 'eng.fa', name: 'FA Cup', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', avgGoalsPerGame: 2.75, homeAdvantageBase: 1.12, type: 'cup' },
  CDR: { code: 'CDR', espnCode: 'esp.copa_del_rey', name: 'Copa del Rey', country: 'Spain', flag: '🇪🇸', avgGoalsPerGame: 2.55, homeAdvantageBase: 1.11, type: 'cup' },
  CI: { code: 'CI', espnCode: 'ita.coppa_italia', name: 'Coppa Italia', country: 'Italy', flag: '🇮🇹', avgGoalsPerGame: 2.50, homeAdvantageBase: 1.11, type: 'cup' },
  DFB: { code: 'DFB', espnCode: 'ger.dfb_pokal', name: 'DFB-Pokal', country: 'Germany', flag: '🇩🇪', avgGoalsPerGame: 2.90, homeAdvantageBase: 1.10, type: 'cup' },
  CDF: { code: 'CDF', espnCode: 'fra.coupe_de_france', name: 'Coupe de France', country: 'France', flag: '🇫🇷', avgGoalsPerGame: 2.65, homeAdvantageBase: 1.11, type: 'cup' },
  KNVB: { code: 'KNVB', espnCode: 'ned.cup', name: 'KNVB Beker', country: 'Netherlands', flag: '🇳🇱', avgGoalsPerGame: 2.85, homeAdvantageBase: 1.11, type: 'cup' },
  TDP: { code: 'TDP', espnCode: 'por.taca.portugal', name: 'Taça de Portugal', country: 'Portugal', flag: '🇵🇹', avgGoalsPerGame: 2.50, homeAdvantageBase: 1.11, type: 'cup' },
  BCP: { code: 'BCP', espnCode: 'bel.cup', name: 'Belgian Cup', country: 'Belgium', flag: '🇧🇪', avgGoalsPerGame: 2.70, homeAdvantageBase: 1.11, type: 'cup' },
  SCO: { code: 'SCO', espnCode: 'sco.tennents', name: 'Scottish Cup', country: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', avgGoalsPerGame: 2.65, homeAdvantageBase: 1.12, type: 'cup' },
  TKC: { code: 'TKC', espnCode: 'tur.cup', name: 'Turkish Cup', country: 'Turkey', flag: '🇹🇷', avgGoalsPerGame: 2.60, homeAdvantageBase: 1.11, type: 'cup' },

  // UEFA competitions
  UCL: { code: 'UCL', espnCode: 'uefa.champions', name: 'Champions League', country: 'Europe', flag: '🏆', avgGoalsPerGame: 2.70, homeAdvantageBase: 1.08, type: 'uefa' },
  UEL: { code: 'UEL', espnCode: 'uefa.europa', name: 'Europa League', country: 'Europe', flag: '🏆', avgGoalsPerGame: 2.65, homeAdvantageBase: 1.08, type: 'uefa' },
  UECL: { code: 'UECL', espnCode: 'uefa.europa.conf', name: 'Conference League', country: 'Europe', flag: '🏆', avgGoalsPerGame: 2.60, homeAdvantageBase: 1.08, type: 'uefa' }
};

export const LEAGUE_LIST = Object.values(LEAGUES);

export { DOMESTIC_LEAGUE_CODES, UEFA_CODES, DOMESTIC_CUP_CODES };

export function isCrossLeagueCompetition(leagueCode) {
  return UEFA_CODES.includes(leagueCode) || DOMESTIC_CUP_CODES.includes(leagueCode);
}

const LEAGUE_ALIASES = {
  // UEFA
  champions: 'UCL', 'champions league': 'UCL', ucl: 'UCL', cl: 'UCL',
  europa: 'UEL', 'europa league': 'UEL', uel: 'UEL', el: 'UEL',
  conference: 'UECL', 'conference league': 'UECL', uecl: 'UECL', ecl: 'UECL',
  // Domestic cups
  'fa cup': 'FAC', facup: 'FAC', 'english fa cup': 'FAC',
  'copa del rey': 'CDR', copa: 'CDR',
  'coppa italia': 'CI', coppa: 'CI',
  'dfb pokal': 'DFB', dfbpokal: 'DFB', 'dfb-pokal': 'DFB',
  'coupe de france': 'CDF',
  knvb: 'KNVB', 'knvb beker': 'KNVB', beker: 'KNVB',
  'taca de portugal': 'TDP', 'taça de portugal': 'TDP',
  'belgian cup': 'BCP', 'croky cup': 'BCP',
  'scottish cup': 'SCO', tennents: 'SCO',
  'turkish cup': 'TKC', 'ziraat cup': 'TKC'
};

export function findLeague(query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();

  if (LEAGUE_ALIASES[q]) return LEAGUES[LEAGUE_ALIASES[q]];

  return LEAGUE_LIST.find(l =>
    l.code.toLowerCase() === q ||
    l.name.toLowerCase().includes(q) ||
    l.country.toLowerCase() === q ||
    (l.espnCode && l.espnCode.toLowerCase() === q)
  ) || null;
}

const EUROPEAN_DEFAULTS = { avgGoalsPerGame: 2.68, homeAdvantageBase: 1.08 };
const CUP_DEFAULTS = { avgGoalsPerGame: 2.65, homeAdvantageBase: 1.11 };

export function resolveLeagueConfig(leagueCode) {
  if (LEAGUES[leagueCode]) return LEAGUES[leagueCode];
  if (UEFA_CODES.includes(leagueCode)) return { code: leagueCode, ...EUROPEAN_DEFAULTS };
  if (DOMESTIC_CUP_CODES.includes(leagueCode)) return { code: leagueCode, ...CUP_DEFAULTS };
  return LEAGUES.PL;
}
