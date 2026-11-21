// All DOM building: the title screen, the two-panel play board and the overlay cards. The play
// board is built once per scene and never rebuilt while overlays open and close, so the images,
// canvases and magnifier keep their state and no duplicate element IDs can appear.
import { CHAPTERS, IMAGE_HEIGHT, IMAGE_WIDTH, SCENES } from './scenes-data.js';
import { MAX_STRIKES, START_TIME, multiplier, unlocked } from './state.js';

const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const stars = count => '★'.repeat(count) + '☆'.repeat(3 - count);
const clock = seconds => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
const RATIO = `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}`;

export function createHud(root, state, actions) {
  let builtLevel = -1;
  let overlayKey = '';

  root.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'level') actions.start(Number(button.dataset.level));
    else if (action === 'play') actions.start(actions.firstLevel());
    else if (action === 'next') actions.next();
    else if (action === 'retry') actions.start(state.level);
    else if (action === 'title') actions.title();
    else if (action === 'hint') actions.hint();
    else if (action === 'pause') actions.pause();
    else if (action === 'mute') actions.mute();
  });

  function title() {
    const starTotal = state.progress.reduce((n, record) => n + record.stars, 0);
    root.innerHTML = `<main class="title-screen">
      <header class="brandline">
        <div class="brand-mark" aria-hidden="true">✳</div>
        <span class="brand-name">LANTERNWOOD <i>FIELD JOURNAL · NO. 05</i></span>
        <button class="icon-button mute-button" data-action="mute" aria-label="Toggle sound">♪</button>
      </header>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow"><span class="eyebrow-line"></span>THE TWILIGHT COLLECTION</p>
          <h1>Five Nights of<br>the <em>Twin Forest.</em></h1>
          <p class="hero-subtitle">Five hand-printed scenes. Fifty sneaky differences.</p>
          <button class="primary-button" data-action="play">Begin your journey <span aria-hidden="true">↗</span></button>
          <span class="tiny-note">90 seconds per scene · Two hints · One good eye</span>
        </div>
        <aside class="how-card">
          <div class="how-icon" aria-hidden="true">⌕</div>
          <p class="eyebrow">A NOTE FOR THE WAYFARER</p>
          <h2>Look a little closer.</h2>
          <p>Two prints share one quiet secret. Find all ten changes before the lantern goes out.</p>
          <div class="key-guide">
            <div><kbd>CLICK</kbd><span>mark a difference on either print</span></div>
            <div><kbd>⇥</kbd><span>sweep between hidden details</span></div>
            <div><kbd>H</kbd><span>spend a hint to reveal a region</span></div>
            <div><kbd>⇧</kbd><span>hold Shift (or right-click) to magnify</span></div>
          </div>
          <div class="mouse-note"><span class="mouse-symbol" aria-hidden="true">⌖</span><span>Click, tap or use the keyboard.<br><b>A miss costs five seconds.</b></span></div>
        </aside>
      </section>
      <section class="collection">
        <div class="collection-heading">
          <div><p class="eyebrow">YOUR ATLAS</p><h2>Choose a clearing <span>·</span> <small>five destinations</small></h2></div>
          <span class="collection-count">${starTotal} <span>✦</span> / ${SCENES.length * 3} STARS</span>
        </div>
        <div class="scene-cards">${SCENES.map((scene, i) => {
          const open = unlocked(state, i);
          const record = state.progress[i];
          return `<button class="scene-card ${open ? '' : 'locked'}" data-action="level" data-level="${i}" ${open ? '' : 'disabled'} style="--accent:${scene.palette[2]}">
            <span class="card-number">0${i + 1}</span>
            <div class="card-art" style="background-image:linear-gradient(0deg,rgba(18,21,37,.62),transparent 68%),url('${scene.imgA}')"><span class="card-lock" aria-hidden="true">${open ? '↗' : '⌑'}</span></div>
            <span class="card-name">${esc(scene.name)}</span>
            <span class="card-meta"><span class="card-stars">${stars(record.stars)}</span><span>${record.best ? record.best.toLocaleString() : open ? 'OPEN' : 'LOCKED'}</span></span>
          </button>`;
        }).join('')}</div>
      </section>
      <footer class="title-footer"><span>✳ A small atlas of things almost seen.</span><span>MADE FOR THE LONG WAY HOME</span></footer>
    </main>`;
    builtLevel = -1;
  }

  function play() {
    const scene = SCENES[state.level];
    root.innerHTML = `<main class="play-screen">
      <header class="play-header">
        <button class="back-button" data-action="title" aria-label="Back to the atlas">← <span>ATLAS</span></button>
        <div class="scene-heading"><p class="eyebrow">SCENE 0${state.level + 1} <span>·</span> NIGHT ${state.level + 1}</p><h1>${esc(scene.name)}</h1><span class="chapter">${esc(CHAPTERS[state.level] || '')}</span></div>
        <div class="play-actions"><button class="icon-button mute-button" data-action="mute" aria-label="Toggle sound">♪</button><button class="icon-button pause-button" data-action="pause" aria-label="Pause game">Ⅱ</button></div>
      </header>
      <section class="game-hud" aria-label="Scene status">
        <div class="hud-stat found-stat"><span class="stat-icon" aria-hidden="true">✳</span><strong id="found-count">0 <small>/ 10</small></strong><span class="stat-label">FOUND</span></div>
        <div class="timer-stat"><div class="timer-top"><span><i class="timer-lantern" aria-hidden="true">◉</i> LANTERN TIME</span><b id="timer-label">01:30</b></div><div class="timer-track"><span id="timer-fill"></span></div></div>
        <div class="hud-stat score-stat"><strong id="score-label">0</strong><span class="stat-label">SCORE <b id="multiplier-label">×1</b></span></div>
        <div class="hud-stat streak-stat"><strong id="streak-label">0</strong><span class="stat-label">STREAK</span></div>
        <div class="hud-stat strikes-stat"><strong id="strike-label">○ ○ ○</strong><span class="stat-label">MISSES</span></div>
      </section>
      <section class="scene-frame" aria-label="Find ten differences between these pictures">
        <div class="frame-topline"><span>THE TWIN PRINTS</span><span class="frame-ornament" aria-hidden="true">✳</span><span>1280 × 800 · FIELD STUDY</span></div>
        <div class="panel-pair">
          <div class="scene-panel" data-panel="0"><div class="panel-media" style="aspect-ratio:${RATIO}"><img draggable="false" src="${scene.imgA}" alt="First print of ${esc(scene.name)}"><canvas class="marks" aria-hidden="true"></canvas><div class="magnifier" hidden></div></div><span class="panel-index">I · BEFORE</span></div>
          <div class="panel-divider" aria-hidden="true"><span>✦</span><i></i><span>✦</span></div>
          <div class="scene-panel" data-panel="1"><div class="panel-media" style="aspect-ratio:${RATIO}"><img draggable="false" src="${scene.imgB}" alt="Second print of ${esc(scene.name)}"><canvas class="marks" aria-hidden="true"></canvas><div class="magnifier" hidden></div></div><span class="panel-index">II · AFTER</span></div>
        </div>
        <div class="frame-caption"><span class="caption-rule"></span><span class="caption-plate">${esc(scene.name.toUpperCase())}<small>${esc(CHAPTERS[state.level] || '')}</small></span><span class="caption-rule"></span></div>
      </section>
      <footer class="play-footer">
        <div class="hint-status"><span class="hint-glyph" aria-hidden="true">✧</span><span><b>THE WAYFINDER</b><small><span id="hint-count">2</span> clues remaining <i>·</i> costs 10 seconds</small></span></div>
        <button class="hint-button" data-action="hint"><span aria-hidden="true">✧</span> ASK FOR A HINT <kbd>H</kbd></button>
        <div class="play-tips"><kbd>⇥</kbd> SWEEP <span>·</span> <kbd>ENTER</kbd> MARK <span>·</span> <kbd>P</kbd> PAUSE <span>·</span> <kbd>M</kbd> MUTE</div>
      </footer>
      <div class="flash" id="flash" role="status" aria-live="polite"></div>
      <div id="screen-overlay" class="screen-overlay" hidden></div>
    </main>`;
    builtLevel = state.level;
  }

  function overlay() {
    const node = root.querySelector('#screen-overlay');
    if (!node) return;
    const scene = SCENES[state.level];
    // Rebuild only when the card actually changes; rebuilding every frame would restart the
    // entrance animation and thrash the DOM under the player's cursor.
    const key = state.screen === 'complete' || state.screen === 'win' ? `${state.screen}:${state.level}:${state.result?.score}` : `${state.screen}:${state.level}`;
    if (key === overlayKey && node.dataset.built === '1') return;
    if (state.screen === 'play') {
      if (!node.hidden) {
        node.hidden = true;
        node.innerHTML = '';
        delete node.dataset.kind;
      }
      delete node.dataset.built;
      overlayKey = '';
      return;
    }
    overlayKey = key;
    node.dataset.built = '1';
    if (state.screen === 'paused') {
      node.hidden = false;
      node.dataset.kind = 'pause';
      node.innerHTML = `<article class="result-card pause-card"><span class="result-seal" aria-hidden="true">Ⅱ</span><p class="eyebrow">A MOMENT IN THE WOODS</p><h2>Take your time.</h2><p>The lantern is resting. Your journey can wait.</p><button class="primary-button" data-action="pause">Return to the scene <span aria-hidden="true">↗</span></button><button class="quiet-button" data-action="title">Back to the atlas</button></article>`;
    } else if (state.screen === 'complete' || state.screen === 'win') {
      const win = state.screen === 'win';
      const result = state.result || { stars: 3, score: state.score, time: state.elapsed, remaining: 0, strikes: state.strikes, timeBonus: 0, found: 10 };
      node.hidden = false;
      node.dataset.kind = win ? 'win' : 'complete';
      node.innerHTML = `<article class="result-card complete-card">
        <span class="result-seal" aria-hidden="true">✳</span>
        <p class="eyebrow">${win ? 'THE FIELD JOURNAL IS COMPLETE' : `CLEARING 0${state.level + 1} · WELL OBSERVED`}</p>
        <h2>${win ? 'Every light, remembered.' : 'There it is.'}</h2>
        <p class="result-intro">${win ? 'Five nights. Fifty details. A forest seen in full.' : `${esc(scene.name)} keeps no more secrets from you.`}</p>
        <div class="big-stars" aria-label="${result.stars} of 3 stars">${stars(result.stars)}</div>
        <div class="result-stats">
          <div><small>POINTS</small><b>${result.score.toLocaleString()}</b></div>
          <div><small>TIME TAKEN</small><b>${clock(result.time)}</b></div>
          <div><small>MISSES</small><b>${result.strikes}</b></div>
          <div><small>DIFFERENCES</small><b>${result.found} / 10</b></div>
        </div>
        ${result.timeBonus ? `<p class="bonus-note">✧ ${result.timeBonus.toLocaleString()} points from remaining time</p>` : ''}
        <button class="primary-button" data-action="${win ? 'title' : 'next'}">${win ? 'Return to the atlas' : state.level === SCENES.length - 1 ? 'Complete the journey' : 'Next clearing'} <span aria-hidden="true">↗</span></button>
        ${win ? '' : '<button class="quiet-button" data-action="title">Return to the atlas</button>'}
      </article>`;
    } else if (state.screen === 'fail') {
      node.hidden = false;
      node.dataset.kind = 'fail';
      node.innerHTML = `<article class="result-card fail-card"><span class="result-seal" aria-hidden="true">⌁</span><p class="eyebrow">THE LANTERN HAS GONE DIM</p><h2>Not lost. Just not yet.</h2><p>You found ${state.foundByScene[state.level].size} of 10 in ${esc(scene.name)}. The forest will keep your place.</p><button class="primary-button" data-action="retry">Try this night again <span aria-hidden="true">↗</span></button><button class="quiet-button" data-action="title">Back to the atlas</button></article>`;
    }
  }

  function render() {
    if (state.screen === 'title') { title(); refs = null; }
    else if (builtLevel !== state.level) { play(); refs = null; }
    overlayKey = ''; // a screen change always earns a fresh card (and a fresh entrance animation)
    overlay();
    update();
  }

  // Cached once per board build: the play DOM never changes shape, only its text and classes.
  let refs = null;
  function cache() {
    refs = {
      count: root.querySelector('#found-count'),
      timerLabel: root.querySelector('#timer-label'),
      timerFill: root.querySelector('#timer-fill'),
      score: root.querySelector('#score-label'),
      mult: root.querySelector('#multiplier-label'),
      streak: root.querySelector('#streak-label'),
      strikes: root.querySelector('#strike-label'),
      hints: root.querySelector('#hint-count'),
      hintButton: root.querySelector('.hint-button'),
      flash: root.querySelector('#flash'),
      play: root.querySelector('.play-screen'),
      mutes: [...root.querySelectorAll('.mute-button')],
    };
  }

  function update() {
    if (!refs || !refs.count || !refs.count.isConnected) {
      if (!root.querySelector('#found-count')) return;
      cache();
    }
    const found = state.foundByScene[state.level].size;
    const total = SCENES[state.level].diffs.length;
    const foundText = `${found} <small>/ ${total}</small>`;
    if (refs.count.dataset.text !== foundText) {
      refs.count.dataset.text = foundText;
      refs.count.innerHTML = foundText;
    }
    const timer = Math.max(0, state.time);
    const urgent = timer <= 20;
    const label = refs.timerLabel;
    if (label) {
      const text = clock(timer);
      if (label.textContent !== text) label.textContent = text;
      label.classList.toggle('urgent', urgent);
    }
    const fill = refs.timerFill;
    if (fill) {
      fill.style.width = `${Math.min(100, timer / START_TIME * 100)}%`;
      fill.classList.toggle('urgent', urgent);
      fill.classList.toggle('recovering', state.flash?.kind === 'found');
    }
    const score = refs.score;
    if (score) {
      const text = state.score.toLocaleString();
      if (score.textContent !== text) score.textContent = text;
    }
    const mult = refs.mult;
    if (mult) { mult.textContent = `×${multiplier(state)}`; mult.classList.toggle('hot', multiplier(state) > 1); }
    const streak = refs.streak;
    if (streak) {
      streak.textContent = state.streak;
      streak.classList.toggle('hot', state.streak >= 3);
    }
    const strikes = refs.strikes;
    if (strikes) {
      strikes.textContent = `${'● '.repeat(Math.min(MAX_STRIKES, state.strikes))}${'○ '.repeat(Math.max(0, MAX_STRIKES - state.strikes))}`.trim();
      strikes.classList.toggle('danger', state.strikes >= MAX_STRIKES - 1);
    }
    const hints = refs.hints;
    if (hints) hints.textContent = state.hints;
    const hintButton = refs.hintButton;
    if (hintButton) {
      hintButton.classList.toggle('is-empty', state.hints <= 0);
      hintButton.disabled = state.hints <= 0;
      const key = hintButton.querySelector('kbd');
      const keyText = state.hints > 0 ? 'H' : '—';
      if (key && key.textContent !== keyText) key.textContent = keyText;
    }
    refs.mutes.forEach(button => {
      button.textContent = state.muted ? '♩' : '♪';
      button.classList.toggle('is-muted', state.muted);
      button.setAttribute('aria-pressed', String(state.muted));
    });
    refs.play?.classList.toggle('is-urgent', urgent);
    const flash = refs.flash;
    if (flash) {
      const active = state.flash && state.flash.kind !== 'wrong';
      const text = active ? state.flash.text : '';
      if (flash.textContent !== text) flash.textContent = text;
      flash.classList.toggle('show', Boolean(active));
      flash.classList.toggle('warm', Boolean(state.flash?.milestone));
    }
    overlay();
  }

  return { render, update };
}
export { stars, clock };
