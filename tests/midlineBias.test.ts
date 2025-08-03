import { test, expect } from "bun:test"
import { calculateElbow, type ElbowPoint } from "../lib"

test("bias 0 routes via point1 axis", () => {
  const point1: ElbowPoint = { x: 0, y: 0 }
  const point2: ElbowPoint = { x: 3, y: 2 }
  const result = calculateElbow(point1, point2, { bias: 0 })
  expect(result).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 3, y: 2 },
  ])
})

test("bias 1 routes via point2 axis", () => {
  const point1: ElbowPoint = { x: 0, y: 0 }
  const point2: ElbowPoint = { x: 3, y: 2 }
  const result = calculateElbow(point1, point2, { bias: 1 })
  expect(result).toEqual([
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 2 },
  ])
})
