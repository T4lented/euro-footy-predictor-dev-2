/**
 * Fixtures Service - Real Live API Integration
 * Primary: ESPN Open Soccer Scoreboard API (100% Free, Keyless)
 * Secondary / Fallback: Football-Data.org API
 */
import { LEAGUES, LEAGUE_LIST, findLeague } from '../config/leagues.js';
import { predictMatch } from './predictionEngine.js';
import { fdFetch, parseKeys } from './fdClient.js';

const TEAM_LOGOS = {
  'Arsenal': 'https://resources.premierleague.com/premierleague/badges/rb/t3.svg',
  'Aston Villa': 'https://resources.premierleague.com/premierleague/badges/rb/t7.svg',
  'Bournemouth': 'https://resources.premierleague.com/premierleague/badges/rb/t91.svg',
  'Brentford': 'https://resources.premierleague.com/premierleague/badges/rb/t94.svg',
  'Brighton and Hove Albion': 'https://resources.premierleague.com/premierleague/badges/rb/t36.svg',
  'Chelsea': 'https://resources.premierleague.com/premierleague/badges/rb/t8.svg',
  'Coventry City': 'https://resources.premierleague.com/premierleague/badges/rb/t34.svg',
  'Crystal Palace': 'https://resources.premierleague.com/premierleague/badges/rb/t31.svg',
  'Everton': 'https://resources.premierleague.com/premierleague/badges/rb/t11.svg',
  'Fulham': 'https://resources.premierleague.com/premierleague/badges/rb/t54.svg',
  'Hull City': 'https://resources.premierleague.com/premierleague/badges/rb/t46.svg',
  'Ipswich Town': 'https://resources.premierleague.com/premierleague/badges/rb/t39.svg',
  'Leeds United': 'https://resources.premierleague.com/premierleague/badges/rb/t2.svg',
  'Liverpool': 'https://resources.premierleague.com/premierleague/badges/rb/t14.svg',
  'Manchester City': 'https://resources.premierleague.com/premierleague/badges/rb/t43.svg',
  'Manchester United': 'https://resources.premierleague.com/premierleague/badges/rb/t1.svg',
  'Newcastle United': 'https://resources.premierleague.com/premierleague/badges/rb/t4.svg',
  'Nottingham Forest': 'https://resources.premierleague.com/premierleague/badges/rb/t17.svg',
  'Sunderland': 'https://resources.premierleague.com/premierleague/badges/rb/t56.svg',
  'Tottenham Hotspur': 'https://resources.premierleague.com/premierleague/badges/rb/t6.svg',
  'West Ham United': 'https://resources.premierleague.com/premierleague/badges/rb/t21.svg',
  'Wolverhampton Wanderers': 'https://resources.premierleague.com/premierleague/badges/rb/t39.svg',

  'Real Madrid': 'https://assets.fontbit.io/la-liga/teams/real-madrid.svg',
  'FC Barcelona': 'https://assets.fontbit.io/la-liga/teams/fc-barcelona.svg',
  'Atletico Madrid': 'https://assets.fontbit.io/la-liga/teams/atletico-madrid.svg',
  'Athletic Bilbao': 'https://assets.fontbit.io/la-liga/teams/athletic-bilbao.svg',
  'Real Sociedad': 'https://assets.fontbit.io/la-liga/teams/real-sociedad.svg',
  'Real Betis': 'https://assets.fontbit.io/la-liga/teams/real-betis.svg',
  'Villarreal': 'https://assets.fontbit.io/la-liga/teams/villarreal.svg',
  'Girona': 'https://assets.fontbit.io/la-liga/teams/girona.svg',
  'Getafe': 'https://assets.fontbit.io/la-liga/teams/getafe.svg',
  'Sevilla': 'https://assets.fontbit.io/la-liga/teams/sevilla.svg',
  'Celta Vigo': 'https://assets.fontbit.io/la-liga/teams/celta-vigo.svg',
  'Mallorca': 'https://assets.fontbit.io/la-liga/teams/mallorca.svg',
  'Osasuna': 'https://assets.fontbit.io/la-liga/teams/osasuna.svg',
  'Rayo Vallecano': 'https://assets.fontbit.io/la-liga/teams/rayo-vallecano.svg',
  'Las Palmas': 'https://assets.fontbit.io/la-liga/teams/las-palmas.svg',
  'Leganes': 'https://assets.fontbit.io/la-liga/teams/leganes.svg',
  'Alaves': 'https://assets.fontbit.io/la-liga/teams/alaves.svg',
  'Espanyol': 'https://assets.fontbit.io/la-liga/teams/espanyol.svg',
  'Real Valladolid': 'https://assets.fontbit.io/la-liga/teams/real-valladolid.svg',
  'Valencia': 'https://assets.fontbit.io/la-liga/teams/valencia.svg',

  'Bayern Munich': 'https://api.bundesliga.com/static/bundesliga/img/team logos/B0W.svg',
  'Bayer Leverkusen': 'https://api.bundesliga.com/static/bundesliga/img/team logos/X0I.svg',
  'Borussia Dortmund': 'https://api.bundesliga.com/static/bundesliga/img/team logos/EWD.svg',
  'RB Leipzig': 'https://api.bundesliga.com/static/bundesliga/img/team logos/04M.svg',
  'VfB Stuttgart': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05S.svg',
  'Eintracht Frankfurt': 'https://api.bundesliga.com/static/bundesliga/img/team logos/01F.svg',
  'VfL Wolfsburg': 'https://api.bundesliga.com/static/bundesliga/img/team logos/04W.svg',
  'SC Freiburg': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05F.svg',
  'Borussia Monchengladbach': 'https://api.bundesliga.com/static/bundesliga/img/team logos/03M.svg',
  'Werder Bremen': 'https://api.bundesliga.com/static/bundesliga/img/team logos/009.svg',
  '1. FC Union Berlin': 'https://api.bundesliga.com/static/bundesliga/img/team logos/U03.svg',
  '1. FC Heidenheim': 'https://api.bundesliga.com/static/bundesliga/img/team logos/01H.svg',
  '1. FSV Mainz 05': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05M.svg',
  'FC Augsburg': 'https://api.bundesliga.com/static/bundesliga/img/team logos/0FA.svg',
  'TSG 1899 Hoffenheim': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05T.svg',
  'Darmstadt 98': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05D.svg',
  'FC Koln': 'https://api.bundesliga.com/static/bundesliga/img/team logos/01C.svg',
  'SV Darmstadt 98': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05D.svg',
  'Holstein Kiel': 'https://api.bundesliga.com/static/bundesliga/img/team logos/0HK.svg',
  'FC St. Pauli': 'https://api.bundesliga.com/static/bundesliga/img/team logos/0S9.svg',

  'Inter Milan': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/INTER.png',
  'AC Milan': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/MILAN.png',
  'Juventus': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/JUVE.png',
  'Napoli': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/NAPOLI.png',
  'AS Roma': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/ROMA.png',
  'Lazio': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/LAZIO.png',
  'Atalanta': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/ATALANTA.png',
  'Fiorentina': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/FIORENTINA.png',
  'Bologna': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/BOLOGNA.png',
  'Torino': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/TORINO.png',
  'Monza': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/MONZA.png',
  'Genoa': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/GENOA.png',
  'Lecce': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/LECCE.png',
  'Cagliari': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/CAGLIARI.png',
  'Udinese': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/UDINESE.png',
  'Sassuolo': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/SASSUOLO.png',
  'Empoli': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/EMPOLI.png',
  'Verona': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/VERONA.png',
  'Frosinone': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/FROSINONE.png',
  'Salernitana': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/SALERNITANA.png',
  'Parma': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/PARMA.png',
  'Venezia': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/VENEZIA.png',
  'Como': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/COMO.png',

  'Paris Saint-Germain': 'https://www.ligue1.com/imgStore/psg_logo_200_200.png',
  'Olympique Marseille': 'https://www.ligue1.com/imgStore/om_logo_200_200.png',
  'AS Monaco': 'https://www.ligue1.com/imgStore/asm_logo_200_200.png',
  'Olympique Lyonnais': 'https://www.ligue1.com/imgStore/ol_logo_200_200.png',
  'Lille': 'https://www.ligue1.com/imgStore/losc_logo_200_200.png',
  'Nice': 'https://www.ligue1.com/imgStore/nice_logo_200_200.png',
  'Rennes': 'https://www.ligue1.com/imgStore/stade_rennais_logo_200_200.png',
  'Lens': 'https://www.ligue1.com/imgStore/rc_lens_logo_200_200.png',
  'Brest': 'https://www.ligue1.com/imgStore/stade_brestois_logo_200_200.png',
  'Strasbourg': 'https://www.ligue1.com/imgStore/rcs_logo_200_200.png',
  'Nantes': 'https://www.ligue1.com/imgStore/fcn_logo_200_200.png',
  'Montpellier': 'https://www.ligue1.com/imgStore/mhsc_logo_200_200.png',
  'Toulouse': 'https://www.ligue1.com/imgStore/tfc_logo_200_200.png',
  'Reims': 'https://www.ligue1.com/imgStore/sdr_logo_200_200.png',
  'Le Havre': 'https://www.ligue1.com/imgStore/hac_logo_200_200.png',
  'Metz': 'https://www.ligue1.com/imgStore/as_logo_200_200.png',
  'Clermont': 'https://www.ligue1.com/imgStore/cf63_logo_200_200.png',
  'Lorient': 'https://www.ligue1.com/imgStore/fcl_logo_200_200.png',

  'PSV Eindhoven': 'https://www.eredivisie.nl/assets/images/logos/teams/psv.svg',
  'Ajax': 'https://www.eredivisie.nl/assets/images/logos/teams/ajax.svg',
  'Feyenoord': 'https://www.eredivisie.nl/assets/images/logos/teams/feyenoord.svg',
  'AZ Alkmaar': 'https://www.eredivisie.nl/assets/images/logos/teams/az.svg',
  'FC Twente': 'https://www.eredivisie.nl/assets/images/logos/teams/twente.svg',
  'FC Utrecht': 'https://www.eredivisie.nl/assets/images/logos/teams/utrecht.svg',
  'Vitesse': 'https://www.eredivisie.nl/assets/images/logos/teams/vitesse.svg',
  'Heerenveen': 'https://www.eredivisie.nl/assets/images/logos/teams/heerenveen.svg',
  'FC Groningen': 'https://www.eredivisie.nl/assets/images/logos/teams/groningen.svg',
  'Go Ahead Eagles': 'https://www.eredivisie.nl/assets/images/logos/teams/gae.svg',
  'NAC Breda': 'https://www.eredivisie.nl/assets/images/logos/teams/nac.svg',
  'NEC Nijmegen': 'https://www.eredivisie.nl/assets/images/logos/teams/nec.svg',
  'Fortuna Sittard': 'https://www.eredivisie.nl/assets/images/logos/teams/fortuna.svg',
  'SC Cambuur': 'https://www.eredivisie.nl/assets/images/logos/teams/cambuur.svg',
  'PEC Zwolle': 'https://www.eredivisie.nl/assets/images/logos/teams/pec.svg',
  'Excelsior': 'https://www.eredivisie.nl/assets/images/logos/teams/excelsior.svg',
  'FC Volendam': 'https://www.eredivisie.nl/assets/images/logos/teams/volendam.svg',
  'RKC Waalwijk': 'https://www.eredivisie.nl/assets/images/logos/teams/rkc.svg',
  'Heracles Almelo': 'https://www.eredivisie.nl/assets/images/logos/teams/heracles.svg',
  'Almere City': 'https://www.eredivisie.nl/assets/images/logos/teams/almere.svg',

  'Sporting CP': 'https://www.ligaportugal.pt/assets/images/teams/sp-logo.svg',
  'Benfica': 'https://www.ligaportugal.pt/assets/images/teams/ben-logo.svg',
  'Porto': 'https://www.ligaportugal.pt/assets/images/teams/fcp-logo.svg',
  'Braga': 'https://www.ligaportugal.pt/assets/images/teams/scb-logo.svg',
  'Vitoria Guimaraes': 'https://www.ligaportugal.pt/assets/images/teams/vit-logo.svg',
  'Gil Vicente': 'https://www.ligaportugal.pt/assets/images/teams/gil-logo.svg',
  'Casa Pia': 'https://www.ligaportugal.pt/assets/images/teams/cpia-logo.svg',
  'Famalicao': 'https://www.ligaportugal.pt/assets/images/teams/fam-logo.svg',
  'Arouca': 'https://www.ligaportugal.pt/assets/images/teams/arouca-logo.svg',
  'Rio Ave': 'https://www.ligaportugal.pt/assets/images/teams/rioave-logo.svg',
  'Boavista': 'https://www.ligaportugal.pt/assets/images/teams/boa-logo.svg',
  'Estoril': 'https://www.ligaportugal.pt/assets/images/teams/est-logo.svg',
  'Portimonense': 'https://www.ligaportugal.pt/assets/images/teams/ptm-logo.svg',
  'Moreirense': 'https://www.ligaportugal.pt/assets/images/teams/mor-logo.svg',
  'Chaves': 'https://www.ligaportugal.pt/assets/images/teams/chv-logo.svg',
  'Estrela Amadora': 'https://www.ligaportugal.pt/assets/images/teams/estrela-logo.svg',
  'Farense': 'https://www.ligaportugal.pt/assets/images/teams/far-logo.svg',
  'GIL Vicente': 'https://www.ligaportugal.pt/assets/images/teams/gil-logo.svg',

  'Club Brugge': 'https://www.proleague.be/assets/images/logos/cb.svg',
  'Anderlecht': 'https://www.proleague.be/assets/images/logos/raa.svg',
  'Royal Antwerp': 'https://www.proleague.be/assets/images/logos/rap.svg',
  'Union SG': 'https://www.proleague.be/assets/images/logos/usg.svg',
  'Gent': 'https://www.proleague.be/assets/images/logos/kaa.svg',
  'Genk': 'https://www.proleague.be/assets/images/logos/rkg.svg',
  'Mechelen': 'https://www.proleague.be/assets/images/logos/km.svg',
  'Standard Liege': 'https://www.proleague.be/assets/images/logos/rsl.svg',
  'Cercle Brugge': 'https://www.proleague.be/assets/images/logos/cb.svg',
  'OH Leuven': 'https://www.proleague.be/assets/images/logos/ohl.svg',
  'Sint-Truiden': 'https://www.proleague.be/assets/images/logos/stvv.svg',
  'Kortrijk': 'https://www.proleague.be/assets/images/logos/kvk.svg',
  'Westerlo': 'https://www.proleague.be/assets/images/logos/kvw.svg',
  'Charleroi': 'https://www.proleague.be/assets/images/logos/zc.svg',
  'Dender': 'https://www.proleague.be/assets/images/logos/fcd.svg',
  'Beerschot': 'https://www.proleague.be/assets/images/logos/krwa.svg',

  'Celtic': 'https://www.spfl.co.uk/assets/images/logos/celtic.svg',
  'Rangers': 'https://www.spfl.co.uk/assets/images/logos/rangers.svg',
  'Hearts': 'https://www.spfl.co.uk/assets/images/logos/hearts.svg',
  'Hibernian': 'https://www.spfl.co.uk/assets/images/logos/hibs.svg',
  'Aberdeen': 'https://www.spfl.co.uk/assets/images/logos/aberdeen.svg',
  'Dundee United': 'https://www.spfl.co.uk/assets/images/logos/dundeeutd.svg',
  'Kilmarnock': 'https://www.spfl.co.uk/assets/images/logos/kilmarnock.svg',
  'St Mirren': 'https://www.spfl.co.uk/assets/images/logos/stmirren.svg',
  'Motherwell': 'https://www.spfl.co.uk/assets/images/logos/motherwell.svg',
  'Livingston': 'https://www.spfl.co.uk/assets/images/logos/livingston.svg',
  'Ross County': 'https://www.spfl.co.uk/assets/images/logos/rosscounty.svg',
  'St Johnstone': 'https://www.spfl.co.uk/assets/images/logos/stjohnstone.svg',

  'Galatasaray': 'https://www.superlig.com/assets/images/logos/galatasaray.svg',
  'Fenerbahce': 'https://www.superlig.com/assets/images/logos/fenerbahce.svg',
  'Besiktas': 'https://www.superlig.com/assets/images/logos/besiktas.svg',
  'Trabzonspor': 'https://www.superlig.com/assets/images/logos/trabzonspor.svg',
  'Istanbul Basaksehir': 'https://www.superlig.com/assets/images/logos/basaksehir.svg',
  'Antalyaspor': 'https://www.superlig.com/assets/images/logos/antalyaspor.svg',
  'Adana Demirspor': 'https://www.superlig.com/assets/images/logos/adanademir.svg',
  'Kayserispor': 'https://www.superlig.com/assets/images/logos/kayserispor.svg',
  'Konyaspor': 'https://www.superlig.com/assets/images/logos/konyaspor.svg',
  'Alanyaspor': 'https://www.superlig.com/assets/images/logos/alanyaspor.svg',
  'Hatayspor': 'https://www.superlig.com/assets/images/logos/hatayspor.svg',
  'Gaziantep FK': 'https://www.superlig.com/assets/images/logos/gaziantep.svg',
  'Sivasspor': 'https://www.superlig.com/assets/images/logos/sivasspor.svg',
  'Kasimpasa': 'https://www.superlig.com/assets/images/logos/kasimpasa.svg',
  'Giresunspor': 'https://www.superlig.com/assets/images/logos/giresun.svg',
  'Ankaragucu': 'https://www.superlig.com/assets/images/logos/ankaragucu.svg',
  'Umraniyespor': 'https://www.superlig.com/assets/images/logos/umraniye.svg',
  'Istanbulspor': 'https://www.superlig.com/assets/images/logos/istanbulspor.svg',

  'Real Madrid CF': 'https://assets.fontbit.io/la-liga/teams/real-madrid.svg',
  'FC Barcelona': 'https://assets.fontbit.io/la-liga/teams/fc-barcelona.svg',
  'Club Atletico de Madrid': 'https://assets.fontbit.io/la-liga/teams/atletico-madrid.svg',
  'Athletic Club': 'https://assets.fontbit.io/la-liga/teams/athletic-bilbao.svg',
  'Real Sociedad de Futbol': 'https://assets.fontbit.io/la-liga/teams/real-sociedad.svg',
  'Real Betis Balompie': 'https://assets.fontbit.io/la-liga/teams/real-betis.svg',
  'Villarreal CF': 'https://assets.fontbit.io/la-liga/teams/villarreal.svg',
  'Girona FC': 'https://assets.fontbit.io/la-liga/teams/girona.svg',
  'Getafe CF': 'https://assets.fontbit.io/la-liga/teams/getafe.svg',
  'Sevilla FC': 'https://assets.fontbit.io/la-liga/teams/sevilla.svg',
  'RC Celta de Vigo': 'https://assets.fontbit.io/la-liga/teams/celta-vigo.svg',
  'RCD Mallorca': 'https://assets.fontbit.io/la-liga/teams/mallorca.svg',
  'CA Osasuna': 'https://assets.fontbit.io/la-liga/teams/osasuna.svg',
  'Rayo Vallecano de Madrid': 'https://assets.fontbit.io/la-liga/teams/rayo-vallecano.svg',
  'UD Las Palmas': 'https://assets.fontbit.io/la-liga/teams/las-palmas.svg',
  'CD Leganes': 'https://assets.fontbit.io/la-liga/teams/leganes.svg',
  'Deportivo Alaves': 'https://assets.fontbit.io/la-liga/teams/alaves.svg',
  'RCD Espanyol de Barcelona': 'https://assets.fontbit.io/la-liga/teams/espanyol.svg',
  'Real Valladolid CF': 'https://assets.fontbit.io/la-liga/teams/real-valladolid.svg',
  'Valencia CF': 'https://assets.fontbit.io/la-liga/teams/valencia.svg',

  'FC Bayern München': 'https://api.bundesliga.com/static/bundesliga/img/team logos/B0W.svg',
  'Bayer 04 Leverkusen': 'https://api.bundesliga.com/static/bundesliga/img/team logos/X0I.svg',
  'Borussia Dortmund': 'https://api.bundesliga.com/static/bundesliga/img/team logos/EWD.svg',
  'RB Leipzig': 'https://api.bundesliga.com/static/bundesliga/img/team logos/04M.svg',
  'VfB Stuttgart': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05S.svg',
  'Eintracht Frankfurt': 'https://api.bundesliga.com/static/bundesliga/img/team logos/01F.svg',
  'VfL Wolfsburg': 'https://api.bundesliga.com/static/bundesliga/img/team logos/04W.svg',
  'SC Freiburg': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05F.svg',
  'Borussia Monchengladbach': 'https://api.bundesliga.com/static/bundesliga/img/team logos/03M.svg',
  'SV Werder Bremen': 'https://api.bundesliga.com/static/bundesliga/img/team logos/009.svg',
  '1. FC Union Berlin': 'https://api.bundesliga.com/static/bundesliga/img/team logos/U03.svg',
  '1. FC Heidenheim 1846': 'https://api.bundesliga.com/static/bundesliga/img/team logos/01H.svg',
  '1. FSV Mainz 05': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05M.svg',
  'FC Augsburg': 'https://api.bundesliga.com/static/bundesliga/img/team logos/0FA.svg',
  'TSG 1899 Hoffenheim': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05T.svg',
  'SV Darmstadt 98': 'https://api.bundesliga.com/static/bundesliga/img/team logos/05D.svg',
  '1. FC Koln': 'https://api.bundesliga.com/static/bundesliga/img/team logos/01C.svg',
  'Holstein Kiel': 'https://api.bundesliga.com/static/bundesliga/img/team logos/0HK.svg',
  'FC St. Pauli': 'https://api.bundesliga.com/static/bundesliga/img/team logos/0S9.svg',

  'Inter': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/INTER.png',
  'AC Milan': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/MILAN.png',
  'Juventus FC': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/JUVE.png',
  'SSC Napoli': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/NAPOLI.png',
  'AS Roma': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/ROMA.png',
  'SS Lazio': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/LAZIO.png',
  'Atalanta BC': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/ATALANTA.png',
  'ACF Fiorentina': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/FIORENTINA.png',
  'Bologna FC 1909': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/BOLOGNA.png',
  'Torino FC': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/TORINO.png',
  'AC Monza': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/MONZA.png',
  'Genoa CFC': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/GENOA.png',
  'US Lecce': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/LECCE.png',
  'Cagliari Calcio': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/CAGLIARI.png',
  'Udinese Calcio': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/UDINESE.png',
  'US Sassuolo Calcio': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/SASSUOLO.png',
  'Empoli FC': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/EMPOLI.png',
  'Hellas Verona FC': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/VERONA.png',
  'US Frosinone Calcio': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/FROSINONE.png',
  'US Salernitana 1919': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/SALERNITANA.png',
  'Parma Calcio 1913': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/PARMA.png',
  'Venezia FC': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/VENEZIA.png',
  'Como 1907': 'https://img.legaseriea.it/img/1920x1080/series-a/loghi-squadre/COMO.png',
};

function getTeamLogo(teamName) {
  if (!teamName) return null;
  if (TEAM_LOGOS[teamName]) return TEAM_LOGOS[teamName];
  const lower = teamName.toLowerCase();
  for (const [name, url] of Object.entries(TEAM_LOGOS)) {
    if (name.toLowerCase() === lower) return url;
  }
  return null;
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Helper to parse ESPN's "previousMeetings" array into a clean H2H object
 */
function parseH2HFromESPN(previousMeetings, currentHomeTeam, currentAwayTeam) {
  if (!previousMeetings || previousMeetings.length === 0) {
    return null;
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  const last5Meetings = [];

  for (const match of previousMeetings) {
    const date = match.date ? formatDate(new Date(match.date)) : 'Unknown';
    const comps = match.competitions?.[0]?.competitors || [];

    const histHome = comps.find(c => c.homeAway === 'home');
    const histAway = comps.find(c => c.homeAway === 'away');

    const homeName = histHome?.team?.displayName || histHome?.team?.name || 'Unknown';
    const awayName = histAway?.team?.displayName || histAway?.team?.name || 'Unknown';

    const winner = comps.find(c => c.winner === true);
    let score = 'N/A';
    if (histHome?.score && histAway?.score) {
      score = `${histHome.score} - ${histAway.score}`;
    }

    if (last5Meetings.length < 5) {
      last5Meetings.push({
        date,
        home: homeName,
        away: awayName,
        score
      });
    }

    if (!winner) {
      draws++;
    } else if (winner.homeAway === 'home') {
      if (winner.team?.displayName === currentHomeTeam || winner.team?.name === currentHomeTeam) {
        homeWins++;
      } else {
        awayWins++;
      }
    } else {
      if (winner.team?.displayName === currentAwayTeam || winner.team?.name === currentAwayTeam) {
        awayWins++;
      } else {
        homeWins++;
      }
    }
  }

  const totalMatches = homeWins + draws + awayWins;

  return {
    totalMatches,
    homeWins,
    draws,
    awayWins,
    last5Meetings,
    venueRecord: {
      playedAtVenue: 0,
      homeWinsAtVenue: 0,
      drawsAtVenue: 0,
      awayWinsAtVenue: 0
    },
    avgGoalsPerGame: 2.50,
    cleanSheetRateHome: 0.25,
    cleanSheetRateAway: 0.20,
    tacticalNote: 'Real H2H data sourced directly from ESPN scoreboard history.',
    derbyOrRivalry: null,
    isDirectMatch: true,
    homeTeam: currentHomeTeam,
    awayTeam: currentAwayTeam
  };
}

const WANTED_STATS = ['Corners', 'Shots on Goal', 'Fouls', 'Possession', 'Yellow Cards', 'Red Cards', 'Offsides'];

function extractMatchStats(comp, homeComp, awayComp) {
  const raw = comp?.statistics || [];
  const rows = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const name = entry.name || entry.label || '';
    if (!WANTED_STATS.some(w => name.toLowerCase().includes(w.toLowerCase()))) continue;
    const home = String(entry.homeDisplayValue ?? entry.home ?? '');
    const away = String(entry.awayDisplayValue ?? entry.away ?? '');
    if (home === '' && away === '') continue;
    rows.push({ name, home, away });
  }

  if (rows.length === 0) {
    const hs = Array.isArray(homeComp?.statistics) ? homeComp.statistics : [];
    for (let i = 0; i < hs.length; i++) {
      const name = hs[i]?.name || '';
      if (!WANTED_STATS.some(w => name.toLowerCase().includes(w.toLowerCase()))) continue;
      const home = String(hs[i]?.displayValue ?? '');
      const away = String(awayComp?.statistics?.[i]?.displayValue ?? '');
      if (!home && !away) continue;
      rows.push({ name, home, away });
    }
  }

  return rows.slice(0, 6);
}

/**
 * Fetch real live fixtures from ESPN Scoreboard API.
 * Browser: same-origin Vercel proxy first, then direct ESPN as fallback.
 * The proxy attempt is disabled for the rest of the session after its first
 * failure (e.g. when the host's datacenter IPs are blocked upstream).
 * CLI: direct fetch always.
 */
let proxyDisabled = false;

async function fetchEspnFixtures(targetDate, targetLeagues, options = {}) {
  const dateYMD = targetDate ? targetDate.replace(/-/g, '') : null;
  const fixtures = [];
  const inBrowser = typeof window !== 'undefined';
  let okLeagues = 0;

  await Promise.allSettled(
    targetLeagues.map(async (league) => {
      let data = null;

      if (inBrowser && !proxyDisabled) {
        try {
          const proxyUrl = `/api/espn-proxy?league=${encodeURIComponent(league.espnCode)}${dateYMD ? `&date=${dateYMD}` : ''}`;
          const res = await fetch(proxyUrl);
          if (res.ok) {
            data = await res.json();
          } else {
            proxyDisabled = true;
          }
        } catch (err) {
          proxyDisabled = true;
        }
      }

      if (!data) {
        try {
          const url = dateYMD
            ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard?dates=${dateYMD}`
            : `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard`;

          const res = await fetch(url);
          if (!res.ok) return;
          data = await res.json();
        } catch (err) {
          return;
        }
      }

      okLeagues++;
      const events = data.events || [];
      let leagueMatchIndex = 1;

      for (const ev of events) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;

          const homeComp = comp.competitors?.find(c => c.homeAway === 'home');
          const awayComp = comp.competitors?.find(c => c.homeAway === 'away');

          const homeName = homeComp?.team?.displayName || homeComp?.team?.name;
          const awayName = awayComp?.team?.displayName || awayComp?.team?.name;

          if (!homeName || !awayName) continue;

          const state = ev.status?.type?.state || 'pre';
          const liveInfo = {
            state,
            clock: state !== 'pre' ? (ev.status?.displayClock || ev.status?.type?.shortDetail || '') : undefined,
            period: ev.status?.period,
            homeScore: state !== 'pre' ? String(homeComp?.score ?? '') : undefined,
            awayScore: state !== 'pre' ? String(awayComp?.score ?? '') : undefined
          };

          const stats = extractMatchStats(comp, homeComp, awayComp);

          const homeLogo = homeComp?.team?.logo || homeComp?.team?.logos?.[0]?.href || getTeamLogo(homeName);
          const awayLogo = awayComp?.team?.logo || awayComp?.team?.logos?.[0]?.href || getTeamLogo(awayName);

          const timeStr = ev.date
            ? new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'TBD';

          const matchDateStr = ev.date
            ? formatDate(new Date(ev.date))
            : (targetDate || formatDate(new Date()));

          const stadium = comp.venue?.fullName || ev.venue?.displayName || `${homeName} Stadium`;
          const matchType = comp.type?.text || ev.season?.displayName || 'Official Match';

          const espnH2H = parseH2HFromESPN(comp.previousMeetings || [], homeName, awayName);
          const pred = predictMatch(homeName, awayName, league.code, espnH2H, options?.formMap || null);

          fixtures.push({
            id: `${league.code}-${String(leagueMatchIndex++).padStart(2, '0')}`,
            leagueCode: league.code,
            leagueName: league.name,
            leagueCountry: league.country,
            flag: league.flag,
            date: matchDateStr,
            time: timeStr,
            homeTeam: homeName,
            awayTeam: awayName,
            homeTeamLogo: homeLogo,
            awayTeamLogo: awayLogo,
            stadium,
            matchType,
            status: ev.status?.type?.shortDetail || 'Scheduled',
            live: liveInfo,
            stats,
            prediction: pred
          });
        }
    })
  );

  return { fixtures, okLeagues, totalLeagues: targetLeagues.length };
}

/**
 * Secondary fallback: Football-Data.org API.
 * Browser: same-origin Vercel proxy (key stays server-side).
 * CLI / Node: direct call with FOOTBALL_DATA_API_KEY from the environment.
 */
async function fetchFootballDataOrgFixtures(dateStr) {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/fd-proxy?date=${encodeURIComponent(dateStr)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.matches || [];
    } catch (err) {
      return null;
    }
  }

  const rawKeys = typeof process !== 'undefined' ? process.env?.FOOTBALL_DATA_API_KEY : undefined;

  if (!rawKeys || !parseKeys(rawKeys).length) return null;

  try {
    const res = await fdFetch(`matches?dateFrom=${dateStr}&dateTo=${dateStr}`, rawKeys);
    const data = await res.json();
    return data.matches || [];
  } catch (err) {
    return null;
  }
}

/**
 * Main fixtures getter: Queries ESPN as primary, football-data.org as fallback
 */
export async function getDailyFixtures(dateStr = null, leagueFilter = null, options = {}) {
  if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  const targetLeagues = leagueFilter
    ? [findLeague(leagueFilter)].filter(Boolean)
    : LEAGUE_LIST;

  if (targetLeagues.length === 0) {
    throw new Error(`Unknown league filter: "${leagueFilter}". Run "footy leagues" for available codes.`);
  }

  const { fixtures: espnFixtures, okLeagues, totalLeagues } = await fetchEspnFixtures(dateStr, targetLeagues, options);

  if (espnFixtures && espnFixtures.length > 0) {
    return {
      date: dateStr || formatDate(new Date()),
      provider: 'ESPN API (Live)',
      isLiveApi: true,
      totalFixtures: espnFixtures.length,
      fixtures: espnFixtures,
      message: ''
    };
  }

  if (dateStr) {
    const fbMatches = await fetchFootballDataOrgFixtures(dateStr);
    if (fbMatches && fbMatches.length > 0) {
      const results = [];
      const leagueIndices = {};

      for (const lm of fbMatches) {
        let leagueCode = lm.competition?.code;
        const FB_COMPETITION_MAP = {
          BL1: 'BL',
          CL: 'UCL',
          EL: 'UEL',
          ECL: 'UECL',
          EC: 'UECL',
          FAC: 'FAC',
          CDR: 'CDR',
          DFB: 'DFB',
          CDF: 'CDF'
        };
        leagueCode = FB_COMPETITION_MAP[leagueCode] || leagueCode;

        const league = LEAGUES[leagueCode];
        if (!league) continue;
        if (leagueFilter && league.code !== leagueFilter.toUpperCase()) continue;

        const homeName = lm.homeTeam?.name;
        const awayName = lm.awayTeam?.name;
        const timeStr = lm.utcDate
          ? new Date(lm.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'TBD';

        if (!leagueIndices[league.code]) leagueIndices[league.code] = 1;
        const pred = predictMatch(homeName, awayName, league.code, null, options?.formMap || null);

        results.push({
          id: `${league.code}-${String(leagueIndices[league.code]++).padStart(2, '0')}`,
          leagueCode: league.code,
          leagueName: league.name,
          leagueCountry: league.country,
          flag: league.flag,
          date: dateStr,
          time: timeStr,
          homeTeam: homeName,
          awayTeam: awayName,
          homeTeamLogo: lm.homeTeam?.crest || getTeamLogo(homeName),
          awayTeamLogo: lm.awayTeam?.crest || getTeamLogo(awayName),
          stadium: lm.venue || `${homeName} Stadium`,
          matchType: lm.stage ? lm.stage.replace(/_/g, ' ') : 'Official Match',
          prediction: pred
        });
      }

      if (results.length > 0) {
        return {
          date: dateStr,
          provider: 'Football-Data.org (Live)',
          isLiveApi: true,
          totalFixtures: results.length,
          fixtures: results,
          message: ''
        };
      }
    }
  }

  return {
    date: dateStr || formatDate(new Date()),
    provider: 'ESPN API',
    isLiveApi: true,
    totalFixtures: 0,
    fixtures: [],
    message: okLeagues === 0 && totalLeagues > 0
      ? `Could not reach the fixture provider from your device (0 of ${totalLeagues} competitions responded). Check your connection or try another network.`
      : `No fixtures scheduled${dateStr ? ` for ${dateStr}` : ''} across ${okLeagues} responding competition(s). Try another date with -d YYYY-MM-DD or view active matchdays with "footy".`
  };
}

export async function getFixtureById(matchId, dateStr = null) {
  if (!matchId) return null;
  const matchIdClean = matchId.trim().toUpperCase();
  const leagueCode = matchIdClean.split('-')[0];

  const { fixtures } = await getDailyFixtures(dateStr, leagueCode);
  let found = fixtures.find(f => f.id.toUpperCase() === matchIdClean);
  if (found) return found;

  const allData = await getDailyFixtures(dateStr);
  return allData.fixtures.find(f => f.id.toUpperCase() === matchIdClean) || null;
}
