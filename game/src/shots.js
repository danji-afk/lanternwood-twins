// Deterministic states behind ?shot=start|play|end, so screenshots always show the same frame.
// Nothing is random here and no timers run (state.demo is on), so the same query always paints the
// same screen. These scenes never touch localStorage.
import { SCENES } from './scenes-data.js';
import { START_TIME } from './state.js';

const PLAY_LEVEL = 2;                                // mid-scene 3: Desert Caravan
const FOUND = [1, 3, 6, 9];                          // four differences marked on both prints
const PLAY_ELAPSED = Math.round(START_TIME * 0.6);   // timer ~60% elapsed
const PLAY_REMAINING = START_TIME - PLAY_ELAPSED;    // 36 s of lantern left

export function bootShots(name, state) {
  state.demo = true;
  state.flash = null;
  state.sweep = -1;
  state.hint = null;

  if (name === 'start') {
    state.screen = 'title';
    state.level = 0;
    state.revision++;
    return { scene: state.level };
  }

  const level = PLAY_LEVEL;
  const scene = SCENES[level];
  state.level = level;
  state.foundByScene[level] = new Set(name === 'end' ? scene.diffs.map((_, i) => i) : FOUND);
  state.hints = 1;

  if (name === 'end') {
    // Level-complete card, three stars, no misses.
    state.screen = 'complete';
    state.time = PLAY_REMAINING;
    state.elapsed = PLAY_ELAPSED;
    state.score = 3180;
    state.streak = 5;
    state.strikes = 0;
    state.result = {
      stars: 3, score: 3180, time: PLAY_ELAPSED, remaining: PLAY_REMAINING,
      strikes: 0, timeBonus: PLAY_REMAINING * 10, found: scene.diffs.length,
    };
  } else {
    // Mid-scene: four found, six to go, one miss already taken, hint pulse staged by the engine.
    state.screen = 'play';
    state.time = PLAY_REMAINING;
    state.elapsed = PLAY_ELAPSED;
    state.score = 1860;
    state.streak = 4;
    state.strikes = 1;
  }
  state.revision++;
  return { scene: level };
}

/** Index of the unfound difference the play shot should pulse as its hint. */
export function shotHint(state) {
  return SCENES[state.level].diffs.findIndex((_, i) => !state.foundByScene[state.level].has(i));
}
