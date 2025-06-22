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
    let p2OvershootsToo = false
    // These store the coordinate P2 would "retreat" to if it also overshoots.
    let p2OvershotTargetX = finalTargetX
    let p2OvershotTargetY = finalTargetY

    // Check if P2's facing direction warrants an overshoot relative to P1's overshot position
    if (p1Axis === "x" && p2Axis === "x") {
      // P1 overshot horizontally, P2 also faces horizontally.
      // currX is P1's x-coordinate after its overshoot.
      if (p2Dir === "x+" && currX < finalTargetX) {
        p2OvershotTargetX = finalTargetX + overshootAmount
        p2OvershootsToo = true
      } else if (p2Dir === "x-" && currX > finalTargetX) {
        p2OvershotTargetX = finalTargetX - overshootAmount
        p2OvershootsToo = true
      }
    } else if (p1Axis === "y" && p2Axis === "y") {
      // P1 overshot vertically, P2 also faces vertically.
      // currY is P1's y-coordinate after its overshoot.
      if (p2Dir === "y+" && currY < finalTargetY) {
        p2OvershotTargetY = finalTargetY + overshootAmount
        p2OvershootsToo = true
      } else if (p2Dir === "y-" && currY > finalTargetY) {
        p2OvershotTargetY = finalTargetY - overshootAmount
        p2OvershootsToo = true
      }
    }

    if (p2OvershootsToo) {
      // 6-point path: P1, P1_OS, A, B, C, P2
      if (p1Axis === "x") { // P1 overshot horizontally
        path.push({ x: currX, y: midY }) // A: (P1_OS.x, midY)
        path.push({ x: p2OvershotTargetX, y: midY }) // B: (P2_OS_Target.x, midY)
        path.push({ x: p2OvershotTargetX, y: finalTargetY }) // C: (P2_OS_Target.x, P2.y)
      } else { // p1Axis === "y" - P1 overshot vertically
        path.push({ x: midX, y: currY }) // A: (midX, P1_OS.y)
        path.push({ x: midX, y: p2OvershotTargetY }) // B: (midX, P2_OS_Target.y)
        path.push({ x: finalTargetX, y: p2OvershotTargetY }) // C: (P2.x, P2_OS_Target.y)
      }
    } else {
      // 5-point path: P1, P1_OS, A, B, P2 (P2 does not effectively overshoot)
      if (p1Axis === "x") { // P1 overshot horizontally
        path.push({ x: currX, y: midY }) // A
        path.push({ x: finalTargetX, y: midY }) // B
      } else { // p1Axis === 'y' - P1 overshot vertically
        path.push({ x: midX, y: currY }) // A
        path.push({ x: midX, y: finalTargetY }) // B
      }
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
