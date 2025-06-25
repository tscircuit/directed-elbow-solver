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

  // --- helpers for canonical transform and direction handling ---
  type Dir = "x+" | "x-" | "y+" | "y-" | "none"
  interface Pt { x: number; y: number }

  // apply / undo the (swap XY, reflect-X) canonical transform
  const applyTransform = (p: Pt, swap: boolean, reflX: boolean): Pt => {
    const x =  swap ? p.y : p.x
    const y =  swap ? p.x : p.y
    return { x: reflX ? -x : x, y }
  }
  const invertTransform = (p: Pt, swap: boolean, reflX: boolean): Pt =>
    applyTransform({
      x: reflX ? -p.x : p.x,
      y: p.y,
    }, swap, false)

  // direction ⇄ vector helpers
  const dirToVec = (d: Dir): Pt =>
    d === "x+" ? { x: 1, y: 0 } :
    d === "x-" ? { x: -1, y: 0 } :
    d === "y+" ? { x: 0, y: 1 } :
    d === "y-" ? { x: 0, y: -1 } :
    { x: 0, y: 0 }
  const vecToDir = (v: Pt): Dir =>
    v.x ===  1 ? "x+" :
    v.x === -1 ? "x-" :
    v.y ===  1 ? "y+" :
    v.y === -1 ? "y-" :
    "none"
  const transformDir = (d: Dir, swap: boolean, reflX: boolean): Dir =>
    vecToDir(applyTransform(dirToVec(d), swap, reflX))

  // --- canonical transform setup ---
  const startDirRaw: Dir = point1.facingDirection ?? "none"
  let swap = false, refl = false

  switch (startDirRaw) {
    case "x+"   : console.log("startDirRaw: x+"); break
    case "x-"   : console.log("startDirRaw: x-, setting refl=true"); refl = true; break
    case "y+"   : console.log("startDirRaw: y+, setting swap=true"); swap = true; break
    case "y-"   : console.log("startDirRaw: y-, setting swap=true, refl=true"); swap = true; refl = true; break
    case "none" : console.log("startDirRaw: none"); break
  }

  const p1 = applyTransform(point1, swap, refl)
  const p2 = applyTransform(point2, swap, refl)
  const endDir = transformDir(point2.facingDirection ?? "none", swap, refl)

  // --- compute p2's effective (overshot) target in canonical space ---
  const p2Target: Pt = { ...p2 }
  console.log("Initial p2Target:", JSON.stringify(p2Target), "endDir:", endDir, "overshootAmount:", overshootAmount);
  switch (endDir) {
    case "x+" : p2Target.x += overshootAmount; console.log("endDir: x+, p2Target.x updated to:", p2Target.x); break
    case "x-" : p2Target.x -= overshootAmount; console.log("endDir: x-, p2Target.x updated to:", p2Target.x); break
    case "y+" : p2Target.y += overshootAmount; console.log("endDir: y+, p2Target.y updated to:", p2Target.y); break
    case "y-" : p2Target.y -= overshootAmount; console.log("endDir: y-, p2Target.y updated to:", p2Target.y); break
    default: console.log("endDir: none or unhandled case"); break;
  }

  // --- build path in canonical space ---
  const canonical: Pt[] = [ { x: p1.x, y: p1.y } ]

  if (p2Target.x >= p1.x) {
    // simple L-bend :  H ➜ V
    console.log("Path type: simple L-bend (p2Target.x >= p1.x)");
    canonical.push({ x: p2Target.x, y: p1.y })
  } else {
    // need to detour right first (H-V-H)
    // need to detour right first (H-V-H-V)
    console.log("Path type: detour (p2Target.x < p1.x)");
    const midX = p1.x + overshootAmount
    const newY = (p1.y + p2Target.y) / 2
    console.log(`Detour intermediate turn: midX=${midX}, newY=${newY} (p1.y=${p1.y}, p2Target.y=${p2Target.y})`);

    canonical.push({ x: midX, y: p1.y })        // Point after 1st H segment
    canonical.push({ x: midX, y: newY })        // Point after 1st V segment
    canonical.push({ x: p2Target.x, y: newY })  // Point after 2nd H segment
  }
  canonical.push({ x: p2Target.x, y: p2Target.y })
  canonical.push({ x: p2.x,        y: p2.y        })

  // --- post-process: remove duplicates and collinear middles, invert transform ---
  const cleaned: Pt[] = []
  const push = (pt: Pt) => {
    const last = cleaned[cleaned.length - 1]
    if (!last || last.x !== pt.x || last.y !== pt.y) cleaned.push(pt)
  }

  canonical.forEach(push)

  // drop middle point if three consecutive points are collinear
  for (let i = cleaned.length - 3; i >= 1; i--) {
    const a = cleaned[i - 1], b = cleaned[i], c = cleaned[i + 1]
    if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y))
      cleaned.splice(i, 1)
  }

  return cleaned.map(pt => invertTransform(pt, swap, refl))
}
