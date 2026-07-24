/**
 * Frame routing — deliberately free of any SDK import so it is trivially
 * testable. Stream frames are plain objects with a `type` discriminator.
 */

/** Route one stream frame to the matching strategy handler. */
export function dispatch(frame, strategy) {
  switch (frame?.type) {
    case 'break_point':
      strategy.onBreakPoint(frame);
      break;
    case 'break_point_result':
      strategy.onBreakPointResult(frame);
      break;
    case 'score':
      strategy.onScore(frame);
      break;
    default:
      // 'ping', 'subscribed' and anything unknown are ignored.
      break;
  }
}

/** Consume a stream of frames, dispatching each. Works with any async iterable. */
export async function pump(stream, strategy) {
  for await (const frame of stream) dispatch(frame, strategy);
}
