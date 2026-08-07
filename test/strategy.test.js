import assert from 'node:assert/strict';
import test from 'node:test';

import { dispatch, pump } from '../router.js';
import { Strategy } from '../strategy.js';

test('dispatch routes each frame type and ignores noise', () => {
  const seen = [];
  const spy = {
    onScore: () => seen.push('score'),
    onBreakPoint: () => seen.push('break_point'),
    onBreakPointResult: () => seen.push('break_point_result'),
  };
  dispatch({ type: 'score' }, spy);
  dispatch({ type: 'break_point' }, spy);
  dispatch({ type: 'break_point_result' }, spy);
  dispatch({ type: 'ping' }, spy); // ignored
  dispatch({ type: 'subscribed' }, spy); // ignored
  assert.deepEqual(seen, ['score', 'break_point', 'break_point_result']);
});

test('pump consumes an async iterable (a mocked stream) in order', async () => {
  async function* frames() {
    yield { type: 'break_point', returner: 2, break_points: 1 };
    yield { type: 'score' };
  }
  const seen = [];
  const spy = {
    onScore: () => seen.push('score'),
    onBreakPoint: () => seen.push('bp'),
    onBreakPointResult: () => {},
  };
  await pump(frames(), spy);
  assert.deepEqual(seen, ['bp', 'score']);
});

test('decide backs the returner when the server is not favoured', () => {
  const order = new Strategy().decide({
    match_id: 5,
    returner: 2,
    break_points: 2,
    server_side_favoured: false,
  });
  assert.equal(order.side, 2);
  assert.equal(order.matchId, 5);
  assert.equal(order.stake, 20); // base 10 * 2 break points
});

test('decide stands aside when the server is favoured', () => {
  const order = new Strategy().decide({ returner: 2, server_side_favoured: true, break_points: 1 });
  assert.equal(order, null);
});

test('onScore reads the nested score payload (the wire shape) without throwing', () => {
  // A real `score` frame nests its payload under `score` and carries the ULTRA
  // model fields win_probability_p1 and danger on every frame.
  const frame = {
    type: 'score',
    match_id: 42,
    score: {
      sets: [1, 0],
      games: [[6, 2], [4, 0]],
      points: ['40', '30'],
      server: 1,
      is_tiebreak: false,
      timestamp: '2026-08-07T12:00:00Z',
      win_probability_p1: 0.71,
      danger: 0.22,
    },
  };
  const prev = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = 'DEBUG';
  const lines = [];
  const origLog = console.log;
  console.log = (line) => lines.push(line);
  try {
    new Strategy().onScore(frame);
  } finally {
    console.log = origLog;
    if (prev === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = prev;
  }
  assert.equal(lines.length, 1);
  assert.match(lines[0], /sets=\[1,0\]/);
  assert.match(lines[0], /win_prob_p1=0\.71/);
});

test('the execution seam refuses to place a real bet', () => {
  assert.throws(() => new Strategy()._execute({}), /NO real bets/);
});
