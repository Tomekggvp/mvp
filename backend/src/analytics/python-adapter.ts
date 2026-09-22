import { spawn } from "node:child_process";
import type { OptimizationResult } from "./optimizer.js";

export function runPythonOptimizer(payload: unknown): Promise<OptimizationResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.PYTHON_BIN ?? "python3", ["analytics/src/optimize_assignments.py"], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { error += chunk; });
    child.on("error", reject);
    child.on("close", (code) => { if (code !== 0) reject(new Error(error || `Python exited with ${code}`)); else resolve(JSON.parse(output) as OptimizationResult); });
    child.stdin.end(JSON.stringify(payload));
  });
}
