// Pointer, touch and keyboard handling. Coordinates are converted to the scene's own 1280 × 800
// pixel space with the shared fittedBox() helper, the same geometry the mark canvas is drawn in,
// so a click and a ring can never disagree about where a difference is.
import { IMAGE_HEIGHT, IMAGE_WIDTH, fittedBox } from './scenes-data.js';

export function createInput(root, handlers) {
  let shift = false;

  /** Scene-space point under a pointer event, or null when it is outside the artwork. */
  function pointFromEvent(event) {
    const panel = event.target.closest?.('.scene-panel');
    if (!panel) return null;
    const img = panel.querySelector('img');
    if (!img) return null;
    const box = fittedBox(img);
    if (!box.width || !box.height) return null;
    if (event.clientX < box.left || event.clientX > box.left + box.width
      || event.clientY < box.top || event.clientY > box.top + box.height) return null;
    return {
      x: (event.clientX - box.left) / box.width * IMAGE_WIDTH,
      y: (event.clientY - box.top) / box.height * IMAGE_HEIGHT,
      panel: Number(panel.dataset.panel),
    };
  }

  const emit = (event, active = false) => {
    const point = pointFromEvent(event);
    handlers.pointer?.(point, { lens: point !== null && (shift || event.buttons === 2), active });
    return point;
  };

  root.addEventListener('pointermove', event => emit(event, event.buttons === 2));
  root.addEventListener('pointerleave', () => handlers.pointer?.(null, { lens: false, active: false }));
  root.addEventListener('contextmenu', event => { if (event.target.closest?.('.scene-panel')) event.preventDefault(); });
  root.addEventListener('pointerdown', event => {
    if (event.button === 2) {
      if (!event.target.closest?.('.scene-panel')) return;
      event.preventDefault();
      emit(event, true);
      return;
    }
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    const point = pointFromEvent(event);
    if (point) { event.preventDefault(); handlers.pick(point); }
  });
  root.addEventListener('pointerup', event => { if (event.button === 2) emit(event, false); });

  window.addEventListener('keydown', event => {
    if (event.key === 'Shift') { shift = true; return; }
    const target = event.target;
    // Events can arrive with window/document/body as target (synthetic or unfocused pages).
    const outside = target && target !== window && target !== document && target !== document.body
      && !target.closest?.('#game');
    if (outside) return;
    // Let the browser activate a focused control; otherwise Enter would both click the button and
    // run our confirm() handler.
    const onControl = Boolean(target?.closest?.('button, a, input, textarea, select'));
    const key = event.key.toLowerCase();
    if (event.key === 'Tab') {
      // Tab sweeps between unfound details only while a scene is being played; elsewhere it keeps
      // its normal job of moving focus between controls.
      if (handlers.canSweep?.()) {
        event.preventDefault();
        if (!event.repeat) handlers.sweep(event.shiftKey ? -1 : 1);
      }
    } else if (event.key.startsWith('Arrow')) {
      if (!onControl) event.preventDefault();
      if (!event.repeat) handlers.sweep(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (onControl) return;
      event.preventDefault();
      if (!event.repeat) handlers.confirm();
    } else if (key === 'h') { if (!event.repeat) handlers.hint(); }
    else if (key === 'm') { if (!event.repeat) handlers.mute(); }
    else if (key === 'p' || event.key === 'Escape') { if (!event.repeat) handlers.pause(); }
  });
  window.addEventListener('keyup', event => {
    if (event.key === 'Shift') { shift = false; handlers.pointer?.(null, { lens: false, active: false }); }
  });
  window.addEventListener('blur', () => { shift = false; handlers.pointer?.(null, { lens: false, active: false }); });

  return { pointFromEvent };
}
