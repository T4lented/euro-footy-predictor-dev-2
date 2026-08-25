/**
 * Match Deep Dive View: 12-Factor Breakdown & Head-to-Head Analysis
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';
import { formatProbabilityBar } from './formatter.js';
import { FACTOR_METADATA } from '../models/factors.js';

export function renderMatchDetails(fixture) {
  const { id, leagueName, leagueCountry, flag, date, time, homeTeam, awayTeam, stadium, prediction } = fixture;
  const { homeTeam: homeData, awayTeam: awayData, h2h, factors, probabilities, expectedGoals, topScorelines, confidence } = prediction;

  // Header Box
  const headerContent =
    `${chalk.gray(flag + ' ' + leagueName + ' • ' + date + ' • ' + time + ' • ' + stadium)}\n\n` +
    `${chalk.bold.hex('#00ff85')(homeTeam.toUpperCase())}  ${chalk.gray('vs')}  ${chalk.bold.hex('#ff4d4d')(awayTeam.toUpperCase())}\n` +
    `${chalk.gray('Match ID:')} ${chalk.yellow.bold(id)}  ${chalk.gray('• Confidence:')} ${chalk.cyan.bold(confidence)}`;

  console.log(
    boxen(headerContent, {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'double',
      borderColor: 'green'
    })
  );

  // 1. Probabilities & Projected Expected Goals
  console.log(chalk.bgHex('#1f2430').white.bold(' 📊 PREDICTED PROBABILITIES & EXPECTED GOALS (xG) '));

  const probTable = new Table({
    head: [
      chalk.cyan.bold('Outcome'),
      chalk.cyan.bold('Probability'),
      chalk.cyan.bold('Visual Meter'),
      chalk.cyan.bold('Projected xG')
    ],
    colWidths: [20, 16, 32, 20],
    style: { head: [], border: ['gray'] }
  });

  const hBar = chalk.hex('#00ff85')('█'.repeat(Math.round(probabilities.homeWin / 5))) + chalk.gray('░'.repeat(20 - Math.round(probabilities.homeWin / 5)));
  const dBar = chalk.hex('#ffcc00')('█'.repeat(Math.round(probabilities.draw / 5))) + chalk.gray('░'.repeat(20 - Math.round(probabilities.draw / 5)));
  const aBar = chalk.hex('#ff4d4d')('█'.repeat(Math.round(probabilities.awayWin / 5))) + chalk.gray('░'.repeat(20 - Math.round(probabilities.awayWin / 5)));

  probTable.push(
    [chalk.hex('#00ff85').bold(`Home Win (${homeTeam})`), chalk.hex('#00ff85').bold(`${probabilities.homeWin}%`), `[${hBar}]`, chalk.white(`${expectedGoals.home} goals`)],
    [chalk.hex('#ffcc00').bold('Draw'), chalk.hex('#ffcc00').bold(`${probabilities.draw}%`), `[${dBar}]`, chalk.gray('—')],
    [chalk.hex('#ff4d4d').bold(`Away Win (${awayTeam})`), chalk.hex('#ff4d4d').bold(`${probabilities.awayWin}%`), `[${aBar}]`, chalk.white(`${expectedGoals.away} goals`)]
  );

  console.log(probTable.toString());
  console.log();

  // 2. Exact Scorelines & Secondary Markets
  console.log(chalk.bgHex('#1f2430').white.bold(' 🎯 MOST LIKELY EXACT SCORELINES & GOAL MARKETS '));

  const scoreTable = new Table({
    head: [
      chalk.cyan.bold('Top Scoreline'),
      chalk.cyan.bold('Score Chance'),
      chalk.cyan.bold('Market'),
      chalk.cyan.bold('Probability')
    ],
    colWidths: [18, 16, 26, 20],
    style: { head: [], border: ['gray'] }
  });

  const top1 = topScorelines[0] || { score: 'N/A', prob: 0 };
  const top2 = topScorelines[1] || { score: 'N/A', prob: 0 };
  const top3 = topScorelines[2] || { score: 'N/A', prob: 0 };

  scoreTable.push(
    [chalk.yellow.bold(`1st: ${top1.score}`), chalk.white(`${top1.prob.toFixed(1)}%`), 'Over 2.5 Goals', chalk.white.bold(`${probabilities.over25}%`)],
    [chalk.yellow.bold(`2nd: ${top2.score}`), chalk.white(`${top2.prob.toFixed(1)}%`), 'Under 2.5 Goals', chalk.white.bold(`${probabilities.under25}%`)],
    [chalk.yellow.bold(`3rd: ${top3.score}`), chalk.white(`${top3.prob.toFixed(1)}%`), 'Both Teams to Score (BTTS)', chalk.white.bold(`${probabilities.btts}%`)]
  );

  console.log(scoreTable.toString());
  console.log();

  // 3. 12-Factor Multi-Dimensional Matrix
  console.log(chalk.bgHex('#1f2430').white.bold(' 🧠 12-FACTOR MULTI-DIMENSIONAL EVALUATION '));

  const factorTable = new Table({
    head: [
      chalk.cyan.bold('Factor Dimension'),
      chalk.cyan.bold('Weight'),
      chalk.hex('#00ff85').bold(`Home (${homeTeam.slice(0, 12)})`),
      chalk.hex('#ff4d4d').bold(`Away (${awayTeam.slice(0, 12)})`),
      chalk.cyan.bold('Advantage')
    ],
    colWidths: [38, 10, 16, 16, 22],
    style: { head: [], border: ['gray'] }
  });

  for (const [key, meta] of Object.entries(FACTOR_METADATA)) {
    const fData = factors[key] || { home: 5.0, away: 5.0, weight: 0.08 };
    const diff = fData.home - fData.away;

    let adv = chalk.gray('Neutral (0.0)');
    if (diff > 0.4) {
      adv = chalk.hex('#00ff85').bold(`▲ Home (+${diff.toFixed(1)})`);
    } else if (diff < -0.4) {
      adv = chalk.hex('#ff4d4d').bold(`▼ Away (${diff.toFixed(1)})`);
    }

    const homeBarMini = `${fData.home.toFixed(1)}/10`;
    const awayBarMini = `${fData.away.toFixed(1)}/10`;

    factorTable.push([
      `${meta.icon} ${meta.name}`,
      `${(fData.weight * 100).toFixed(0)}%`,
      homeBarMini,
      awayBarMini,
      adv
    ]);
  }

  console.log(factorTable.toString());
  console.log();

  // 4. Opponent-Specific Head-to-Head & Venue Analysis
  console.log(chalk.bgHex('#1f2430').white.bold(' ⚔️ OPPONENT-SPECIFIC HEAD-TO-HEAD (H2H) & VENUE RECORD '));

  // If we have real H2H data from ESPN, use it
  if (h2h && h2h.totalMatches && h2h.totalMatches > 0) {
    const h2hTable = new Table({
      head: [
        chalk.cyan.bold('Historical Metric'),
        chalk.hex('#00ff85').bold(homeTeam),
        chalk.hex('#ffcc00').bold('Draw'),
        chalk.hex('#ff4d4d').bold(awayTeam)
      ],
      colWidths: [36, 18, 16, 18],
      style: { head: [], border: ['gray'] }
    });

    const venueRec = h2h.venueRecord || { playedAtVenue: 0, homeWinsAtVenue: 0, drawsAtVenue: 0, awayWinsAtVenue: 0 };

    h2hTable.push(
      ['All-Time Clash Wins', `${h2h.homeWins || 0} wins`, `${h2h.draws || 0} draws`, `${h2h.awayWins || 0} wins`],
      [`Venue Record (${stadium})`, `${venueRec.homeWinsAtVenue} wins`, `${venueRec.drawsAtVenue} draws`, `${venueRec.awayWinsAtVenue} wins`],
      ['Avg Goals / Clean Sheet Rate', `${(h2h.avgGoalsPerGame || 2.5).toFixed(2)} goals/gm`, '—', `H:${((h2h.cleanSheetRateHome || 0.3) * 100).toFixed(0)}% | A:${((h2h.cleanSheetRateAway || 0.25) * 100).toFixed(0)}%`]
    );

    console.log(h2hTable.toString());

    // Display last 5 meetings if available
    if (h2h.last5Meetings && h2h.last5Meetings.length > 0) {
      console.log(chalk.gray(`\n📅 Recent Clash History:`));
      for (const m of h2h.last5Meetings) {
        console.log(`   ${chalk.gray(m.date)}: ${m.home} ${chalk.yellow.bold(m.score)} ${m.away}`);
      }
    }

    if (h2h.tacticalNote) {
      console.log(`\n📌 ${chalk.yellow('Tactical Matchup Note:')} ${chalk.white(h2h.tacticalNote)}`);
    }
    if (h2h.derbyOrRivalry) {
      console.log(`🔥 ${chalk.magenta('Rivalry Status:')} ${chalk.white.bold(h2h.derbyOrRivalry)}`);
    }
  } else {
    console.log(chalk.gray('No historical H2H data available for this fixture.'));
  }

  console.log();

  // 5. Squad Status & Tactical Summary
  console.log(chalk.bgHex('#1f2430').white.bold(' 🩺 SQUAD AVAILABILITY & TACTICAL STYLES '));
  console.log(
    `🏠 ${chalk.hex('#00ff85').bold(homeTeam)}:\n` +
    `   • Style: ${chalk.white(homeData.tacticalStyle || 'Standard')}\n` +
    `   • Form: ${chalk.yellow(homeData.recentForm?.join(' ') || 'N/A')} (${homeData.formPoints || 0} pts)\n` +
    `   • Squad: ${chalk.gray(homeData.keyPlayerStatus || 'Available')}\n` +
    `   • Injuries/Absences: ${homeData.injuries && homeData.injuries.length > 0 ? chalk.red(homeData.injuries.join(', ')) : chalk.green('None reported')}\n`
  );
  console.log(
    `✈️ ${chalk.hex('#ff4d4d').bold(awayTeam)}:\n` +
    `   • Style: ${chalk.white(awayData.tacticalStyle || 'Standard')}\n` +
    `   • Form: ${chalk.yellow(awayData.recentForm?.join(' ') || 'N/A')} (${awayData.formPoints || 0} pts)\n` +
    `   • Squad: ${chalk.gray(awayData.keyPlayerStatus || 'Available')}\n` +
    `   • Injuries/Absences: ${awayData.injuries && awayData.injuries.length > 0 ? chalk.red(awayData.injuries.join(', ')) : chalk.green('None reported')}\n`
  );
}
