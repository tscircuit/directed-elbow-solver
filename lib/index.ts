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
  let orderFlipped = false

  if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
    orderFlipped = true
    ;[p1, p2] = [p2, p1]
  }

  // Mirror the coordinate system around p1 so it never faces "x-" or "y-"
  const mirrorX = p1.facingDirection === "x-"
  const mirrorY = p1.facingDirection === "y-"

  const mirrorPoint = (pt: ElbowPoint): ElbowPoint => {
    const x = mirrorX ? p1.x - (pt.x - p1.x) : pt.x
    const y = mirrorY ? p1.y - (pt.y - p1.y) : pt.y

    let facing = pt.facingDirection
    if (mirrorX) {
      if (facing === "x+") facing = "x-"
      else if (facing === "x-") facing = "x+"
    }
    if (mirrorY) {
      if (facing === "y+") facing = "y-"
      else if (facing === "y-") facing = "y+"
    }

    return { x, y, facingDirection: facing }
  }

  const mp1 = mirrorX || mirrorY ? mirrorPoint(p1) : p1
  const mp2 = mirrorX || mirrorY ? mirrorPoint(p2) : p2

  const overshootAmount =
    options?.overshoot ??
    0.1 *
      Math.max(Math.abs(mp1.x - mp2.x), Math.abs(mp1.y - mp2.y))

  let result = calculateElbowBends(mp1, mp2, overshootAmount)

  if (mirrorX || mirrorY) {
    result = result.map(({ x, y }) => ({
      x: mirrorX ? p1.x - (x - p1.x) : x,
      y: mirrorY ? p1.y - (y - p1.y) : y,
    }))
  }

  return orderFlipped ? result.reverse() : result
}
