export default async function handler(req, res) {
  const { league, region = 'eu', markets = 'h2h', bookmakers } = req.query;

  if (!league) {
    return res.status(400).json({ error: 'Missing league parameter' });
  }

  const ODDS_API_KEY = process.env.ODDS_API_KEY;
  if (!ODDS_API_KEY) {
    return res.status(500).json({ error: 'ODDS_API_KEY not configured' });
  }

  const sportMap = {
    'soccer_epl': 'soccer_epl',
    'soccer_spain_la_liga': 'soccer_spain_la_liga',
    'soccer_germany_bundesliga': 'soccer_germany_bundesliga',
    'soccer_italy_serie_a': 'soccer_italy_serie_a',
    'soccer_france_ligue_one': 'soccer_france_ligue_one',
    'soccer_uefa_champs_league': 'soccer_uefa_champs_league',
    'soccer_uefa_europa_league': 'soccer_uefa_europa_league',
    'soccer_usa_mls': 'soccer_usa_mls',
    'soccer_brazil_campeonato': 'soccer_brazil_campeonato',
    'soccer_china_superleague': 'soccer_china_superleague',
    'soccer_japan_j_league': 'soccer_japan_j_league',
    'soccer_korea_kleague1': 'soccer_korea_kleague1',
    'soccer_australia_aleague': 'soccer_australia_aleague',
    'soccer_turkey_super_lig': 'soccer_turkey_super_lig',
    'soccer_netherlands_eredivisie': 'soccer_netherlands_eredivisie',
    'soccer_belgium_first_division_a': 'soccer_belgium_first_division_a',
    'soccer_portugal_liga_primeira': 'soccer_portugal_liga_primeira',
    'soccer_sweden_allsvenskan': 'soccer_sweden_allsvenskan',
    'soccer_norway_eliteserien': 'soccer_norway_eliteserien',
    'soccer_denmark_superligaen': 'soccer_denmark_superligaen',
    'soccer_finland_veikkausliiga': 'soccer_finland_veikkausliiga',
    'soccer_switzerland_superleague': 'soccer_switzerland_superleague',
    'soccer_austria_bundesliga': 'soccer_austria_bundesliga',
    'soccer_czech_republic_1_liga': 'soccer_czech_republic_1_liga',
    'soccer_poland_ekstraklasa': 'soccer_poland_ekstraklasa',
    'soccer_romania_liga_1': 'soccer_romania_liga_1',
    'soccer_croatia_hnl': 'soccer_croatia_hnl',
    'soccer_serbia_superliga': 'soccer_serbia_superliga',
    'soccer_bulgaria_first_league': 'soccer_bulgaria_first_league',
    'soccer_greece_super_league': 'soccer_greece_super_league',
    'soccer_ukraine_premier_league': 'soccer_ukraine_premier_league',
    'soccer_russia_premier_league': 'soccer_russia_premier_league',
    'soccer_saudi_pro_league': 'soccer_saudi_pro_league',
    'soccer_uae_agulf_pro_league': 'soccer_uae_agulf_pro_league',
    'soccer_qatar_stars_league': 'soccer_qatar_stars_league',
    'soccer_egypt_premier_league': 'soccer_egypt_premier_league',
    'soccer_south_africa_premier_league': 'soccer_south_africa_premier_league',
    'soccer_india_super_league': 'soccer_india_super_league',
    'soccer_thailand_premier_league': 'soccer_thailand_premier_league',
    'soccer_vietnam_v_league': 'soccer_vietnam_v_league',
    'soccer_malaysia_super_league': 'soccer_malaysia_super_league',
    'soccer_singapore_premier_league': 'soccer_singapore_premier_league',
    'soccer_hong_premier_league': 'soccer_hong_premier_league',
    'soccer_new_zealand_premiership': 'soccer_new_zealand_premiership',
    'soccer_australia_npl': 'soccer_australia_npl',
    'soccer_usa_usl_championship': 'soccer_usa_usl_championship',
    'soccer_usa_usl_league_one': 'soccer_usa_usl_league_one',
    'soccer_usa_usl_league_two': 'soccer_usa_usl_league_two',
    'soccer_usa_nisa': 'soccer_usa_nisa',
    'soccer_usa_pdl': 'soccer_usa_pdl',
    'soccer_canada_pl': 'soccer_canada_pl',
    'soccer_mexico_ligamx': 'soccer_mexico_ligamx',
    'soccer_argentina_primera_division': 'soccer_argentina_primera_division',
    'soccer_chile_primera_division': 'soccer_chile_primera_division',
    'soccer_colombia_liga_aguila': 'soccer_colombia_liga_aguila',
    'soccer_peru_primera_division': 'soccer_peru_primera_division',
    'soccer_uruguay_primera_division': 'soccer_uruguay_primera_division',
    'soccer_venezuela_primera_division': 'soccer_venezuela_primera_division',
    'soccer_bolivia_liga_futpro': 'soccer_bolivia_liga_futpro',
    'soccer_ecuador_liga_pro': 'soccer_ecuador_liga_pro',
    'soccer_paraguay_primera_division': 'soccer_paraguay_primera_division',
  };

  const sport = sportMap[league] || league;
  
  const validRegions = ['us', 'uk', 'eu', 'au'];
  const selectedRegion = validRegions.includes(region) ? region : 'eu';
  
  const validMarkets = ['h2h', 'spreads', 'totals'];
  const selectedMarkets = markets.split(',').filter(m => validMarkets.includes(m));
  if (selectedMarkets.length === 0) selectedMarkets.push('h2h');

  let url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=${selectedRegion}&markets=${selectedMarkets.join(',')}`;
  
  if (bookmakers) {
    url += `&bookmakers=${bookmakers}`;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
      }
      if (response.status === 403) {
        return res.status(403).json({ error: 'API quota exceeded or subscription required' });
      }
      if (response.status === 404) {
        return res.status(404).json({ error: 'No odds found for this sport/league' });
      }
      return res.status(response.status).json({ error: 'Odds API error' });
    }

    const data = await response.json();
    
    const remaining = response.headers.get('x-requests-remaining');
    const used = response.headers.get('x-requests-used');
    
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json({
      sport,
      region: selectedRegion,
      markets: selectedMarkets,
      data,
      meta: {
        remaining: remaining ? parseInt(remaining) : null,
        used: used ? parseInt(used) : null
      }
    });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Odds API timeout' });
    }
    return res.status(502).json({ error: 'Failed to fetch odds data' });
  }
}