/**
 * Runnable break-point reactor, built on the official `livetennisapi` SDK.
 *
 * It opens the ULTRA WebSocket feed with `signals: ['break_point']`, routes
 * every frame to a `Strategy`, and logs the paper action the strategy would
 * take. It places **no** real bets — see `strategy.js`.
 *
 *   cp .env.example .env      # then put your ULTRA key in .env
 *   npm install
 *   npm start
 *
 * The break-point feed and the WebSocket surface are ULTRA-tier only.
 */
import { LiveScoreStream, Unauthorized, UpgradeRequired } from 'livetennisapi';

import { pump } from './router.js';
import { Strategy } from './strategy.js';

export async function main() {
  const key = (process.env.LIVETENNISAPI_KEY || '').trim();
  if (!key) {
    console.error('set LIVETENNISAPI_KEY (see .env.example) — the break-point feed needs an ULTRA key');
    process.exitCode = 2;
    return;
  }

  const strategy = new Strategy();
  const stream = new LiveScoreStream({ apiKey: key, signals: ['break_point'] });
  console.log("connecting to the live feed with signals=['break_point'] …");

  try {
    await pump(stream, strategy);
  } catch (err) {
    if (err instanceof UpgradeRequired) {
      console.error('this key is not on ULTRA — the WebSocket + break-point feed require the ULTRA tier');
      process.exitCode = 3;
    } else if (err instanceof Unauthorized) {
      console.error('the API rejected this key; check LIVETENNISAPI_KEY');
      process.exitCode = 3;
    } else {
      throw err;
    }
  } finally {
    stream.close();
  }
}

// Run when executed directly (`node index.js`), not when imported by a test.
const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
