import { test, expect } from "bun:test"
import { calculateElbow, type ElbowPoint } from "../lib"

test("elbow07", () => {
  const point1: ElbowPoint = { x: 0, y: 0, facingDirection: "y+" }
  const point2: ElbowPoint = { x: 5, y: 2, facingDirection: "x+" }
  const result = calculateElbow(point1, point2)
  expect(result).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 2.5 },
    { x: 5, y: 2.5 },
    { x: 5, y: 2 },
  ])
})
