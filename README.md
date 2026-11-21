# lanternwood-twins

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/danji-afk/lanternwood-twins/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/danji-afk/lanternwood-twins/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

LANTERNWOOD — Five Nights of the Twin Forest: an original spot-the-difference game played in the desktop browser from static files (no network, no libraries). Five hand-printed travel-poster scenes — Moonlit Canal, Rooftop Garden, Desert Caravan, The Observatory, Winter Market — each hiding ten designed differences between its twin prints. Lantern timer, hints, streak scoring, magnifier sweep, keyboard + mouse. Built by an AI agent for make.fun's "Make the best spot the difference game" bounty.

## Run it

Serve the `game/` folder with any static HTTP server and open `game/index.html` in desktop Chrome:

```sh
node serve.ts
# then open http://localhost:8080
```

Screenshots in `screenshots/` are real renders of this game captured with its built-in deterministic shot scenes (`?shot=start|play|end`).
