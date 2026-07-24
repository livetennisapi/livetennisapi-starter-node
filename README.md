# Live Tennis API — Break-Point Starter (Node)

A tiny, runnable app that reacts to **break points** on the
[Live Tennis API](https://livetennisapi.com) live feed. It shows exactly where
your trading logic goes — and it places **no real bets**.

It rides the official [`livetennisapi`](https://www.npmjs.com/package/livetennisapi)
SDK: it opens the ULTRA WebSocket feed with `signals: ['break_point']`, routes
every frame to a `Strategy`, and logs the paper action the strategy would take.

> **Requires an ULTRA key.** The WebSocket feed and the break-point signals are
> ULTRA-tier only. Get a key at <https://livetennisapi.com/#pricing>.
>
> Needs **Node 20+** (for `--env-file` and the built-in test runner).

## Run it

```bash
cp .env.example .env          # then put your ULTRA key in .env
npm install
npm start
```

You'll see output like:

```
connecting to the live feed with signals=['break_point'] …
BREAK POINT  match=18953  p1 serving, p2 holds 2 break point(s)  swing=0.22
PAPER ORDER  back p2 on match 18953 for 20.00  (2 break point(s) against an unfavoured server)
  -> break point broken  match=18953  p1 win prob now 0.63
```

## Where your code goes

Everything you edit is in **`strategy.js`**:

- `onBreakPoint(event)` — the headline signal lands here.
- `decide(event)` — return a paper order (or `null`). Put your edge here.
- `placePaperOrder(order)` — logs the intended order. **Nothing real happens.**

### Wiring a real venue

`placePaperOrder` contains a clearly marked block:

```
// ================= WIRE YOUR OWN EXCHANGE / VENUE HERE =================
```

The real-execution seam is `Strategy._execute`. It is **left throwing and never
called on purpose**, so a fresh clone can never move money. To go live, implement
`_execute` against your venue's API and call it from `placePaperOrder`. That
choice — and any risk it carries — is entirely yours.

## Test

```bash
npm test        # node --test, no dependencies, no network
```

The tests pump canned frames through the same dispatch path the live app uses,
and assert the safety invariant: the execution seam refuses to place a real bet.

## How it maps to the API

The subscribe frame this starter sends:

```json
{ "topics": ["live-scores"], "signals": ["break_point"] }
```

Frames it reacts to: `score`, `break_point`, `break_point_result`. See the
[WebSocket section of the API reference](https://docs.livetennisapi.com/reference.html#websocket).

## License

MIT — see [LICENSE](./LICENSE).
