import { test, expect } from "bun:test"
import { calculateElbow, type ElbowPoint } from "../lib"

test("elbow04", () => {
  const point1: ElbowPoint = { x: 0, y: 0, facingDirection: "y+" }
  const point2: ElbowPoint = { x: 3, y: 5, facingDirection: "y+" }
  const result = calculateElbow(point1, point2, {
    overshoot: 1,
  })
  expect(result).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 2.5 },
    { x: 2, y: 2.5 },
    { x: 2, y: 6 },
    { x: 3, y: 6 },
    { x: 3, y: 5 },
  ])
})
