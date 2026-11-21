# Crazy Family’s Cabin Cup

Ten games, three teams of eight, a host panel on the laptop and a show screen on the TV.

- `/host`: host controls (roster, team shuffle, timers, scoring, tiebreakers, which screen the TV shows)
- `/show`: the TV screen. Open it from the host with **Open TV window**, drag it to the TV, press **F** for fullscreen and click once to turn on sound.
- `/`: a public rule book that people can read on their phones

The host and TV windows must be in the same browser on the same laptop (extended display). They stay in sync through BroadcastChannel and autosave to localStorage, so nothing needs a server and a refresh won't lose scores.

Scoring is 10 / 6 / 3 points per game, which you can change in Event setup.

```
npm install
npm run dev
```
