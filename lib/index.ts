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
  let p1 = point1
  let p2 = point2
  let flipped = false

  if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
    flipped = true
    ;[p1, p2] = [p2, p1]
  }

  const overshootAmount =
    options?.overshoot ??
    0.1 * Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y))

  const result: Array<{ x: number; y: number }> = [{ x: p1.x, y: p1.y }]

  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2

  const p2Target = { x: p2.x, y: p2.y }
  switch (p2.facingDirection) {
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

  const startDir = p1.facingDirection ?? "none"
  const endDir = p2.facingDirection ?? "none"

  const push = (pt: { x: number; y: number }) => {
    const last = result[result.length - 1]!
    if (last.x !== pt.x || last.y !== pt.y) result.push(pt)
  }

  if (startDir === "none" && endDir === "none") {
    push({ x: midX, y: p1.y })
    push({ x: midX, y: p2.y })
  } else if (startDir === "y+" && endDir === "x-") {
    push({ x: p1.x, y: p2.y })
  } else if (startDir === "y-" && endDir === "x-") {
    if (p1.y >= p2.y) {
      // p1 is above (or level with) p2 → simple “L” path:
      // (p1.x,p1.y) → (p1.x,p2.y) → (p2.x,p2.y)
      push({ x: p1.x, y: p2.y })
    } else {
      // fallback: original overshoot / U-turn strategy
      const p1OvershootY = p1.y - overshootAmount
      push({ x: p1.x, y: p1OvershootY })
      push({ x: midX, y: p1OvershootY })
      push({ x: midX, y: p2.y })
      push({ x: p2Target.x, y: p2.y })
    }
  } else if (startDir === "x-" && endDir === "x+") {
    if (p1.x > p2.x) {
      //  p1 is right of p2  →  symmetrical “Z” path through the midpoint
      push({ x: midX, y: p1.y }) // horizontal segment, still in p1’s x- direction
      push({ x: midX, y: p2.y }) // vertical segment down/up to p2’s y
      // final horizontal segment into p2 is produced by the common
      //   push({ x: p2.x, y: p2.y })  at the end of the function
    } else {
      // original overshoot solution for the p1-left-of-p2 case
      push({ x: p1.x - overshootAmount, y: p1.y })
      push({ x: p1.x - overshootAmount, y: midY })
      push({ x: p2Target.x, y: midY })
      push({ x: p2Target.x, y: p2.y })
    }
  } else if (startDir === "y+" && endDir === "y+") {
    const commonY = Math.max(p1.y + overshootAmount, p2Target.y)
    push({ x: p1.x, y: commonY })
    push({ x: p2.x, y: commonY })
  } else if (startDir === "y-" && endDir === "x+") {
    if (p1.x > p2.x && p1.y >= p2.y) {
      // Simple vertical-then-horizontal “L” (case elbow26)
      push({ x: p1.x, y: p2.y })
      push({ x: p2.x, y: p2.y })
    } else {
      // existing overshoot / U-turn fallback
      const p1OvershotY = p1.y - overshootAmount
      push({ x: p1.x, y: p1OvershotY })
      push({ x: p2Target.x, y: p1OvershotY })
      push({ x: p2Target.x, y: p2.y })
    }
  } else if (startDir === "y+" && endDir === "x+") {
    if (p1.x > p2.x && p1.y < p2.y) {
      // Simple vertical-then-horizontal “L” path (elbow27):
      // (p1.x,p1.y) → (p1.x,p2.y) → (p2.x,p2.y)
      push({ x: p1.x, y: p2.y })
      push({ x: p2.x, y: p2.y })
    } else {
      const p1OvershootY = p1.y + overshootAmount
      push({ x: p1.x, y: p1OvershootY })
      if (p1.x > p2.x && p1.y >= p2.y) {
        // p1 is to the right of p2; route through the midpoint to
        // approach p2 from its x+ side without overshooting past it
        push({ x: midX, y: p1OvershootY })
        push({ x: midX, y: p2.y })
      } else {
        // Existing overshoot / U-turn strategy
        push({ x: p2Target.x, y: p1OvershootY })
        push({ x: p2Target.x, y: p2.y })
      }
    }
  } else if (startDir === "x+" && endDir === "y+") {
    if (p1.x > p2.x && p1.y < p2.y) {
      // Simple vertical-then-horizontal “L” (case elbow27)
      push({ x: p1.x, y: p2.y })
      push({ x: p2.x, y: p2.y })
    } else if (p1.x < p2.x && p1.y > p2.y) {
      // Case like elbow15: simple L-bend
      // Path: (p1.x,p1.y) -> (p2.x,p1.y) -> (p2.x,p2.y)
      // First segment (p1.x,p1.y)->(p2.x,p1.y) is x+ (since p1.x < p2.x).
      // Second segment (p2.x,p1.y)->(p2.x,p2.y) is y- (since p1.y > p2.y).
      // This y- approach matches p2.facingDirection "y+" (which implies approach from y > p2.y).
      push({ x: p2.x, y: p1.y })
    } else if (p1.x === p2.x) {
      // Collinear X, p1 facing x+. Must emerge.
      // Similar to elbow16 logic: overshoot, turn at midY.
      push({ x: p1.x + overshootAmount, y: p1.y })
      push({ x: p1.x + overshootAmount, y: midY })
      push({ x: p2.x, y: midY }) // p2.x is same as p1.x here
    } else {
      // Other cases (includes elbow08 and elbow17)
      // Here, p1.x != p2.x.
      // And !(p1.x < p2.x && p1.y > p2.y)
      if (p1.x < p2.x) {
        // p1 is to the left of p2, facing right (towards p2.x). Like elbow08.
        // Path: p1 -> (midX, p1.y) -> (midX, p2Target.y) -> (p2.x, p2Target.y) -> p2
        push({ x: midX, y: p1.y })
        push({ x: midX, y: p2Target.y })
        push({ x: p2.x, y: p2Target.y })
      } else {
        // p1.x > p2.x. p1 is to the right of p2, facing right (away from p2.x). Like elbow17.
        // Path: p1 -> (p1.x+overshoot, p1.y) -> (p1.x+overshoot, p2Target.y) -> (p2.x, p2Target.y) -> p2
        const p1OvershootX = p1.x + overshootAmount
        push({ x: p1OvershootX, y: p1.y })
        push({ x: p1OvershootX, y: p2Target.y })
        push({ x: p2.x, y: p2Target.y })
      }
    }
  } else if (startDir === "y-" && endDir === "y-") {
    const commonY = Math.min(p1.y - overshootAmount, p2Target.y)
    push({ x: p1.x, y: commonY })
    push({ x: p2.x, y: commonY })
  } else if (startDir === "x+" && endDir === "x+") {
    const commonX = Math.max(p1.x + overshootAmount, p2Target.x)
    push({ x: commonX, y: p1.y })
    push({ x: commonX, y: p2.y })
  } else if (startDir === "x-" && endDir === "x-") {
    const commonX = Math.min(p1.x - overshootAmount, p2Target.x)
    push({ x: commonX, y: p1.y })
    push({ x: commonX, y: p2.y })
  } else if (startDir === "x-" && endDir === "y+") {
    // When p1 faces left (x-) and p2 expects an approach from below (y+)
    // we can sometimes take a simple L bend. Otherwise, use an overshoot/U-turn
    // similar to the logic for the mirrored x+ → y+ case.
    if (p1.x > p2.x && p1.y > p2.y) {
      // p1 is right of and below p2 → direct L-bend preferred
      // Path: (p1.x,p1.y) -> (p2.x,p1.y) -> (p2.x,p2.y)
      push({ x: p2.x, y: p1.y })
    } else if (p1.x > p2.x && p1.y < p2.y) {
      // p1 is right of and above p2. Mirror of elbow08: overshoot then approach
      const p1OvershootX = p1.x - overshootAmount
      push({ x: p1OvershootX, y: p1.y })
      push({ x: p1OvershootX, y: p2Target.y })
      push({ x: p2.x, y: p2Target.y })
    } else {
      // p1.x <= p2.x. p1 must move further left before turning
      // Handles cases like elbow10.
      const p1OvershootX = p1.x - overshootAmount
      push({ x: p1OvershootX, y: p1.y })
      push({ x: p1OvershootX, y: p2Target.y })
      push({ x: p2.x, y: p2Target.y })
    }
  } else if (startDir === "x-" && endDir === "y-") {
    // P1 faces "x-", P2 faces "y-" (expects approach from y < p2.y, i.e. a y+ segment)
    if (p1.x > p2.x && p1.y <= p2.y) {
      // Simple L-bend is possible:
      // (p1.x,p1.y) → (p2.x,p1.y) → (p2.x,p2.y)
      push({ x: p2.x, y: p1.y })
    } else {
      // Overshoot / U-turn fallback (existing behaviour)
      const p1OvershotX = p1.x - overshootAmount
      push({ x: p1OvershotX, y: p1.y }) // overshoot along x-
      push({ x: p1OvershotX, y: p2Target.y }) // drop/raise to p2Target.y
      push({ x: p2Target.x, y: p2Target.y }) // move to p2Target.x at that Y
    }
  } else if (startDir === "x+" && endDir === "y-") {
    // p1(x,y,x+), p2(x',y',y-). p2 expects approach from y < y' (y+ segment).
    if (p1.x === p2.x) {
      // Case like elbow16: Collinear X, p1 facing x+. Must emerge.
      // Overshoot, turn at midY.
      push({ x: p1.x + overshootAmount, y: p1.y })
      push({ x: p1.x + overshootAmount, y: midY })
      push({ x: p2.x, y: midY }) // p2.x is same as p1.x here
    } else if (p1.x < p2.x && p1.y < p2.y) {
      // Case like elbow11: simple L-bend
      // Path: (p1.x,p1.y) -> (p2.x,p1.y) -> (p2.x,p2.y)
      // First segment is x+ (since p1.x < p2.x).
      // Second segment is y+ (since p1.y < p2.y).
      // This y+ approach matches p2.facingDirection "y-" (which implies approach from y < p2.y).
      push({ x: p2.x, y: p1.y })
    } else {
      // Default and other complex cases (e.g. p1.x > p2.x or p1.y > p2.y needing U-turns)
      // Path: p1 overshoots, aligns with p2Target.y, then aligns with p2.x.
      push({ x: p1.x + overshootAmount, y: p1.y })
      push({ x: p1.x + overshootAmount, y: p2Target.y }) // p2Target.y = p2.y - overshootAmount
      push({ x: p2.x, y: p2Target.y })
    }
  } else if (startDir === "y-" && endDir === "y+") {
    // Case: p1 faces y- (down), p2 faces y+ (up)
    if (p1.y >= p2.y) {
      // p1 is above or at the same level as p2. (e.g., elbow19)
      // Path: (p1.x, p1.y) -> (p1.x, midY) -> (p2.x, midY) -> (p2.x, p2.y)
      // Segment (p1.x, p1.y) -> (p1.x, midY) is y- because p1.y >= midY. This matches p1.facingDir.
      // Segment (p2.x, midY) -> (p2.x, p2.y) is y- because midY >= p2.y. This approach (from y > p2.y) is valid for p2.facingDir="y+".
      push({ x: p1.x, y: midY })
      push({ x: p2.x, y: midY })
    } else {
      // p1.y < p2.y
      // p1 is below p2. p1 faces y- (down), p2 faces y+ (up).
      // p1 must first move in its facingDirection (y-), then maneuver using midX.
      // Path: p1 -> p1_overshoot_y- -> (midX, p1_overshoot_y-) -> (midX, p2_target_y+) -> (p2.x, p2_target_y+) -> p2
      const p1OvershootY = p1.y - overshootAmount
      push({ x: p1.x, y: p1OvershootY }) // Overshoot along P1's y- direction
      push({ x: midX, y: p1OvershootY }) // Move to midX at p1OvershootY
      push({ x: midX, y: p2Target.y }) // Move to p2Target.y (p2.y + overshoot) at midX
      push({ x: p2.x, y: p2Target.y }) // Align with P2's x-coordinate at p2Target.y
    }
  } else if (startDir === "y+" && endDir === "y-") {
    // Case: p1 faces y+ (up), p2 faces y- (down)
    // p2.facingDirection "y-" means p2 expects approach from y < p2.y (a y+ segment towards p2)
    if (p1.y <= p2.y) {
      // p1 is below or at the same level as p2. (e.g., elbow22)
      // Path: (p1.x, p1.y) -> (p1.x, midY) -> (p2.x, midY) -> (p2.x, p2.y)
      // Segment (p1.x, p1.y) -> (p1.x, midY) is y+ because p1.y <= midY. This matches p1.facingDir.
      // Segment (p2.x, midY) -> (p2.x, p2.y) is y+ because midY <= p2.y. This approach (from y < p2.y) is valid for p2.facingDir="y-".
      push({ x: p1.x, y: midY })
      push({ x: p2.x, y: midY })
    } else {
      // p1.y > p2.y
      // p1 is above p2. p1 faces y+ (up), p2 faces y- (down).
      // p1 must first move in its facingDirection (y+), then maneuver using midX.
      // Path: p1 -> p1_overshoot_y+ -> (midX, p1_overshoot_y+) -> (midX, p2_target_y-) -> (p2.x, p2_target_y-) -> p2
      const p1OvershootY = p1.y + overshootAmount
      push({ x: p1.x, y: p1OvershootY }) // Overshoot along P1's y+ direction
      push({ x: midX, y: p1OvershootY }) // Move to midX at p1OvershootY
      push({ x: midX, y: p2Target.y }) // Move to p2Target.y (p2.y - overshoot for "y-") at midX
      push({ x: p2.x, y: p2Target.y }) // Align with P2's x-coordinate at p2Target.y
    }
  } else {
    // Fallback to a simple midpoint-based path
    if (startDir.startsWith("x")) {
      push({
        x: p1.x + (startDir === "x+" ? overshootAmount : -overshootAmount),
        y: p1.y,
      })
    } else if (startDir.startsWith("y")) {
      push({
        x: p1.x,
        y: p1.y + (startDir === "y+" ? overshootAmount : -overshootAmount),
      })
    }
    push({ x: midX, y: result[result.length - 1]!.y })
    push({ x: midX, y: p2Target.y })
    push({ x: p2Target.x, y: p2Target.y })
  }

  push({ x: p2.x, y: p2.y })
  return flipped ? result.reverse() : result
}
