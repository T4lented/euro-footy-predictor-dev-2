# ⚽ European Football Top 10 Leagues Fixture & Win Probability CLI

A streamlined, elegant, and mathematically rigorous Node.js Command Line Interface (CLI) application that delivers **daily real-world fixtures across Europe's top 10 football leagues** alongside **12-factor win/draw probability predictions**.

Powered by real fixture data from [Football-Data.org](https://www.football-data.org/) and an adjusted **12-Factor Bivariate Poisson / Dixon-Coles Distribution**.

---

## 🏆 Supported Top 10 European Leagues

| Code | Flag | League Name | Country | Avg Goals / Gm |
| :--- | :--- | :--- | :--- | :--- |
| `PL` | 🏴󠁧󠁢󠁥󠁮󠁧󠁿 | **Premier League** | England | 2.85 |
| `PD` | 🇪🇸 | **La Liga** | Spain | 2.60 |
| `SA` | 🇮🇹 | **Serie A** | Italy | 2.65 |
| `BL` | 🇩🇪 | **Bundesliga** | Germany | 3.10 |
| `FL1` | 🇫🇷 | **Ligue 1** | France | 2.70 |
| `DED` | 🇳🇱 | **Eredivisie** | Netherlands | 3.15 |
| `PPL` | 🇵🇹 | **Primeira Liga** | Portugal | 2.55 |
| `BPL` | 🇧🇪 | **Belgian Pro League** | Belgium | 2.80 |
| `SP` | 🏴󠁧󠁢󠁳󠁣󠁴󠁿 | **Scottish Premiership** | Scotland | 2.75 |
| `TSL` | 🇹🇷 | **Süper Lig** | Turkey | 2.80 |

---

## 🧠 12-Factor Winning Probability Engine

The application evaluates **12 distinct football dimensions** to predict match outcomes:

```
                                  [ 12-Factor Analysis Vector ]
 ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ 1. Team Quality & Form    │ 2. Personnel Availability │ 3. Tactical / Situational │
 │ 4. Motivation & Stakes    │ 5. Environmental Factors  │ 6. Underlying Statistical │
 │ 7. Rest & Congestion      │ 8. Psychological Dynamics │ 9. Strategic Bench Depth  │
 │ 10. Travel & Logistics    │ 11. Historical Baseline   │ 12. Opponent-Specific H2H │
 └───────────────────────────┴───────────────────────────┴───────────────────────────┘
                                           │
                                           ▼
                [ Adjusted Expected Goals (xG): λ_home & μ_away ]
                                           │
                                           ▼
                [ Bivariate Poisson Matrix & Dixon-Coles Adjustment ]
                                           │
                                           ▼
          [ Home Win % ] ─── [ Draw % ] ─── [ Away Win % ] + Top Scorelines
```

### Detailed Factor Dimensions & Weights:
1. **Team Quality & Recent Form (20%)**: Elo ratings, 5-match weighted form points, goal differential momentum.
2. **Personnel & Squad Availability (12%)**: Key injuries, suspensions, crucial missing positions.
3. **Tactical & Situational Matchup (10%)**: Style clash, set-piece proficiency vs. vulnerability, possession dominance.
4. **Motivational & Contextual Significance (8%)**: Title race, relegation battle, derby rivalry intensity.
5. **Environmental Factors (4%)**: Stadium altitude, pitch conditions, weather familiarity.
6. **Underlying Statistical Quality (10%)**: Expected Goals ($xG$) and $xGA$ per 90, big chances created vs. conceded.
7. **External Schedule & Congestion (6%)**: Rest days differential, match density.
8. **Psychological Dynamics (4%)**: Comeback resilience, home fortress index, pressure tolerance.
9. **Strategic Bench Depth (4%)**: 5-substitution quality rating, late-game scoring/conceding trends (75–90+ min).
10. **Travelling & Logistics (4%)**: Away travel distance (km), traveling fan backing, travel fatigue index.
11. **Historical Multi-Season Baseline (8%)**: Multi-season conversion rates, tier-based baseline win percentages.
12. **Opponent-Specific H2H & Venue Record (10%)**: Direct historical clash record, venue-specific stadium records.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js version 18+

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure your Football-Data.org API key in .env
cp .env.example .env
# Edit .env and set:
# FOOTBALL_DATA_API_KEY=your_football_data_org_api_key_here
```
Get a free API key at [football-data.org/client/register](https://www.football-data.org/client/register).

---

## 🖥️ CLI Commands & Usage Examples

### 1. View Today's Fixtures
```bash
# Default action
node bin/footy.js

# Or with npm script / command
npm start
node bin/footy.js today
```

### 2. Filter by League
```bash
# Premier League
node bin/footy.js --league PL

# La Liga
node bin/footy.js --league PD

# Serie A
node bin/footy.js --league SA

# Bundesliga
node bin/footy.js --league BL
```

### 3. Change Target Date
```bash
# View fixtures for a specific date (YYYY-MM-DD)
node bin/footy.js --date 2026-08-15
node bin/footy.js -d 2026-08-15 -l PL
```

### 4. Deep Dive Match Analysis (12-Factor Breakdown)
```bash
# Inspect a specific match ID
node bin/footy.js details PL-01

# Inspect match on a specific date
node bin/footy.js details PD-01 --date 2026-08-15
```

### 5. List Supported Leagues
```bash
node bin/footy.js leagues
```

### 6. JSON Output (for automation & scripting)
```bash
node bin/footy.js --json
node bin/footy.js today --league PL --json
```

### 7. Sort by Confidence Level
```bash
# Strongest predictions first (Very High → High → Moderate → Low)
node bin/footy.js -s confidence
node bin/footy.js today -s confidence -l PL
```

### 8. Export Fixtures (CSV / JSON)
```bash
# Export everything for today to CSV or JSON (extension decides format)
node bin/footy.js today --export games.csv
node bin/footy.js --date 2026-08-15 --export games.json

# Dedicated export command
node bin/footy.js export games.csv
node bin/footy.js export games.json -d 2026-08-15 -l PL

# Pick specific games by match ID and export only those
node bin/footy.js export my-picks.csv --ids PL-01,PD-02,BL-03
```

Web app: tick the checkbox on any match card to pick games, then export from the floating bar as a **PNG image** that matches your theme (light or dark) — each game shows the projected winner with win probability, club emblems, probability bar and confidence. **Export all PNG** downloads every fixture currently listed. (CLI still supports CSV/JSON via `--export`.)

---

## 📁 Codebase Architecture

```
euroFootyPredictor/
├── bin/
│   └── footy.js                   # CLI executable entry point (loads .env)
├── src/
│   ├── cli.js                     # Commander.js commands and options
│   ├── config/
│   │   └── leagues.js             # Top 10 leagues metadata and code mapping
│   ├── data/
│   │   ├── teamsData.js           # Team stats, Elo, tactical styles, rosters
│   │   └── h2hData.js             # Head-to-head records and historical venue archives
│   ├── models/
│   │   └── factors.js             # 12 Factor definitions, weights, and scoring logic
│   ├── services/
│   │   ├── fixturesService.js     # Real API integration (football-data.org)
│   │   ├── predictionEngine.js    # 12-Factor Poisson & Dixon-Coles probability engine
│   │   └── exportService.js       # CSV/JSON export & match-ID selection helpers
│   └── ui/
│       ├── formatter.js           # Visual meters, chalk styling, Unicode tables
│       └── matchDetailsView.js    # 12-factor deep dive & H2H box layout
├── scripts/
│   └── createBundle.js            # Automated ZIP packaging script
├── package.json                   # Project metadata & dependencies
├── .env.example                   # Environment variable template
└── README.md                      # Documentation
```

---

## 📄 License
MIT © Emmanuel
