// This macro reads all test files in the `tests` directory, extracts the `scene` object from each,
// and exports a Record<TestName, Scene> mapping using only regex for parsing.

const { readdirSync, readFileSync } = require("fs")
const path = require("path")

// Helper to extract the scene object from a test file's source code using regex
function extractSceneObject(source: string) {
  // Match: const scene = { ... } as const
  const match = source.match(/const\s+scene\s*=\s*({[\s\S]*?})\s*as\s+const/)
  if (!match) return null
  // Try to parse the object using JSON.parse after some normalization
  let objStr = match[1]!
  // Replace trailing commas and single quotes, and remove comments (very basic)
  objStr = objStr
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // ensure keys are quoted
    .replace(/'/g, '"')
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
  try {
    return JSON.parse(objStr)
  } catch (e) {
    return null
  }
}

// Helper to get the test name from the filename, e.g. elbow27.test.ts -> elbow27
function getTestName(filename) {
  const match = filename.match(/^(.+)\.test\.ts$/)
  return match && match[1] ? match[1] : filename
}

const testsDir = path.join(__dirname, "..", "tests")
const sceneMap = {}

for (const filename of readdirSync(testsDir)) {
  if (!filename.endsWith(".test.ts")) continue
  const filePath = path.join(testsDir, filename)
  const source = readFileSync(filePath, "utf8")
  const scene = extractSceneObject(source)
  if (scene) {
    const testName = getTestName(filename)
    sceneMap[testName] = scene
  }
}

export default sceneMap
