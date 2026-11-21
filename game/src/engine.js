// The render loop and hit testing. boot() owns the state object, draws the found rings / hint
// pulse / wrong-click mark onto each panel's canvas, positions the magnifier, and routes input
// actions into the pure rules in state.js. All coordinates are the scene's own 1280 × 800 pixels.
import { IMAGE_HEIGHT, IMAGE_WIDTH, SCENES, fittedBox } from './scenes-data.js';
import {
  createState, findDifference, foundSet, nextUnlocked,
  pause, startLevel, sweep, tick, useHint, wrongClick,
} from './state.js';
import { createAudio } from './audio.js';
import { createHud } from './hud.js';
import { createInput } from './input.js';
import { bootShots, shotHint } from './shots.js';

const FOUND_HOLD = 1600; // how long a fresh ring keeps its arrival animation
const WRONG_HOLD = 900;
const LENS_SIZE = 108;   // must match .magnifier in style.css
const LENS_ZOOM = 2;

export function boot() {
  const root = document.querySelector('#game');
  if (!root) throw new Error('Lanternwood: #game root missing from index.html');
  const status = document.querySelector('#status');
  const audio = createAudio();
  const params = new URLSearchParams(location.search);
  const shotName = params.get('shot');
  const state = createState({ demo: Boolean(shotName) });
  // Screenshots freeze the clock so the same query always paints the same frame.
  const SHOT_NOW = 1000;
  const now = () => (shotName ? SHOT_NOW : performance.now());

  let previousScreen = state.screen;
  let lastFrame = performance.now();
  let lastRevision = -1;
  let pointer = null;
  let lens = { visible: false, active: false };

  function announce(message) { if (status) status.textContent = message; }

  function firstLevel() {
    const index = state.progress.findIndex(record => !record.stars);
    return index < 0 ? 0 : index;
  }

  function launch(index) {
    if (!startLevel(state, index, now())) return;
    previousScreen = state.screen;
    lastFrame = performance.now();
    audio.unlock();
    hud.render();
    announce(`Night ${index + 1}: ${SCENES[index].name}. Find ten differences.`);
  }
  function enterTitle() {
    state.screen = 'title';
    state.result = null;
    state.revision++;
    hud.render();
    announce('The atlas. Choose a clearing.');
  }
  function advance() {
    // On the last scene's card the journey is over: the atlas is the only place left to go.
    if (state.level === SCENES.length - 1) {
      enterTitle();
      return;
    }
    const next = nextUnlocked(state, state.level);
    launch(next < 0 ? state.level + 1 : next);
  }
  function toggleMute() {
    state.muted = !state.muted;
    audio.setMuted(state.muted);
    hud.update();
    announce(state.muted ? 'Sound off.' : 'Sound on.');
  }

  function onPick(point) {
    if (!point || state.screen !== 'play') return;
    audio.unlock();
    const scene = SCENES[state.level];
    const hit = scene.diffs.findIndex((diff, index) =>
      !foundSet(state).has(index) && Math.hypot(point.x - diff.x, point.y - diff.y) <= diff.r + 10);
    if (hit >= 0) {
      if (findDifference(state, hit, now())) {
        audio.play('found');
        announce(`Difference ${foundSet(state).size} found. ${scene.diffs[hit].note}`);
        if (state.screen === 'complete') {
          audio.play('complete');
          if (state.level === SCENES.length - 1) state.screen = 'win';
        }
      }
      return;
    }
    wrongClick(state, point.x, point.y, point.panel, now());
    audio.play('wrong');
    announce(state.screen === 'fail' ? 'The lantern has gone out.' : 'Not quite. Five seconds lost.');
  }
  function doHint() {
    if (useHint(state, now())) {
      audio.unlock();
      audio.play('hint');
      announce(`A clue is glowing. ${state.hints} hint${state.hints === 1 ? '' : 's'} remain; ten seconds spent.`);
    }
  }
  function togglePause() {
    if (state.screen === 'play' || state.screen === 'paused') {
      pause(state);
      lastFrame = performance.now();
      announce(state.screen === 'paused' ? 'Paused.' : 'Returned to the scene.');
    } else if (state.screen === 'title') launch(firstLevel());
    else if (state.screen === 'fail') launch(state.level);
    else if (state.screen === 'complete' || state.screen === 'win') advance();
  }
  function confirm() {
    if (state.screen === 'title') launch(firstLevel());
    else if (state.screen === 'paused') togglePause();
    else if (state.screen === 'fail') launch(state.level);
    else if (state.screen === 'play' && state.sweep >= 0) {
      onPick({ ...SCENES[state.level].diffs[state.sweep], panel: 0 });
    } else if (state.screen === 'complete' || state.screen === 'win') advance();
  }

  const hud = createHud(root, state, {
    start: launch,
    firstLevel,
    next: advance,
    title: enterTitle,
    hint: doHint,
    pause: togglePause,
    mute: toggleMute,
  });

  /**
   * The painted area of the <img> is the authority for hit testing, marks and the lens alike.
   * Returns it in viewport space plus its offset from the panel's media box, so letterboxing (if
   * any) can never shift a ring away from the difference it marks.
   */
  function panelMetrics(panel) {
    const box = fittedBox(panel.querySelector('img'));
    const media = panel.querySelector('.panel-media').getBoundingClientRect();
    // The mark canvas is a child of .panel-media, so it inherits any wrong-click shake; both the
    // image and the canvas move together and the ring stays locked to the artwork.
    return {
      box,
      sx: box.width / IMAGE_WIDTH,
      sy: box.height / IMAGE_HEIGHT,
      offsetX: box.left - media.left,
      offsetY: box.top - media.top,
    };
  }

  function drawMarks(at) {
    const scene = SCENES[state.level];
    if (!scene) return;
    root.querySelectorAll('.scene-panel').forEach(panel => {
      const canvas = panel.querySelector('canvas.marks');
      if (!canvas) return;
      const { box, sx, sy, offsetX, offsetY } = panelMetrics(panel);
      if (!box.width || !box.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(box.width * dpr);
      const h = Math.round(box.height * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const ctx = canvas.getContext('2d');
      // The canvas sits on .panel-media; align its origin with the painted image area.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * sx, 0, 0, dpr * sy, dpr * offsetX, dpr * offsetY);
      ctx.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
      // Strokes, dashes, badges and text are sized in screen pixels: u converts them into image
      // space, so a mark looks the same whether the panel is 574px wide or full screen.
      const u = 1 / Math.min(sx, sy);

      // Found rings and check badges, identical on both prints.
      for (const index of foundSet(state)) {
        const diff = scene.diffs[index];
        const flash = state.flash;
        const fresh = flash?.kind === 'found' && flash.index === index;
        const age = fresh ? Math.max(0, FOUND_HOLD - (flash.until - at)) : FOUND_HOLD;
        const grow = !shotName && age < 520 ? 1 + (1 - age / 520) * 0.36 : 1;
        const alpha = shotName ? 1 : age < 520 ? 1 : Math.max(0.78, 1 - (age - 520) / 2400);
        ctx.save();
        ctx.globalAlpha = alpha;
        // A dark halo under the light ring keeps it legible on pale sand, sky and snow alike.
        ctx.lineWidth = 9 * u;
        ctx.strokeStyle = 'rgba(20, 16, 28, 0.6)';
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, (diff.r + 11) * grow, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 4.5 * u;
        ctx.strokeStyle = '#fff7d7';
        ctx.shadowColor = '#f2be63';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, (diff.r + 11) * grow, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#f0bd60';
        ctx.lineWidth = 2.5 * u;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.r + 4, 0, Math.PI * 2);
        ctx.stroke();
        const bx = diff.x + diff.r * 0.69;
        const by = diff.y - diff.r * 0.69;
        const badge = 15 * u;
        ctx.fillStyle = '#f7efd7';
        ctx.beginPath();
        ctx.arc(bx, by, badge, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#243553';
        ctx.lineWidth = 4 * u;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - 6 * u, by);
        ctx.lineTo(bx - 1 * u, by + 5 * u);
        ctx.lineTo(bx + 7 * u, by - 5 * u);
        ctx.stroke();
        ctx.restore();
      }

      // Hint pulse: a bright dashed ring, a soft inner wash and four little ticks, so the region
      // reads clearly even on a bright star.
      if (state.hint && at < state.hint.until) {
        const diff = scene.diffs[state.hint.index];
        const wave = (1 + Math.sin(at / 110)) / 2; // 0..1
        const radius = (diff.r + 20) * (1 + wave * 0.08);
        ctx.save();
        ctx.globalAlpha = 0.32 + wave * 0.22;
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.r + 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 8 * u;
        ctx.strokeStyle = 'rgba(26, 20, 34, 0.6)';
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 4.5 * u;
        ctx.strokeStyle = '#fff6cf';
        ctx.setLineDash([10 * u, 8 * u]);
        ctx.lineDashOffset = -at / 26;
        ctx.shadowColor = '#ffcf70';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Keyboard sweep target.
      if (state.sweep >= 0 && !foundSet(state).has(state.sweep)) {
        const diff = scene.diffs[state.sweep];
        ctx.save();
        ctx.strokeStyle = '#fff3ba';
        ctx.lineWidth = 5 * u;
        ctx.setLineDash([7 * u, 7 * u]);
        ctx.shadowColor = '#ffc358';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.r + 17 + Math.sin(at / 180) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Wrong-click mark, only on the panel that was clicked.
      const flash = state.flash;
      if (flash?.kind === 'wrong' && flash.panel === Number(panel.dataset.panel) && at < flash.until) {
        const t = Math.max(0, (flash.until - at) / WRONG_HOLD);
        const shake = Math.sin((1 - t) * 44) * 7 * t;
        ctx.save();
        ctx.globalAlpha = t;
        ctx.translate(flash.x + shake, flash.y);
        ctx.fillStyle = '#e78275';
        ctx.strokeStyle = '#fff0dd';
        ctx.lineWidth = 4 * u;
        ctx.font = `bold ${Math.round(40 * u)}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#731f2c';
        ctx.shadowBlur = 18;
        ctx.fillText('×', 0, 0);
        ctx.restore();
      }
    });
  }

  /** Panel-level shake on a wrong click: the media box itself jolts, then settles. */
  function renderShake(at) {
    const flash = state.flash;
    root.querySelectorAll('.scene-panel').forEach(panel => {
      const media = panel.querySelector('.panel-media');
      if (!media) return;
      const on = flash?.kind === 'wrong' && flash.panel === Number(panel.dataset.panel) && at < flash.until;
      if (!on) {
        if (media.style.transform) media.style.transform = '';
        media.classList.remove('is-shaking');
        return;
      }
      const t = Math.max(0, (flash.until - at) / WRONG_HOLD);
      const dx = Math.sin((1 - t) * 46) * 9 * t;
      const dy = Math.cos((1 - t) * 37) * 4 * t;
      media.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      media.classList.add('is-shaking');
    });
  }

  function renderLens() {
    root.querySelectorAll('.scene-panel').forEach(panel => {
      const node = panel.querySelector('.magnifier');
      if (!node) return;
      const show = Boolean(pointer && pointer.panel === Number(panel.dataset.panel) && lens.visible);
      node.hidden = !show;
      if (!show) return;
      const { box, offsetX, offsetY } = panelMetrics(panel);
      const x = pointer.x / IMAGE_WIDTH * box.width + offsetX;
      const y = pointer.y / IMAGE_HEIGHT * box.height + offsetY;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.backgroundImage = `url("${SCENES[state.level][Number(panel.dataset.panel) ? 'imgB' : 'imgA']}")`;
      node.style.backgroundSize = `${box.width * LENS_ZOOM}px ${box.height * LENS_ZOOM}px`;
      node.style.backgroundPosition = `${-x * LENS_ZOOM + LENS_SIZE / 2}px ${-y * LENS_ZOOM + LENS_SIZE / 2}px`;
      node.classList.toggle('is-held', lens.active);
    });
  }

  createInput(root, {
    pick: onPick,
    hint: doHint,
    mute: toggleMute,
    pause: togglePause,
    sweep: direction => sweep(state, direction),
    canSweep: () => state.screen === 'play',
    confirm,
    pointer: (point, mode) => {
      pointer = point;
      lens = { visible: Boolean(mode.lens && point), active: Boolean(mode.active) };
    },
  });

  window.addEventListener('resize', () => {
    root.querySelectorAll('canvas.marks').forEach(canvas => { canvas.width = 0; });
  });

  function paint() {
    const at = now();
    drawMarks(at);
    renderShake(at);
    renderLens();
    requestAnimationFrame(paint);
  }

  function frame(ts) {
    const delta = Math.min(0.1, Math.max(0, (ts - lastFrame) / 1000));
    lastFrame = ts;
    if (state.screen === 'play') tick(state, delta, ts);
    if (state.screen !== previousScreen || state.revision !== lastRevision) {
      if (state.screen !== previousScreen) hud.render();
      hud.update();
      previousScreen = state.screen;
      lastRevision = state.revision;
    } else if (state.screen === 'play') {
      hud.update();
    }
    requestAnimationFrame(frame);
  }

  if (shotName) {
    document.documentElement.classList.add('is-shot');
    bootShots(shotName, state);
    if (shotName === 'play') {
      const index = shotHint(state);
      if (index >= 0) state.hint = { index, until: SHOT_NOW + 60000 };
    }
    hud.render();
    hud.update();
    // Wait for the artwork, then paint two frames before declaring the shot ready.
    const decoded = [...root.querySelectorAll('.scene-panel img')].map(img => (img.complete
      ? Promise.resolve()
      : new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      })));
    Promise.all(decoded)
      .then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      .then(() => {
        drawMarks(SHOT_NOW);
        renderLens();
        window.__shotReady = true;
      });
  } else {
    hud.render();
    if (params.get('mute') === '1') toggleMute();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(paint);
}
