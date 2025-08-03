export interface ElbowPoint {
  x: number
  y: number
  facingDirection?: "x+" | "x-" | "y+" | "y-"
}

export const calculateElbowBends = (
  p1: ElbowPoint,
  p2: ElbowPoint,
  overshootAmount: number,
): Array<{ x: number; y: number }> => {
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
      push({ x: p1.x, y: p2.y })
    } else {
      const p1OvershootY = p1.y - overshootAmount
      push({ x: p1.x, y: p1OvershootY })
      push({ x: midX, y: p1OvershootY })
      push({ x: midX, y: p2.y })
      push({ x: p2Target.x, y: p2.y })
    }
  } else if (startDir === "x-" && endDir === "x+") {
    if (p1.x > p2.x) {
      push({ x: midX, y: p1.y })
      push({ x: midX, y: p2.y })
    } else {
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
      push({ x: p1.x, y: p2.y })
      push({ x: p2.x, y: p2.y })
    } else {
      const p1OvershotY = p1.y - overshootAmount
      push({ x: p1.x, y: p1OvershotY })
      push({ x: p2Target.x, y: p1OvershotY })
      push({ x: p2Target.x, y: p2.y })
    }
  } else if (startDir === "y+" && endDir === "x+") {
    if (p1.x > p2.x && p1.y < p2.y) {
      push({ x: p1.x, y: p2.y })
      push({ x: p2.x, y: p2.y })
    } else {
      const p1OvershootY = p1.y + overshootAmount
      push({ x: p1.x, y: p1OvershootY })
      if (p1.x > p2.x && p1.y >= p2.y) {
        push({ x: midX, y: p1OvershootY })
        push({ x: midX, y: p2.y })
      } else {
        push({ x: p2Target.x, y: p1OvershootY })
        push({ x: p2Target.x, y: p2.y })
      }
    }
  } else if (startDir === "x+" && endDir === "y+") {
    if (p1.x > p2.x && p1.y < p2.y) {
      push({ x: p1.x, y: p2.y })
      push({ x: p2.x, y: p2.y })
    } else if (p1.x < p2.x && p1.y > p2.y) {
      push({ x: p2.x, y: p1.y })
    } else if (p1.x === p2.x) {
      push({ x: p1.x + overshootAmount, y: p1.y })
      push({ x: p1.x + overshootAmount, y: midY })
      push({ x: p2.x, y: midY })
    } else {
      if (p1.x < p2.x) {
        push({ x: midX, y: p1.y })
        push({ x: midX, y: p2Target.y })
        push({ x: p2.x, y: p2Target.y })
      } else {
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
    if (p1.x > p2.x && p1.y > p2.y) {
      push({ x: p2.x, y: p1.y })
    } else if (p1.x > p2.x && p1.y < p2.y) {
      const p1OvershootX = p1.x - overshootAmount
      push({ x: p1OvershootX, y: p1.y })
      push({ x: p1OvershootX, y: p2Target.y })
      push({ x: p2.x, y: p2Target.y })
    } else {
      const p1OvershootX = p1.x - overshootAmount
      push({ x: p1OvershootX, y: p1.y })
      push({ x: p1OvershootX, y: p2Target.y })
      push({ x: p2.x, y: p2Target.y })
    }
  } else if (startDir === "x-" && endDir === "y-") {
    if (p1.x > p2.x && p1.y <= p2.y) {
      push({ x: p2.x, y: p1.y })
    } else {
      const p1OvershotX = p1.x - overshootAmount
      push({ x: p1OvershotX, y: p1.y })
      push({ x: p1OvershotX, y: p2Target.y })
      push({ x: p2Target.x, y: p2Target.y })
    }
  } else if (startDir === "x+" && endDir === "y-") {
    if (p1.x === p2.x) {
      push({ x: p1.x + overshootAmount, y: p1.y })
      push({ x: p1.x + overshootAmount, y: midY })
      push({ x: p2.x, y: midY })
    } else if (p1.x < p2.x && p1.y < p2.y) {
      push({ x: p2.x, y: p1.y })
    } else {
      push({ x: p1.x + overshootAmount, y: p1.y })
      push({ x: p1.x + overshootAmount, y: p2Target.y })
      push({ x: p2.x, y: p2Target.y })
    }
  } else if (startDir === "y-" && endDir === "y+") {
    if (p1.y >= p2.y) {
      push({ x: p1.x, y: midY })
      push({ x: p2.x, y: midY })
    } else {
      const p1OvershootY = p1.y - overshootAmount
      push({ x: p1.x, y: p1OvershootY })
      push({ x: midX, y: p1OvershootY })
      push({ x: midX, y: p2Target.y })
      push({ x: p2.x, y: p2Target.y })
    }
  } else if (startDir === "y+" && endDir === "y-") {
    if (p1.y <= p2.y) {
      push({ x: p1.x, y: midY })
      push({ x: p2.x, y: midY })
    } else {
      const p1OvershootY = p1.y + overshootAmount
      push({ x: p1.x, y: p1OvershootY })
      push({ x: midX, y: p1OvershootY })
      push({ x: midX, y: p2Target.y })
      push({ x: p2.x, y: p2Target.y })
    }
  } else {
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
  return result
}