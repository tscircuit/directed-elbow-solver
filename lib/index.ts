import { calculateElbowBends, type ElbowPoint } from "./calculateElbowBends"

export type { ElbowPoint }

export const calculateElbow = (
  point1: ElbowPoint,
  point2: ElbowPoint,
  options: {
    /**
     * Amount to overshoot the line if the facingDirection requires that we go
     * beyond "out" before turning
     */
    overshoot?: number
  } = {},
): Array<{ x: number; y: number }> => {
  let p1 = point1
  let p2 = point2
  let flipped = false

  if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
    flipped = true
    ;[p1, p2] = [p2, p1]
  }

  const overshootAmount =
    options?.overshoot ??
    0.1 * Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y))

  const result = calculateElbowBends(p1, p2, overshootAmount)
  return flipped ? result.reverse() : result
}