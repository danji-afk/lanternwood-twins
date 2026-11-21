// Bootstrapper only. The modules are plain ES modules with no side effects on import, so this file
// is the single place that starts the game: engine.js owns the shared state, builds the HUD, wires
// input (input.js) and the WebAudio cues (audio.js), and runs the render loop. hud.js reads state.js;
// shots.js stages ?shot=start|play|end; scenes-data.js supplies the artwork and difference circles.
import { boot } from './engine.js';

boot();
