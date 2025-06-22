import React, { useState, useEffect, useRef, useCallback } from "react"
import { createRoot } from "react-dom/client"
import { calculateElbow, type ElbowPoint } from "../lib"

const SVG_WIDTH = 600
const SVG_HEIGHT = 400
const POINT_RADIUS = 8
const ARROW_LENGTH = 20

type FacingDirectionOption = ElbowPoint["facingDirection"] | "none"

const App: React.FC = () => {
  const [point1, setPoint1] = useState<ElbowPoint>({
    x: 100,
    y: 100,
    facingDirection: "x+",
  })
  const [point2, setPoint2] = useState<ElbowPoint>({
    x: 300,
    y: 200,
    facingDirection: "y-",
  })
  const [path, setPath] = useState<Array<{ x: number; y: number }>>([])
  const [draggingPoint, setDraggingPoint] = useState<"point1" | "point2" | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const p1ToUse = { ...point1, facingDirection: point1.facingDirection === "none" ? undefined : point1.facingDirection }
    const p2ToUse = { ...point2, facingDirection: point2.facingDirection === "none" ? undefined : point2.facingDirection }
    const newPath = calculateElbow(p1ToUse, p2ToUse)
    setPath(newPath)
  }, [point1, point2])

  const getSVGCoordinates = (event: React.MouseEvent): { x: number; y: number } => {
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect()
      return {
        x: event.clientX - svgRect.left,
        y: SVG_HEIGHT - (event.clientY - svgRect.top), // Invert Y for Cartesian
      }
    }
    return { x: 0, y: 0 }
  }

  const handleMouseDown = (pointId: "point1" | "point2", event: React.MouseEvent) => {
    event.preventDefault()
    setDraggingPoint(pointId)
  }

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!draggingPoint || !svgRef.current) return
    const { x, y } = getSVGCoordinates(event as unknown as React.MouseEvent) // Cast needed for global MouseEvent
    
    const updateFn = draggingPoint === "point1" ? setPoint1 : setPoint2
    updateFn((prevPoint) => ({ ...prevPoint, x, y }))
  }, [draggingPoint])

  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null)
  }, [])

  useEffect(() => {
    if (draggingPoint) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggingPoint, handleMouseMove, handleMouseUp])


  const handleDirectionChange = (
    pointId: "point1" | "point2",
    direction: FacingDirectionOption,
  ) => {
    const updateFn = pointId === "point1" ? setPoint1 : setPoint2
    updateFn((prevPoint) => ({
      ...prevPoint,
      facingDirection: direction === "none" ? undefined : direction,
    }))
  }

  const renderArrow = (point: ElbowPoint) => {
    if (!point.facingDirection || point.facingDirection === "none") return null
    let x2 = point.x
    let y2 = point.y
    switch (point.facingDirection) {
      case "x+": x2 += ARROW_LENGTH; break
      case "x-": x2 -= ARROW_LENGTH; break
      case "y+": y2 += ARROW_LENGTH; break
      case "y-": y2 -= ARROW_LENGTH; break
    }
    return <line x1={point.x} y1={point.y} x2={x2} y2={y2} stroke="blue" strokeWidth="2" markerEnd="url(#arrowhead)" />
  }

  const directionOptions: FacingDirectionOption[] = ["none", "x+", "x-", "y+", "y-"]

  return (
    <div>
      <div className="controls">
        <div className="control-group">
          <label htmlFor="p1-direction">Point 1 Direction:</label>
          <select
            id="p1-direction"
            value={point1.facingDirection || "none"}
            onChange={(e) => handleDirectionChange("point1", e.target.value as FacingDirectionOption)}
          >
            {directionOptions.map(dir => <option key={dir} value={dir}>{dir}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="p2-direction">Point 2 Direction:</label>
          <select
            id="p2-direction"
            value={point2.facingDirection || "none"}
            onChange={(e) => handleDirectionChange("point2", e.target.value as FacingDirectionOption)}
          >
            {directionOptions.map(dir => <option key={dir} value={dir}>{dir}</option>)}
          </select>
        </div>
      </div>

      <svg ref={svgRef} width={SVG_WIDTH} height={SVG_HEIGHT}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" preserveAspectRatio="none">
            {/* preserveAspectRatio="none" might be needed if marker scales unexpectedly due to parent transform */}
            <polygon points="0 0, 10 3.5, 0 7" fill="blue" />
          </marker>
        </defs>
        {/* Apply Cartesian coordinate system transform */}
        <g transform={`translate(0, ${SVG_HEIGHT}) scale(1, -1)`}>
          {/* Path */}
          {path.length > 1 && (
            <polyline
              points={path.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="black"
              strokeWidth="2"
            />
          )}

          {/* Points */}
          {[point1, point2].map((p, index) => (
            <g key={index}>
              <circle
                cx={p.x}
                cy={p.y}
                r={POINT_RADIUS}
                fill={draggingPoint === (index === 0 ? "point1" : "point2") ? "red" : "orange"}
                onMouseDown={(e) => handleMouseDown(index === 0 ? "point1" : "point2", e)}
                style={{ cursor: "grab" }}
                // Vector-effect non-scaling-stroke might be useful if stroke width is affected by scale
                // vectorEffect="non-scaling-stroke" 
              />
              {renderArrow(p)}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

const container = document.getElementById("root")
if (container) {
  const root = createRoot(container)
  root.render(<React.StrictMode><App /></React.StrictMode>)
}
