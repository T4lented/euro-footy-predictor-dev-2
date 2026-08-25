/**
 * Bundler script to create a clean, downloadable ZIP archive of the project
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const zipOutput = path.join(rootDir, 'euro-footy-predictor.zip');

console.log('📦 Creating downloadable project zip bundle...');

try {
  // Remove existing zip if present
  if (fs.existsSync(zipOutput)) {
    fs.unlinkSync(zipOutput);
  }

  const excludeItems = ['node_modules', '.git', 'euro-footy-predictor.zip'];
  const itemsToZip = fs.readdirSync(rootDir).filter(item => !excludeItems.includes(item));

  const psQuote = value => `'${String(value).replace(/'/g, "''")}'`;
  const pathList = itemsToZip.map(item => psQuote(path.join(rootDir, item))).join(',');
  const command = `Compress-Archive -Path @(${pathList}) -DestinationPath ${psQuote(zipOutput)} -Force`;

  execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', command], { stdio: 'inherit' });

  const stats = fs.statSync(zipOutput);
  console.log(`✅ Downloadable bundle created successfully!`);
  console.log(`📁 File: ${zipOutput}`);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
} catch (err) {
  console.error('Failed to create zip bundle:', err.message);
}
