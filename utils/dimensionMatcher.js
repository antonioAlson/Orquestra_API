/** Allowed tolerance when comparing plate dimensions (meters). */
const TOLERANCE_M = 0.015; // ±15 mm

/**
 * Parse a dimension string into a metric object.
 * Accepts format "1.60x3.00" → { width: 1.60, height: 3.00 } (meters).
 *
 * @param {string | undefined | null} dimStr
 * @returns {{ width: number, height: number } | null}
 */
export function parseDimension(dimStr) {
  if (!dimStr) return null;
  const parts = String(dimStr).split('x').map(Number);
  if (
    parts.length !== 2 ||
    parts.some(n => !Number.isFinite(n) || n <= 0)
  ) {
    return null;
  }
  return { width: parts[0], height: parts[1] };
}

/**
 * Check whether a cutting plan's plate matches the target dimension.
 * plate_width and plate_height are stored in the DB in millimeters.
 *
 * @param {import('../services/mirrorProjectRepository.js').DbCuttingPlan} plan
 * @param {{ width: number, height: number }} target - meters
 * @returns {boolean}
 */
export function planMatchesDimension(plan, target) {
  const pw = Number(plan.plate_width) / 1000;
  const ph = Number(plan.plate_height) / 1000;
  return (
    Math.abs(pw - target.width) <= TOLERANCE_M &&
    Math.abs(ph - target.height) <= TOLERANCE_M
  );
}

/**
 * Filter an array of cutting plans to those matching the target dimension.
 *
 * @param {import('../services/mirrorProjectRepository.js').DbCuttingPlan[]} plans
 * @param {{ width: number, height: number }} target
 * @returns {import('../services/mirrorProjectRepository.js').DbCuttingPlan[]}
 */
export function filterPlansByDimension(plans, target) {
  return plans.filter(p => planMatchesDimension(p, target));
}

/**
 * Format a dimension object as a human-readable string.
 * @param {{ width: number, height: number }} dim
 * @returns {string} e.g. "1,60m × 3,00m"
 */
export function formatDimension(dim) {
  return `${dim.width.toFixed(2).replace('.', ',')}m × ${dim.height.toFixed(2).replace('.', ',')}m`;
}
