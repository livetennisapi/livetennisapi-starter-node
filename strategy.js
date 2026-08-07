/**
 * Your break-point strategy — the one file you are meant to edit.
 *
 * `onBreakPoint` is where the headline signal lands. The default implementation
 * decides on a **paper** action and hands it to `placePaperOrder`, which only
 * logs. Nothing in this file places a real bet.
 *
 * The seam for real execution is `_execute`. It is deliberately left throwing
 * and is deliberately **not** called, so this starter can never move money.
 * Wire your own exchange or venue there when ready — see the clearly marked
 * block in `placePaperOrder`.
 */
export class Strategy {
  constructor(baseStake = 10) {
    this.baseStake = baseStake;
    this.breakPointsSeen = 0;
  }

  // -- event handlers ---------------------------------------------------------

  /**
   * A routine score change. Kept quiet so break points stand out.
   *
   * The score payload nests under `event.score` (sets, games, points, server,
   * is_tiebreak, timestamp) and carries the ULTRA model fields
   * `win_probability_p1` and `danger` on every frame — `null` there means the
   * model had no output for that state, not that the feed withheld it.
   */
  onScore(event) {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      const score = event.score ?? {};
      console.log(
        `score  match=${event.match_id}  sets=${JSON.stringify(score.sets)}  ` +
          `win_prob_p1=${score.win_probability_p1 ?? 'n/a'}`,
      );
    }
  }

  /** The headline signal: a break point is on the board. */
  onBreakPoint(event) {
    this.breakPointsSeen += 1;
    console.log(
      `BREAK POINT  match=${event.match_id}  p${event.server} serving, ` +
        `p${event.returner} holds ${event.break_points} break point(s)  swing=${event.prob_swing}`,
    );
    const order = this.decide(event);
    if (order) this.placePaperOrder(order);
  }

  onBreakPointResult(event) {
    console.log(
      `  -> break point ${event.outcome}  match=${event.match_id}  ` +
        `p1 win prob now ${event.win_probability_p1_after}`,
    );
  }

  // -- decision ---------------------------------------------------------------

  /**
   * Turn a break-point event into an intended paper order, or `null`.
   *
   * Illustrative rule: when the serving side is not favoured to hold, back the
   * returner to convert; stake scales with how many break points are live. A
   * placeholder — put your real edge here.
   */
  decide(event) {
    if (event.server_side_favoured) return null;
    const returner = event.returner;
    if (returner !== 1 && returner !== 2) return null;
    const n = event.break_points || 1;
    const stake = Math.round(this.baseStake * Math.min(n, 3) * 100) / 100;
    return {
      matchId: event.match_id,
      side: returner,
      stake,
      reason: `${n} break point(s) against an unfavoured server`,
    };
  }

  // -- execution (paper only) -------------------------------------------------

  /** Log the intended order. Places NO real bet. */
  placePaperOrder(order) {
    console.log(
      `PAPER ORDER  back p${order.side} on match ${order.matchId} ` +
        `for ${order.stake.toFixed(2)}  (${order.reason})`,
    );

    // ================= WIRE YOUR OWN EXCHANGE / VENUE HERE =================
    // This starter intentionally stops at logging. To go live, implement
    // `_execute` against your venue's API and call it here. It is left
    // uncalled on purpose so a fresh clone can never move real money.
    //
    //     this._execute(order);
    // ======================================================================
  }

  /** Seam for real order placement. Unimplemented by design. */
  _execute(order) {
    throw new Error('wire your real exchange/venue here; this starter places NO real bets');
  }
}
