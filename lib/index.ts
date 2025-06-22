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

  // p1Dir is already defined. currX, currY are p1's coordinates after its potential overshoot.
  // didP1Overshoot indicates if p1 overshot.

  // Determine P2's effective target coordinates for path planning
  let p2EffectiveTargetX = point2.x
  let p2EffectiveTargetY = point2.y
  const p2Dir = point2.facingDirection
  let p2WillHaveApproachSegment = false

  if (p2Dir) {
    p2WillHaveApproachSegment = true
    if (p2Dir === "x+") p2EffectiveTargetX += overshootAmount
    else if (p2Dir === "x-") p2EffectiveTargetX -= overshootAmount
    else if (p2Dir === "y+") p2EffectiveTargetY += overshootAmount
    else if (p2Dir === "y-") p2EffectiveTargetY -= overshootAmount
  }

  const p1Axis = (p1Dir && (p1Dir.startsWith("x") ? "x" : "y")) || null
  const p2Axis = (p2Dir && (p2Dir.startsWith("x") ? "x" : "y")) || null

  // Midpoints based on original point1 and point2 coordinates
  const midXOriginal = (point1.x + point2.x) / 2
  const midYOriginal = (point1.y + point2.y) / 2

  if (didP1Overshoot) {
    // P1 overshot (moved away from P2's quadrant). Path from currX/Y to p2EffectiveTargetX/Y.
    if (p1Axis === "x") { // P1 overshot horizontally
      path.push({ x: currX, y: midYOriginal })
      path.push({ x: p2EffectiveTargetX, y: midYOriginal })
    } else { // p1Axis === "y" - P1 overshot vertically
      path.push({ x: midXOriginal, y: currY })
      path.push({ x: midXOriginal, y: p2EffectiveTargetY })
    }
  } else {
    // No P1 overshoot. Path from point1.x/y to p2EffectiveTargetX/Y.
    // currX/Y are equal to point1.x/y here.
    if (p1Axis === "x" && p2Axis === "y") { // HV L-shape
      path.push({ x: p2EffectiveTargetX, y: currY })
    } else if (p1Axis === "y" && p2Axis === "x") { // VH L-shape
      path.push({ x: currX, y: p2EffectiveTargetY })
    } else if (p1Axis === "x" && p2Axis === "x") { // Both X-directed
      const yIntermediate = point2.y - Math.sign(point2.y - point1.y) * overshootAmount
      path.push({ x: midXOriginal, y: currY })
      path.push({ x: midXOriginal, y: yIntermediate })
      path.push({ x: p2EffectiveTargetX, y: yIntermediate })
    } else if (p1Axis === "y" && p2Axis === "y") { // Both Y-directed (elbow05 case)
      const xIntermediate = point2.x - Math.sign(point2.x - point1.x) * overshootAmount
      path.push({ x: currX, y: midYOriginal })
      path.push({ x: xIntermediate, y: midYOriginal })
      path.push({ x: xIntermediate, y: p2EffectiveTargetY })
    } else if ( // Default HVH U-shape
      (p1Axis === "x" && !p2Axis) ||
      (!p1Axis && p2Axis === "x") ||
      (!p1Axis && !p2Axis)
    ) {
      path.push({ x: midXOriginal, y: currY })
      path.push({ x: midXOriginal, y: p2EffectiveTargetY })
    } else { // Default VHV U-shape (covers (y,null), (null,y))
      path.push({ x: currX, y: midYOriginal })
      path.push({ x: p2EffectiveTargetX, y: midYOriginal })
    }
  }

  // Add p2EffectiveTarget to the path if it's not already the last point
  const lastPtBeforeEffective = path[path.length - 1]
  if (lastPtBeforeEffective.x !== p2EffectiveTargetX || lastPtBeforeEffective.y !== p2EffectiveTargetY) {
    path.push({ x: p2EffectiveTargetX, y: p2EffectiveTargetY })
  }

  // If P2 has a facing direction, add the final P2 point (handles the approach segment)
  if (p2WillHaveApproachSegment) {
    const lastPtBeforeFinal = path[path.length - 1]
    // Only add point2 if it's different from p2EffectiveTarget (i.e., overshootAmount was non-zero)
    if (lastPtBeforeFinal.x !== point2.x || lastPtBeforeFinal.y !== point2.y) {
      path.push({ x: point2.x, y: point2.y })
    }
  }
  // If !p2WillHaveApproachSegment, p2EffectiveTarget is point2, which should be the last point.

  return path
}
