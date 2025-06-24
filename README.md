# directed-elbow-solver

A TypeScript utility that computes "elbow" paths between two points. Each point can optionally declare a facing direction—`"x+"`, `"x-"`, `"y+"`, or `"y-"`—which influences how the path enters or exits the point. This is handy when routing wires or connectors in diagrams.

## Installation

```bash
bun add directed-elbow-solver
```

## Usage

```ts
import { calculateElbow } from "directed-elbow-solver/lib"

const start = { x: 0, y: 0, facingDirection: "x+" }
const end = { x: 100, y: 50, facingDirection: "y-" }

const path = calculateElbow(start, end, { overshoot: 20 })
console.log(path)
// [
//   { x: 0, y: 0 },
//   { x: 20, y: 0 },
//   { x: 20, y: 50 },
//   { x: 100, y: 50 }
// ]
```

`calculateElbow` returns an array of points representing the orthogonal segments from start to end. The optional `overshoot` parameter controls how far the path extends beyond the end point when aligning with its facing direction.

## Testing

Run the test suite with Bun:

```bash
bun test
```

## Demo

An interactive demo is provided in the [`site/`](./site) directory. Open `index.html` in a browser to visualize the algorithm.

## License

MIT
