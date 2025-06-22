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

  const path: Array<{ x: number; y: number }> = [{ x: point1.x, y: point1.y }]
  let currX = point1.x
  let currY = point1.y
  let didP1Overshoot = false

  const p1Dir = point1.facingDirection
  if (p1Dir === "x+" && point2.x < point1.x) {
    currX += overshootAmount
    didP1Overshoot = true
  } else if (p1Dir === "x-" && point2.x > point1.x) {
    currX -= overshootAmount
    didP1Overshoot = true
  } else if (p1Dir === "y+" && point2.y < point1.y) {
    currY += overshootAmount
    didP1Overshoot = true
  } else if (p1Dir === "y-" && point2.y > point1.y) {
    currY -= overshootAmount
    didP1Overshoot = true
  }

  if (didP1Overshoot) {
    path.push({ x: currX, y: currY })
  }

  const p1Axis = (p1Dir && (p1Dir.startsWith("x") ? "x" : "y")) || null
  const p2Dir = point2.facingDirection
  const p2Axis = (p2Dir && (p2Dir.startsWith("x") ? "x" : "y")) || null

  const finalTargetX = point2.x
  const finalTargetY = point2.y
  const midX = (point1.x + finalTargetX) / 2
  const midY = (point1.y + finalTargetY) / 2

  if (didP1Overshoot) {
    if (p1Axis === "x") {
      // Overshoot was horizontal, next segments form VHV from curr
      path.push({ x: currX, y: midY })
      path.push({ x: finalTargetX, y: midY })
    } else {
      // p1Axis === 'y' (Overshoot was vertical), next segments form HVH from curr
      path.push({ x: midX, y: currY })
      path.push({ x: midX, y: finalTargetY })
    }
  } else {
    // No p1 overshoot
    if (p1Axis === "x" && p2Axis === "y") {
      // HV L-shape
      path.push({ x: finalTargetX, y: currY })
    } else if (p1Axis === "y" && p2Axis === "x") {
      // VH L-shape
      path.push({ x: currX, y: finalTargetY })
    } else if (
      (p1Axis === "x" && p2Axis === "x") ||
      (p1Axis === "x" && !p2Axis) ||
      (!p1Axis && p2Axis === "x") ||
      (!p1Axis && !p2Axis) // Default HVH if no directions or x-dominant
    ) {
      // HVH U-shape
      path.push({ x: midX, y: currY })
      path.push({ x: midX, y: finalTargetY })
    } else {
      // VHV U-shape for (y,y), (y,null), (null,y)
      path.push({ x: currX, y: midY })
      path.push({ x: finalTargetX, y: midY })
    }
  }

  path.push({ x: finalTargetX, y: finalTargetY })

  return path
}
