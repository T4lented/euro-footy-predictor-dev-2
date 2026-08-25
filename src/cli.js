/**
 * Main CLI Program Definition with Commander.js
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getDailyFixtures, getFixtureById, formatDate } from './services/fixturesService.js';
import { exportFixtures } from './services/exportService.js';
import { renderFixturesTable } from './ui/formatter.js';
import { renderMatchDetails } from './ui/matchDetailsView.js';
import { LEAGUE_LIST } from './config/leagues.js';

const SORT_HELP = 'Sort by: league, time, prob-asc, prob-desc, confidence';

async function handleExportOption(data, filePath) {
  if (!filePath) return;
  const result = await exportFixtures(data, filePath);
  console.log(chalk.green(`✅ Exported ${result.count} fixture(s) to ${result.filePath} (${result.format.toUpperCase()})`));
}

export function createCli() {
  const program = new Command();

  program
    .name('footy')
    .description('⚽ European Football — Leagues, Cups & UEFA Fixtures with 12-Factor Win Probability')
    .version('1.0.0')
    .option('-d, --date <YYYY-MM-DD>', 'Target match date (YYYY-MM-DD)')
    .option('-l, --league <league>', 'Filter by league code')
    .option('-s, --sort <type>', SORT_HELP, 'league')
    .option('--json', 'Output in JSON format')
    .option('--export <file>', 'Export fixtures to a .json or .csv file')
    .action(async (options) => {
      try {
        const targetDate = options.date || null;
        const targetLeague = options.league || null;
        const data = await getDailyFixtures(targetDate, targetLeague);
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          await handleExportOption(data, options.export);
          return;
        }
        renderFixturesTable(data, options.sort);
        await handleExportOption(data, options.export);
      } catch (err) {
        console.error(chalk.red(`Error: ${err.message}`));
      }
    });

  program
    .command('today')
    .description("View today's fixtures")
    .option('-l, --league <league>', 'Filter by league')
    .option('-s, --sort <type>', SORT_HELP, 'league')
    .option('--json', 'Output in JSON format')
    .option('--export <file>', 'Export fixtures to a .json or .csv file')
    .action(async (options) => {
      try {
        const targetLeague = options.league || program.opts().league || null;
        const targetSort = options.sort || program.opts().sort || 'league';
        const data = await getDailyFixtures(formatDate(new Date()), targetLeague);
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          await handleExportOption(data, options.export);
          return;
        }
        renderFixturesTable(data, targetSort);
        await handleExportOption(data, options.export);
      } catch (err) {
        console.error(chalk.red(`Error: ${err.message}`));
      }
    });

  program
    .command('export <file>')
    .description('Export fixtures & predictions to a .json or .csv file')
    .option('-d, --date <YYYY-MM-DD>', 'Target match date (YYYY-MM-DD)')
    .option('-l, --league <league>', 'Filter by league code')
    .option('--ids <matchIds>', 'Comma-separated match IDs to pick specific games (e.g. PL-01,PD-02)')
    .action(async (file, options) => {
      try {
        const targetDate = options.date || program.opts().date || null;
        const targetLeague = options.league || program.opts().league || null;
        const data = await getDailyFixtures(targetDate, targetLeague);
        const ids = options.ids ? options.ids.split(',').map(s => s.trim()).filter(Boolean) : null;
        const result = await exportFixtures(data, file, ids);
        console.log(chalk.green(`✅ Exported ${result.count} fixture(s) to ${result.filePath} (${result.format.toUpperCase()})`));
      } catch (err) {
        console.error(chalk.red(`Error: ${err.message}`));
      }
    });

  program
    .command('details <matchId>')
    .description('View 12-factor deep dive for a match')
    .option('-d, --date <YYYY-MM-DD>', 'Date of the match (YYYY-MM-DD)')
    .action(async (matchId, options, cmd) => {
      try {
        const targetDate = options.date || program.opts().date || null;
        const fixture = await getFixtureById(matchId, targetDate);
        if (!fixture) {
          console.error(chalk.red(`Match "${matchId}" not found${targetDate ? ` for date ${targetDate}` : ''}.`));
          console.log(chalk.gray(`Tip: Run "footy${targetDate ? ` -d ${targetDate}` : ''}" to see all valid match IDs.`));
          return;
        }
        renderMatchDetails(fixture);
      } catch (err) {
        console.error(chalk.red(`Error: ${err.message}`));
      }
    });

  program
    .command('leagues')
    .description('List supported leagues')
    .action(() => {
      console.log(chalk.bold('\n🏆 Supported Leagues:\n'));
      LEAGUE_LIST.forEach(l => {
        console.log(`  ${l.flag} ${chalk.bold(l.code.padEnd(5))} - ${l.name} (${l.country})`);
      });
      console.log();
    });

  return program;
}
