export interface ElbowPoint {
  x: number
  y: number
  facingDirection?: "x+" | "x-" | "y+" | "y-"
}

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
  const overshootAmount =
    options?.overshoot ??
    0.1 * Math.max(Math.abs(point1.x - point2.x), Math.abs(point1.y - point2.y))

  const result: Array<{ x: number; y: number }> = [{ x: point1.x, y: point1.y }]

  const midX = (point1.x + point2.x) / 2
  const midY = (point1.y + point2.y) / 2

  const p2Target = { x: point2.x, y: point2.y }
  switch (point2.facingDirection) {
    case "x+":
      p2Target.x += overshootAmount
      break
    case "x-":
      p2Target.x -= overshootAmount
      break
    case "y+":
      p2Target.y += overshootAmount
      break
    case "y-":
      p2Target.y -= overshootAmount
      break
  }

  const startDir = point1.facingDirection ?? "none"
  const endDir = point2.facingDirection ?? "none"

  const push = (pt: { x: number; y: number }) => {
    const last = result[result.length - 1]
    if (last.x !== pt.x || last.y !== pt.y) result.push(pt)
  }

  if (startDir === "none" && endDir === "none") {
    push({ x: midX, y: point1.y })
    push({ x: midX, y: point2.y })
  } else if (startDir === "y+" && endDir === "x-") {
    push({ x: point1.x, y: point2.y })
  } else if (startDir === "y-" && endDir === "x-") {
    push({ x: point1.x, y: point1.y - overshootAmount })
    push({ x: midX, y: point1.y - overshootAmount })
    push({ x: midX, y: point2.y })
    push({ x: p2Target.x, y: point2.y })
  } else if (startDir === "x-" && endDir === "x+") {
    push({ x: point1.x - overshootAmount, y: point1.y })
    push({ x: point1.x - overshootAmount, y: midY })
    push({ x: p2Target.x, y: midY })
    push({ x: p2Target.x, y: point2.y })
  } else if (startDir === "y+" && endDir === "y+") {
    push({ x: point1.x, y: p2Target.y })
    push({ x: point2.x, y: p2Target.y })
  } else if (startDir === "y-" && endDir === "x+") {
    push({ x: point1.x, y: point1.y - overshootAmount })
    push({ x: midX, y: point1.y - overshootAmount })
    push({ x: midX, y: midY })
    push({ x: p2Target.x, y: midY })
    push({ x: p2Target.x, y: point2.y })
  } else if (startDir === "y+" && endDir === "x+") {
    push({ x: point1.x, y: midX })
    push({ x: p2Target.x, y: midX })
    push({ x: p2Target.x, y: point2.y })
  } else if (startDir === "x+" && endDir === "y+") {
    push({ x: midX, y: point1.y })
    push({ x: midX, y: p2Target.y })
    push({ x: point2.x, y: p2Target.y })
  } else if (startDir === "y-" && endDir === "y-") {
    push({ x: point1.x, y: point1.y - overshootAmount })
    push({ x: point2.x, y: point1.y - overshootAmount })
  } else if (startDir === "x-" && endDir === "y+") {
    push({ x: point1.x - overshootAmount, y: point1.y })
    push({ x: point1.x - overshootAmount, y: p2Target.y })
    push({ x: point2.x, y: p2Target.y })
  } else if (startDir === "x+" && endDir === "y-") {
    push({ x: point2.x, y: point1.y });
  } else {
    // Fallback to a simple midpoint-based path
    if (startDir.startsWith("x")) {
      push({
        x: point1.x + (startDir === "x+" ? overshootAmount : -overshootAmount),
        y: point1.y,
      })
    } else if (startDir.startsWith("y")) {
      push({
        x: point1.x,
        y: point1.y + (startDir === "y+" ? overshootAmount : -overshootAmount),
      })
    }
    push({ x: midX, y: result[result.length - 1].y })
    push({ x: midX, y: p2Target.y })
    push({ x: p2Target.x, y: p2Target.y })
  }

  push({ x: point2.x, y: point2.y })
  return result
}
