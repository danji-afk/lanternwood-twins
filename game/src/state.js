// Game rules and the one mutable state object. Nothing here touches the DOM: engine.js reads this
// state every frame and hud.js renders it, so every transition below is also reachable from tests.
import { SCENES } from './scenes-data.js';

const KEY = 'lanternwood.progress.v1';
export const START_TIME = 90;
export const MAX_STRIKES = 3;

export function readProgress(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(KEY));
    return Array.from({ length: SCENES.length }, (_, i) => ({
      best: Math.max(0, Number(saved?.[i]?.best) || 0),
      stars: Math.max(0, Math.min(3, Number(saved?.[i]?.stars) || 0)),
    }));
  } catch {
    // Storage can be unavailable (private windows, file://): progress then lasts this visit only.
    return Array.from({ length: SCENES.length }, () => ({ best: 0, stars: 0 }));
  }
}

export function saveProgress(state) {
  if (state.demo) return;
  try { localStorage.setItem(KEY, JSON.stringify(state.progress)); } catch { /* optional */ }
}

export function createState({ progress = readProgress(), demo = false } = {}) {
  return {
    screen: 'title',
    level: 0,
    progress,
    demo,
    foundByScene: SCENES.map(() => new Set()),
    time: START_TIME,
    elapsed: 0,
    score: 0,
    streak: 0,
    strikes: 0,
    hints: 2,
    hint: null,
    sweep: -1,
    flash: null,
    result: null,
    revision: 0,
    muted: false,
    best: Math.max(0, ...progress.map(record => record.best)),
  };
}

export function unlocked(state, index) {
  return index === 0 || index < SCENES.length && state.progress[index - 1].stars > 0;
}
export function foundSet(state) { return state.foundByScene[state.level]; }
export function multiplier(state) { return Math.min(5, 1 + Math.floor(state.streak / 3)); }

function say(state, kind, text, now, extra = {}) {
  state.flash = { kind, text, until: now + 2000, id: (state.flash?.id || 0) + 1, ...extra };
}

export function startLevel(state, index, now = performance.now()) {
  if (!Number.isInteger(index) || index < 0 || index >= SCENES.length || !unlocked(state, index)) return false;
  Object.assign(state, {
    level: index, screen: 'play', time: START_TIME, elapsed: 0, score: 0, streak: 0,
    strikes: 0, hints: 2, hint: null, sweep: -1, flash: null, result: null,
  });
  state.foundByScene[index] = new Set();
  state.revision++;
  say(state, 'start', `Night ${index + 1}: ${SCENES[index].name}.`, now);
  return true;
}

export function finishLevel(state, now = performance.now()) {
  const stars = state.strikes === 0 ? 3 : state.strikes === 1 ? 2 : 1;
  const timeBonus = Math.floor(state.time) * 10;
  state.score += timeBonus;
  state.result = {
    stars, score: state.score, time: state.elapsed, remaining: state.time,
    strikes: state.strikes, timeBonus, found: foundSet(state).size,
  };
  const record = state.progress[state.level];
  record.best = Math.max(record.best, state.score);
  record.stars = Math.max(record.stars, stars);
  state.best = Math.max(state.best, state.score);
  saveProgress(state);
  state.screen = 'complete';
  state.hint = null;
  state.sweep = -1;
  state.flash = null;
  state.revision++;
  return stars;
}

export function findDifference(state, index, now = performance.now()) {
  if (state.screen !== 'play' || !SCENES[state.level].diffs[index] || foundSet(state).has(index)) return false;
  foundSet(state).add(index);
  state.streak++;
  const points = 100 * multiplier(state);
  state.score += points;
  state.time += 5;
  const found = foundSet(state).size;
  say(state, 'found', `+${points}${multiplier(state) > 1 ? `  ×${multiplier(state)} streak` : ''}`, now, { index });
  if (state.hint?.index === index) state.hint = null;
  state.sweep = -1;
  state.revision++;
  if (found === 5) {
    state.score += 250;
    state.flash = { ...state.flash, milestone: true, text: `Halfway there  ·  +250`, until: now + 2400 };
  }
  if (found >= SCENES[state.level].diffs.length) finishLevel(state, now);
  return true;
}

/** Time can run out only inside a scene; the board stays visible behind the fail card. */
export function spendTime(state, seconds) {
  state.time = Math.max(0, state.time - seconds);
  if (state.time === 0 && state.screen === 'play') {
    state.screen = 'fail';
    state.hint = null;
    state.sweep = -1;
    state.revision++;
  }
}

export function wrongClick(state, x, y, panel, now = performance.now()) {
  if (state.screen !== 'play') return false;
  state.strikes++;
  state.streak = 0;
  state.flash = { kind: 'wrong', text: '−5s', until: now + 900, id: (state.flash?.id || 0) + 1, x, y, panel };
  spendTime(state, 5);
  // Three misses in one scene end the night, whatever the lantern has left.
  if (state.strikes >= MAX_STRIKES && state.screen === 'play') {
    state.screen = 'fail';
    state.hint = null;
    state.sweep = -1;
  }
  state.revision++;
  return state.screen === 'play' || state.screen === 'fail';
}

export function useHint(state, now = performance.now()) {
  if (state.screen !== 'play' || state.hints <= 0 || (state.hint && state.hint.until > now)) return false;
  const index = SCENES[state.level].diffs.findIndex((_, i) => !foundSet(state).has(i));
  if (index < 0) return false;
  state.hints--;
  spendTime(state, 10);
  // If the ten seconds ran the lantern out, the hint is moot: the night is over.
  if (state.screen === 'play') state.hint = { index, until: now + 1600 };
  state.revision++;
  return true;
}

export function tick(state, delta, now) {
  if (state.screen !== 'play' || state.demo) return;
  state.elapsed += delta;
  spendTime(state, delta);
  if (state.hint && now >= state.hint.until) { state.hint = null; state.revision++; }
  if (state.flash && now >= state.flash.until) { state.flash = null; state.revision++; }
}

export function sweep(state, direction) {
  if (state.screen !== 'play') return;
  const remaining = SCENES[state.level].diffs.map((_, i) => i).filter(i => !foundSet(state).has(i));
  if (!remaining.length) return;
  const current = remaining.indexOf(state.sweep);
  state.sweep = remaining[(current + direction + remaining.length) % remaining.length];
  state.revision++;
}

export function pause(state) {
  if (state.screen === 'play' || state.screen === 'paused') {
    state.screen = state.screen === 'play' ? 'paused' : 'play';
    state.hint = null;
    state.revision++;
  }
}

/** Next playable scene after `index` (used by the level-complete card); -1 when none is open. */
export function nextUnlocked(state, index) {
  for (let i = index + 1; i < SCENES.length; i++) if (unlocked(state, i)) return i;
  return -1;
}
