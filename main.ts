// Entry point for the best-game-01 bounty (Node 22, nothing but the standard library).
//
// What this program does, in order:
//   1. picks the directory to hand in (the grader's /output, or MAKEFUN_OUTPUT_DIR when run elsewhere),
//   2. drops the playable game in as output/game/ (plain static files the browser opens offline),
//   3. drops the rendered screenshots in as output/screenshots/ (the first by name becomes the cover),
//   4. writes output/dossier.json, the summary the judge reads, via the vendored make.fun library.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To look at the game in a browser, `node serve.ts` and open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

/**
 * The scorer's caps, taken from its gate.json. Only text_max_bytes actually shapes the dossier's text; the rest
 * only refuse an entry the scorer would refuse, so passing them here means this program fails in exactly the
 * places the gate does instead of handing in something it will reject:
 *   - at most 4 screenshots, each at most 256 KiB,
 *   - at most 993 files/directories under game/ (993, not 1000: the grader's own 1000-entry cap on /output also
 *     has to fit screenshots/ and its files plus dossier.json),
 *   - at most 48 MiB of game files,
 *   - no path under game/ longer than 1000 bytes.
 */
const SCORER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

/** Where this script lives: game/ and screenshots/ sit beside it. */
const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/** The entry directory the grader reads: /output, unless we were pointed somewhere else. */
const handInDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/**
 * Copy one directory tree from the project into the hand-in directory, creating the destination first.
 * The game is copied unconditionally (a missing game/ is a real error), while screenshots are optional here
 * and only copied when the project has them; buildDossier is what insists on real images.
 */
function copyIntoHandIn(name: 'game' | 'screenshots', required: boolean): boolean {
  const from = join(projectRoot, name);
  const to = join(handInDir, name);
  // Leave no empty screenshots/ behind when the project has none: buildDossier, not this copy, is what complains.
  if (!required && !existsSync(from)) return false;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return true;
}

/** Make sure the hand-in directory itself exists before anything is written into it. */
mkdirSync(handInDir, { recursive: true });

// The playable game and its screenshots, both as plain copies.
copyIntoHandIn('game', true);
const screenshotsCopied = copyIntoHandIn('screenshots', false);

// The dossier: buildDossier walks output/game/ and output/screenshots/ and returns canonical JSON bytes,
// throwing DossierError if the entry breaks a cap. Write those bytes out verbatim.
const dossierBytes = buildDossier(handInDir, SCORER_CAPS);
writeFileSync(join(handInDir, 'dossier.json'), dossierBytes);

// A short receipt so a local run shows what landed where.
console.log(`hand-in directory: ${handInDir}`);
console.log(`  game/          copied from ${join(projectRoot, 'game')}`);
console.log(`  screenshots/   ${screenshotsCopied ? 'copied' : 'not present in this project, skipped'}`);
console.log(`  dossier.json   written (${dossierBytes.length} bytes)`);
