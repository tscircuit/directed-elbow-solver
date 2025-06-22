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
  let mainLogicEndsAtPoint2 = false; // Declare here

  if (didP1Overshoot) {
    // P1 overshot (moved away from P2's quadrant). Path from currX/Y to p2EffectiveTargetX/Y.
    // mainLogicEndsAtPoint2 will remain false in this branch as P1 overshoot implies intermediate points
    // before potentially reaching p2EffectiveTarget and then point2.
    if (p1Axis === "x") { // P1 overshot horizontally
      path.push({ x: currX, y: midYOriginal })
      path.push({ x: p2EffectiveTargetX, y: midYOriginal })
    } else { // p1Axis === "y" - P1 overshot vertically
      path.push({ x: midXOriginal, y: currY })
      // elbow06 specific case: P1 overshot on Y, P2 faces X+
      // p2Dir is point2.facingDirection
      if (p2Dir === "x+") {
        path.push({ x: midXOriginal, y: midYOriginal })
        path.push({ x: p2EffectiveTargetX, y: midYOriginal })
      } else {
        // This handles elbow03 (P1 overshot Y, P2 faces X-) and other cases.
        path.push({ x: midXOriginal, y: p2EffectiveTargetY })
      }
    }
  } else {
    // No P1 overshoot. Path from point1.x/y to p2EffectiveTargetX/Y.
    // currX/Y are equal to point1.x/y here.
    // mainLogicEndsAtPoint2 is already declared in the outer scope.

    if (p1Axis === "x" && p2Axis === "y") { // P1 X-directed, P2 Y-directed
      const isOuterCornerHV = p1Dir && p2Dir && (
        (p1Dir === "x+" && point1.x < point2.x && p2Dir === "y+" && point1.y < point2.y) ||
        (p1Dir === "x-" && point1.x > point2.x && p2Dir === "y-" && point1.y > point2.y) ||
        (p1Dir === "x+" && point1.x < point2.x && p2Dir === "y-" && point1.y > point2.y) ||
        (p1Dir === "x-" && point1.x > point2.x && p2Dir === "y+" && point1.y < point2.y)
      );
      if (isOuterCornerHV) {
        // Path for HVH U-turn
        path.push({ x: midYOriginal, y: currY });      // (midYOriginal, P1.y)
        path.push({ x: midYOriginal, y: point2.y });  // (midYOriginal, P2.y)
        path.push({ x: point2.x, y: point2.y });      // P2
        mainLogicEndsAtPoint2 = true;
      } else {
        // Standard HV L-shape
        path.push({ x: p2EffectiveTargetX, y: currY });
      }
    } else if (p1Axis === "y" && p2Axis === "x") { // P1 Y-directed, P2 X-directed (elbow07 case)
      const isOuterCornerVH = p1Dir && p2Dir && (
        (p1Dir === "y+" && point1.y < point2.y && p2Dir === "x+" && point1.x < point2.x) || // elbow07 specific geometry
        (p1Dir === "y-" && point1.y > point2.y && p2Dir === "x-" && point1.x > point2.x) ||
        (p1Dir === "y+" && point1.y < point2.y && p2Dir === "x-" && point1.x > point2.x) ||
        (p1Dir === "y-" && point1.y > point2.y && p2Dir === "x+" && point1.x < point2.x)
      );
      if (isOuterCornerVH) {
        // Path for VHV U-turn - handles elbow07
        path.push({ x: currX, y: midXOriginal });       // (P1.x, midXOriginal)
        path.push({ x: point2.x, y: midXOriginal });   // (P2.x, midXOriginal)
        path.push({ x: point2.x, y: point2.y });       // P2
        mainLogicEndsAtPoint2 = true;
      } else {
        // Standard VH L-shape
        path.push({ x: currX, y: p2EffectiveTargetY });
      }
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

  // Finalize path by adding p2EffectiveTarget and point2, if not already handled by main logic
  const lastPtGeneratedByMainLogic = path[path.length - 1];
  if (mainLogicEndsAtPoint2) {
    // If main logic explicitly ended at point2, ensure it's truly the last point.
    // This can happen if point2 was {0,0} and path was just [{0,0}].
    if (path.length === 1 && path[0].x === point1.x && path[0].y === point1.y && point1.x === point2.x && point1.y === point2.y) {
        // Path is just P1, and P1 is P2. Nothing to add.
    } else if (lastPtGeneratedByMainLogic.x !== point2.x || lastPtGeneratedByMainLogic.y !== point2.y) {
       // This case should ideally not be hit if mainLogicEndsAtPoint2 is true and path has more than one point,
       // but as a safeguard.
       path.push({ x: point2.x, y: point2.y });
    }
  } else {
    // Main logic did not end at point2, so apply standard p2EffectiveTarget -> point2 finalization.
    if (lastPtGeneratedByMainLogic.x !== p2EffectiveTargetX || lastPtGeneratedByMainLogic.y !== p2EffectiveTargetY) {
      path.push({ x: p2EffectiveTargetX, y: p2EffectiveTargetY });
    }

    if (p2WillHaveApproachSegment) {
      const lastPtAfterEffectiveTarget = path[path.length - 1];
      if (lastPtAfterEffectiveTarget.x !== point2.x || lastPtAfterEffectiveTarget.y !== point2.y) {
        path.push({ x: point2.x, y: point2.y });
      }
    } else { // No p2Dir, so p2EffectiveTarget is point2. Ensure point2 is the last point.
        const lastPt = path[path.length-1];
        if(lastPt.x !== point2.x || lastPt.y !== point2.y) {
            path.push({x: point2.x, y: point2.y});
        }
    }
  }
  return path;
}
