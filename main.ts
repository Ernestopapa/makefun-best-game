import { writeFileSync, cpSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const gameDir = join(outputDir, 'game');
const shotsDir = join(outputDir, 'screenshots');

mkdirSync(gameDir, { recursive: true });
mkdirSync(shotsDir, { recursive: true });

cpSync(join(__dirname, 'game'), gameDir, { recursive: true });
cpSync(join(__dirname, 'screenshots'), shotsDir, { recursive: true });

try {
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log('dossier.json written');
} catch (err) {
  console.log(`dossier.json not written: ${err.message}`);
}
