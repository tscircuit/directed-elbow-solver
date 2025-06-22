import { test, expect } from "bun:test"
import { calculateElbow, type ElbowPoint } from "../lib"

test("elbow02", () => {
  const point1: ElbowPoint = { x: 0, y: 0, facingDirection: "y+" }
  const point2: ElbowPoint = { x: 3, y: 2, facingDirection: "x-" }
  const result = calculateElbow(point1, point2)
  expect(result).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 2.7, y: 2 }, // p2EffectiveTargetX = 3 - 0.3 (default overshoot)
    { x: 3, y: 2 },
  ])
})
