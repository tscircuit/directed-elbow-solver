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
    if (point1.x > point2.x) {
      //  p1 is right of p2  →  symmetrical “Z” path through the midpoint
      push({ x: midX, y: point1.y })   // horizontal segment, still in p1’s x- direction
      push({ x: midX, y: point2.y })   // vertical segment down/up to p2’s y
      // final horizontal segment into p2 is produced by the common
      //   push({ x: point2.x, y: point2.y })  at the end of the function
    } else {
      // original overshoot solution for the p1-left-of-p2 case
      push({ x: point1.x - overshootAmount, y: point1.y })
      push({ x: point1.x - overshootAmount, y: midY })
      push({ x: p2Target.x, y: midY })
      push({ x: p2Target.x, y: point2.y })
    }
  } else if (startDir === "y+" && endDir === "y+") {
    const commonY = Math.max(point1.y + overshootAmount, p2Target.y)
    push({ x: point1.x, y: commonY })
    push({ x: point2.x, y: commonY })
  } else if (startDir === "y-" && endDir === "x+") {
    const p1OvershotY = point1.y - overshootAmount
    push({ x: point1.x, y: p1OvershotY }) // P1 overshoots in y-
    push({ x: p2Target.x, y: p1OvershotY }) // Align with P2's target X, maintaining P1's overshot Y
    push({ x: p2Target.x, y: point2.y }) // Move to P2's actual Y, maintaining P2's target X
  } else if (startDir === "y+" && endDir === "x+") {
    const p1OvershootY = point1.y + overshootAmount
    push({ x: point1.x, y: p1OvershootY }) // Move along P1's facing direction
    push({ x: p2Target.x, y: p1OvershootY }) // Move horizontally to P2's target X
    push({ x: p2Target.x, y: point2.y }) // Move vertically to P2's actual Y
  } else if (startDir === "x+" && endDir === "y+") {
    // p1(x,y,x+), p2(x',y',y+). p2 expects approach from y > y' (y- segment).
    if (point1.x < point2.x && point1.y > point2.y) {
      // Case like elbow15: simple L-bend
      // Path: (p1.x,p1.y) -> (p2.x,p1.y) -> (p2.x,p2.y)
      // First segment (p1.x,p1.y)->(p2.x,p1.y) is x+ (since p1.x < p2.x).
      // Second segment (p2.x,p1.y)->(p2.x,p2.y) is y- (since p1.y > p2.y).
      // This y- approach matches p2.facingDirection "y+" (which implies approach from y > p2.y).
      push({ x: point2.x, y: point1.y })
    } else if (point1.x === point2.x) {
      // Collinear X, p1 facing x+. Must emerge.
      // Similar to elbow16 logic: overshoot, turn at midY.
      push({ x: point1.x + overshootAmount, y: point1.y })
      push({ x: point1.x + overshootAmount, y: midY })
      push({ x: point2.x, y: midY }) // point2.x is same as point1.x here
    } else {
      // Other cases (includes elbow08 and elbow17)
      // Here, point1.x != point2.x.
      // And !(point1.x < point2.x && point1.y > point2.y)
      if (point1.x < point2.x) {
        // p1 is to the left of p2, facing right (towards p2.x). Like elbow08.
        // Path: p1 -> (midX, p1.y) -> (midX, p2Target.y) -> (p2.x, p2Target.y) -> p2
        push({ x: midX, y: point1.y })
        push({ x: midX, y: p2Target.y })
        push({ x: point2.x, y: p2Target.y })
      } else {
        // point1.x > point2.x. p1 is to the right of p2, facing right (away from p2.x). Like elbow17.
        // Path: p1 -> (p1.x+overshoot, p1.y) -> (p1.x+overshoot, p2Target.y) -> (p2.x, p2Target.y) -> p2
        const p1OvershootX = point1.x + overshootAmount
        push({ x: p1OvershootX, y: point1.y })
        push({ x: p1OvershootX, y: p2Target.y })
        push({ x: point2.x, y: p2Target.y })
      }
    }
  } else if (startDir === "y-" && endDir === "y-") {
    const commonY = Math.min(point1.y - overshootAmount, p2Target.y)
    push({ x: point1.x, y: commonY })
    push({ x: point2.x, y: commonY })
  } else if (startDir === "x+" && endDir === "x+") {
    const commonX = Math.max(point1.x + overshootAmount, p2Target.x)
    push({ x: commonX, y: point1.y })
    push({ x: commonX, y: point2.y })
  } else if (startDir === "x-" && endDir === "x-") {
    const commonX = Math.min(point1.x - overshootAmount, p2Target.x)
    push({ x: commonX, y: point1.y })
    push({ x: commonX, y: point2.y })
  } else if (startDir === "x-" && endDir === "y+") {
    // If point1 is facing "x-" and point2.x is to the left of point1.x,
    // a direct L-bend is possible and preferred.
    if (point1.x > point2.x) {
      // Path: (p1.x,p1.y) -> (p2.x,p1.y) -> (p2.x,p2.y)
      // First segment (p1.x,p1.y) -> (p2.x,p1.y) is "x-", matches startDir.
      // Second segment (p2.x,p1.y) -> (p2.x,p2.y) would be "y-" if p1.y > p2.y (as in elbow14)
      // or "y+" if p1.y < p2.y.
      // If the segment is "y-", this is consistent with endDir="y+" (meaning the path,
      // if it were to continue straight *through* point2, would go in the "y+" direction).
      push({ x: point2.x, y: point1.y })
    } else {
      // point1.x <= point2.x. point1 facing "x-" must overshoot away from point2.x.
      // This handles cases like elbow10.
      push({ x: point1.x - overshootAmount, y: point1.y })
      push({ x: point1.x - overshootAmount, y: p2Target.y })
      push({ x: point2.x, y: p2Target.y })
    }
  } else if (startDir === "x-" && endDir === "y-") {
    // P1 faces "x-", P2 faces "y-" (expects approach from y < p2.y, i.e. a y+ segment)
    if (point1.x > point2.x && point1.y <= point2.y) {
      // Simple L-bend is possible:
      // (p1.x,p1.y) → (p2.x,p1.y) → (p2.x,p2.y)
      push({ x: point2.x, y: point1.y })
    } else {
      // Overshoot / U-turn fallback (existing behaviour)
      const p1OvershotX = point1.x - overshootAmount
      push({ x: p1OvershotX, y: point1.y })       // overshoot along x-
      push({ x: p1OvershotX, y: p2Target.y })     // drop/raise to p2Target.y
      push({ x: p2Target.x, y: p2Target.y })      // move to p2Target.x at that Y
    }
  } else if (startDir === "x+" && endDir === "y-") {
    // p1(x,y,x+), p2(x',y',y-). p2 expects approach from y < y' (y+ segment).
    if (point1.x === point2.x) {
      // Case like elbow16: Collinear X, p1 facing x+. Must emerge.
      // Overshoot, turn at midY.
      push({ x: point1.x + overshootAmount, y: point1.y })
      push({ x: point1.x + overshootAmount, y: midY })
      push({ x: point2.x, y: midY }) // point2.x is same as point1.x here
    } else if (point1.x < point2.x && point1.y < point2.y) {
      // Case like elbow11: simple L-bend
      // Path: (p1.x,p1.y) -> (p2.x,p1.y) -> (p2.x,p2.y)
      // First segment is x+ (since p1.x < p2.x).
      // Second segment is y+ (since p1.y < p2.y).
      // This y+ approach matches p2.facingDirection "y-" (which implies approach from y < p2.y).
      push({ x: point2.x, y: point1.y })
    } else {
      // Default and other complex cases (e.g. p1.x > p2.x or p1.y > p2.y needing U-turns)
      // Path: p1 overshoots, aligns with p2Target.y, then aligns with p2.x.
      push({ x: point1.x + overshootAmount, y: point1.y })
      push({ x: point1.x + overshootAmount, y: p2Target.y }) // p2Target.y = point2.y - overshootAmount
      push({ x: point2.x, y: p2Target.y })
    }
  } else if (startDir === "y-" && endDir === "y+") {
    // Case: p1 faces y- (down), p2 faces y+ (up)
    if (point1.y >= point2.y) {
      // p1 is above or at the same level as p2. (e.g., elbow19)
      // Path: (p1.x, p1.y) -> (p1.x, midY) -> (p2.x, midY) -> (p2.x, p2.y)
      // Segment (p1.x, p1.y) -> (p1.x, midY) is y- because p1.y >= midY. This matches p1.facingDir.
      // Segment (p2.x, midY) -> (p2.x, p2.y) is y- because midY >= p2.y. This approach (from y > p2.y) is valid for p2.facingDir="y+".
      push({ x: point1.x, y: midY })
      push({ x: point2.x, y: midY })
    } else {
      // point1.y < point2.y
      // p1 is below p2. p1 faces y- (down), p2 faces y+ (up).
      // p1 must first move in its facingDirection (y-), then maneuver using midX.
      // Path: p1 -> p1_overshoot_y- -> (midX, p1_overshoot_y-) -> (midX, p2_target_y+) -> (p2.x, p2_target_y+) -> p2
      const p1OvershootY = point1.y - overshootAmount
      push({ x: point1.x, y: p1OvershootY }) // Overshoot along P1's y- direction
      push({ x: midX, y: p1OvershootY }) // Move to midX at p1OvershootY
      push({ x: midX, y: p2Target.y }) // Move to p2Target.y (p2.y + overshoot) at midX
      push({ x: point2.x, y: p2Target.y }) // Align with P2's x-coordinate at p2Target.y
    }
  } else if (startDir === "y+" && endDir === "y-") {
    // Case: p1 faces y+ (up), p2 faces y- (down)
    // p2.facingDirection "y-" means p2 expects approach from y < p2.y (a y+ segment towards p2)
    if (point1.y <= point2.y) {
      // p1 is below or at the same level as p2. (e.g., elbow22)
      // Path: (p1.x, p1.y) -> (p1.x, midY) -> (p2.x, midY) -> (p2.x, p2.y)
      // Segment (p1.x, p1.y) -> (p1.x, midY) is y+ because p1.y <= midY. This matches p1.facingDir.
      // Segment (p2.x, midY) -> (p2.x, p2.y) is y+ because midY <= p2.y. This approach (from y < p2.y) is valid for p2.facingDir="y-".
      push({ x: point1.x, y: midY })
      push({ x: point2.x, y: midY })
    } else {
      // point1.y > point2.y
      // p1 is above p2. p1 faces y+ (up), p2 faces y- (down).
      // p1 must first move in its facingDirection (y+), then maneuver using midX.
      // Path: p1 -> p1_overshoot_y+ -> (midX, p1_overshoot_y+) -> (midX, p2_target_y-) -> (p2.x, p2_target_y-) -> p2
      const p1OvershootY = point1.y + overshootAmount
      push({ x: point1.x, y: p1OvershootY }) // Overshoot along P1's y+ direction
      push({ x: midX, y: p1OvershootY }) // Move to midX at p1OvershootY
      push({ x: midX, y: p2Target.y }) // Move to p2Target.y (p2.y - overshoot for "y-") at midX
      push({ x: point2.x, y: p2Target.y }) // Align with P2's x-coordinate at p2Target.y
    }
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
    push({ x: midX, y: result[result.length - 1]!.y })
    push({ x: midX, y: p2Target.y })
    push({ x: p2Target.x, y: p2Target.y })
  }

  push({ x: point2.x, y: point2.y })
  return result
}
