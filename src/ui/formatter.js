/**
 * Terminal UI Formatting, Visual Meters, and Tables
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';

/**
 * Render a visual probability bar with ASCII blocks
 * Example: [██████░░░░] 58% H | [██░░░░░░░░] 22% D | [██░░░░░░░░] 20% A
 */
export function formatProbabilityBar(homePct, drawPct, awayPct, totalWidth = 12) {
  const homeBlocks = Math.max(1, Math.round((homePct / 100) * totalWidth));
  const drawBlocks = Math.max(1, Math.round((drawPct / 100) * totalWidth));
  const awayBlocks = Math.max(1, totalWidth - homeBlocks - drawBlocks);

  const homeBar = chalk.hex('#00ff85')('█'.repeat(homeBlocks));
  const drawBar = chalk.hex('#ffcc00')('▒'.repeat(drawBlocks));
  const awayBar = chalk.hex('#ff4d4d')('░'.repeat(awayBlocks));

  const homeLabel = chalk.hex('#00ff85').bold(`${homePct.toFixed(0)}% H`);
  const drawLabel = chalk.hex('#ffcc00').bold(`${drawPct.toFixed(0)}% D`);
  const awayLabel = chalk.hex('#ff4d4d').bold(`${awayPct.toFixed(0)}% A`);

  return `[${homeBar}${drawBar}${awayBar}] ${homeLabel} ${chalk.gray('|')} ${drawLabel} ${chalk.gray('|')} ${awayLabel}`;
}

/**
 * Format a mini score badge (e.g. 2-1 (14.2%))
 */
export function formatTopScoreline(topScores) {
  if (!topScores || topScores.length === 0) return '';
  const top = topScores[0];
  return chalk.cyan.bold(`${top.score} `) + chalk.gray(`(${top.prob.toFixed(1)}%)`);
}

/**
 * Format H2H summary for display in the table
 */
export function formatH2HSummary(h2h) {
  if (!h2h || !h2h.totalMatches || h2h.totalMatches === 0) {
    return chalk.gray('No H2H data');
  }
  
  // Use real data from ESPN API
  const total = h2h.totalMatches;
  const home = h2h.homeWins || 0;
  const draws = h2h.draws || 0;
  const away = h2h.awayWins || 0;
  
  // Calculate percentages
  const homePct = ((home / total) * 100).toFixed(0);
  const drawPct = ((draws / total) * 100).toFixed(0);
  const awayPct = ((away / total) * 100).toFixed(0);
  
  // Color code based on who has the advantage
  const homeDisplay = home > away ? chalk.hex('#00ff85').bold(`${home}W`) : chalk.white(`${home}W`);
  const awayDisplay = away > home ? chalk.hex('#ff4d4d').bold(`${away}W`) : chalk.white(`${away}W`);
  const drawDisplay = chalk.hex('#ffcc00')(`${draws}D`);
  
  // Build a compact H2H string
  let result = `📊 ${chalk.bold(total)} meetings: ${homeDisplay}-${drawDisplay}-${awayDisplay}`;
  
  // Add derby/rivalry tag if present
  if (h2h.derbyOrRivalry) {
    result += ` 🔥 ${chalk.magenta(h2h.derbyOrRivalry)}`;
  }
  
  return result;
}

/**
 * Render standard daily fixtures table grouped by league
 */
export function renderFixturesTable(fixturesData, sortOption = 'league') {
  const { date, fixtures = [], message = '' } = fixturesData;

  console.log(
    boxen(
      chalk.bold.hex('#00e5ff')(`⚽ EUROPEAN FOOTBALL — DAILY FIXTURES & PREDICTIONS`) +
      `\n${chalk.gray('📅 Date:')} ${chalk.white.bold(date)}  ${chalk.gray('•')}  ${chalk.gray('Total Matches Found:')} ${chalk.yellow.bold(fixtures.length)}  ${chalk.gray('•')}  ${chalk.gray('Model:')} ${chalk.magenta.bold('12-Factor Poisson Engine')}`,
      {
        padding: 1,
        margin: { top: 0, bottom: 1 },
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    )
  );

  if (fixtures.length === 0) {
    console.log(
      chalk.yellow(`ℹ️ ${message || `No official league fixtures found for ${date}. Try another date with -d YYYY-MM-DD.`}\n`)
    );
    return;
  }

  // Handle global sorting
  if (sortOption !== 'league') {
    const sorted = [...fixtures];
    if (sortOption === 'time') {
      sorted.sort((a, b) => a.time.localeCompare(b.time));
    } else if (sortOption === 'prob-desc') {
      sorted.sort((a, b) => {
        const pA = Math.max(a.prediction.probabilities.homeWin, a.prediction.probabilities.awayWin);
        const pB = Math.max(b.prediction.probabilities.homeWin, b.prediction.probabilities.awayWin);
        return pB - pA;
      });
    } else if (sortOption === 'prob-asc') {
      sorted.sort((a, b) => {
        const pA = Math.max(a.prediction.probabilities.homeWin, a.prediction.probabilities.awayWin);
        const pB = Math.max(b.prediction.probabilities.homeWin, b.prediction.probabilities.awayWin);
        return pA - pB;
      });
    } else if (sortOption === 'confidence') {
      const rank = (c) => (c === 'Very High' ? 4 : c === 'High' ? 3 : c === 'Moderate' ? 2 : 1);
      sorted.sort((a, b) => {
        const r = rank(b.prediction.confidence) - rank(a.prediction.confidence);
        if (r !== 0) return r;
        const pA = Math.max(a.prediction.probabilities.homeWin, a.prediction.probabilities.awayWin);
        const pB = Math.max(b.prediction.probabilities.homeWin, b.prediction.probabilities.awayWin);
        return pB - pA;
      });
    }

    console.log(
      chalk.bgHex('#1f2430').white.bold(` 📊 SORTED BY: ${sortOption.toUpperCase()} `)
    );

    const table = new Table({
      head: [
        chalk.cyan.bold('ID'),
        chalk.cyan.bold('Time'),
        chalk.cyan.bold('Home Team'),
        chalk.cyan.bold('Away Team'),
        chalk.cyan.bold('Winning / Draw Probabilities'),
        chalk.cyan.bold('Top Score'),
        chalk.cyan.bold('H2H Record'),
        chalk.cyan.bold('League / Context')
      ],
      colWidths: [9, 8, 24, 24, 48, 14, 30, 24],
      style: { head: [], border: ['gray'] }
    });

    for (const match of sorted) {
      const pred = match.prediction;
      const probBar = formatProbabilityBar(
        pred.probabilities.homeWin,
        pred.probabilities.draw,
        pred.probabilities.awayWin
      );

      const topScore = formatTopScoreline(pred.topScorelines);
      const h2hSummary = formatH2HSummary(pred.h2h);
      const leagueLabel = `${match.flag} ${match.leagueCode}`;
      const contextTag = chalk.gray(`${leagueLabel} • ${match.matchType || 'Match'}`);

      // Highlight favourite
      let homeTeamDisplay = match.homeTeam;
      let awayTeamDisplay = match.awayTeam;
      if (pred.probabilities.homeWin > pred.probabilities.awayWin && pred.probabilities.homeWin >= 48) {
        homeTeamDisplay = chalk.hex('#00ff85').bold(match.homeTeam);
      } else if (pred.probabilities.awayWin > pred.probabilities.homeWin && pred.probabilities.awayWin >= 48) {
        awayTeamDisplay = chalk.hex('#ff4d4d').bold(match.awayTeam);
      }

      table.push([
        chalk.yellow.bold(match.id),
        chalk.gray(match.time),
        homeTeamDisplay,
        awayTeamDisplay,
        probBar,
        topScore,
        h2hSummary,
        contextTag
      ]);
    }

    console.log(table.toString());
    console.log();
  } else {
    // Group fixtures by league
    const byLeague = {};
    for (const f of fixtures) {
      if (!byLeague[f.leagueCode]) {
        byLeague[f.leagueCode] = {
          name: f.leagueName,
          flag: f.flag,
          country: f.leagueCountry,
          matches: []
        };
      }
      byLeague[f.leagueCode].matches.push(f);
    }

    for (const [, group] of Object.entries(byLeague)) {
      console.log(
        chalk.bgHex('#1f2430').white.bold(` ${group.flag} ${group.name.toUpperCase()} (${group.country}) `)
      );

      const table = new Table({
        head: [
          chalk.cyan.bold('ID'),
          chalk.cyan.bold('Time'),
          chalk.cyan.bold('Home Team'),
          chalk.cyan.bold('Away Team'),
          chalk.cyan.bold('Winning / Draw Probabilities'),
          chalk.cyan.bold('Top Score'),
          chalk.cyan.bold('H2H Record'),
          chalk.cyan.bold('Stage / Context')
        ],
        colWidths: [9, 8, 24, 24, 48, 14, 30, 24],
        style: { head: [], border: ['gray'] }
      });

      for (const match of group.matches) {
        const pred = match.prediction;
        const probBar = formatProbabilityBar(
          pred.probabilities.homeWin,
          pred.probabilities.draw,
          pred.probabilities.awayWin
        );

        const topScore = formatTopScoreline(pred.topScorelines);
        const h2hSummary = formatH2HSummary(pred.h2h);
        const matchTypeTag = chalk.gray(match.matchType || 'Match');

        // Highlight favourite
        let homeTeamDisplay = match.homeTeam;
        let awayTeamDisplay = match.awayTeam;
        if (pred.probabilities.homeWin > pred.probabilities.awayWin && pred.probabilities.homeWin >= 48) {
          homeTeamDisplay = chalk.hex('#00ff85').bold(match.homeTeam);
        } else if (pred.probabilities.awayWin > pred.probabilities.homeWin && pred.probabilities.awayWin >= 48) {
          awayTeamDisplay = chalk.hex('#ff4d4d').bold(match.awayTeam);
        }

        table.push([
          chalk.yellow.bold(match.id),
          chalk.gray(match.time),
          homeTeamDisplay,
          awayTeamDisplay,
          probBar,
          topScore,
          h2hSummary,
          matchTypeTag
        ]);
      }

      console.log(table.toString());
      console.log();
    }
  }

  console.log(
    chalk.gray(
      `💡 Tip: Use ${chalk.yellow.bold('footy details <ID>')} for an in-depth 12-factor breakdown and H2H statistics.`
    )
  );
  console.log();
}
