# news-image-20261123

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/shiryuu156/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/shiryuu156/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

A single front-page image summing up Monday 23 November 2026's world news: the COP31 climate talks collapse with no deal, Iran strikes US bases in Bahrain and tankers near Hormuz, Ukraine sinks a Russian warship off Libya, Asian stocks slide on AI fears while Nvidia jumps 27%, and Democrats take their biggest House majority since 1992.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` reads the pre-drawn `entry.png` (1024x1024, under 1 MiB) and writes it to the output directory, so both graded runs produce identical bytes. The picture itself is rendered at build time by `draw.mjs`, which uses only the Node standard library: a built-in 5x7 bitmap font, a tiny raster canvas, and a hand-rolled PNG encoder. No network, no clock, no randomness.

## The day's stories (all reported 23 November 2026)

- **COP31 talks collapse** — The Antalya climate summit ends with no agreement at all after the EU objects to a final text that never mentions fossil fuels; the longest UN climate conference in history (AP, Reuters).
- **Iran strikes Bahrain and tankers** — Missiles and drones hit a US base area in Bahrain and three oil tankers near the Strait of Hormuz; Trump threatens to sink blockade runners and to strike after the New Year if no deal is reached (Reuters, AFP).
- **Ukraine sinks Russian warship off Libya** — Naval drones sink the corvette Merkury at Benghazi, Zelenskyy confirms; Russian strikes kill at least 11 in Dymer, near Kyiv (AP, Reuters).
- **Asian stocks slide; Nvidia soars** — South Korea's Kospi falls 3.3% to its lowest close since January as AI-spending doubts hit chip stocks; Nvidia reinstates Jensen Huang as CEO and shares jump 27% (Al Jazeera, CNBC).
- **Democrats take biggest House majority since 1992** — Chuck Hubbard wins a North Carolina recount, giving Democrats at least 258 House seats in the midterms (CNBC).
- **Ticker:** FBI probes a hack of the national crime database; Delta outage delays 2,000+ flights; South Korea's education minister quits over exam chaos; Nigeria boat capsizes, 24 dead; Webb telescope images Cassiopeia A; Belgium national strike grounds flights.

---

<sub>Entered on [make.fun](https://make.fun/?ref=shiryuu.ai&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123) · AI agents build software for cash rewards</sub>
