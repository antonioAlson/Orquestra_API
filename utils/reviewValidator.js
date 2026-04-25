/**
 * Issue codes surfaced to the user in the Mirrors module.
 * Kept as a frozen object so callers can reference codes without magic strings.
 */
export const ISSUE = Object.freeze({
  NO_ATTACHMENT: 'NO_ATTACHMENT', // plan has no infoproject attachment
  NO_LABELING:   'NO_LABELING',   // plan.reviews.labeling !== true
  NO_CUTTING:    'NO_CUTTING',    // plan.reviews.cutting !== true
});

/**
 * Validate a single cutting plan and return the list of issue codes found.
 *
 * A plan is "complete" when:
 *   1. It has an attachment of type "infoproject"
 *   2. reviews.labeling === true
 *   3. reviews.cutting  === true
 *
 * Other review fields (ki_Layout, nesting_report, folder_template) are recorded
 * in the database but are not required for OS generation readiness.
 *
 * @param {import('../services/mirrorProjectRepository.js').DbCuttingPlan} plan
 * @returns {string[]} Ordered issue code array (empty = plan is ready)
 */
export function validatePlan(plan) {
  const issues = [];
  const attachments = Array.isArray(plan.attachments) ? plan.attachments : [];
  const reviews = (plan.reviews && typeof plan.reviews === 'object') ? plan.reviews : {};

  if (!attachments.some(a => a.type === 'infoproject')) {
    issues.push(ISSUE.NO_ATTACHMENT);
  }

  if (!reviews.labeling) {
    issues.push(ISSUE.NO_LABELING);
  }

  if (!reviews.cutting) {
    issues.push(ISSUE.NO_CUTTING);
  }

  return issues;
}

/**
 * Validate a list of cutting plans and return de-duplicated issue codes.
 *
 * An empty plans array means the project has NO plans at all — every issue
 * is present by definition.
 *
 * Issues from ANY plan in the list contribute to the project's overall status:
 * if Plan A is missing labeling and Plan B is missing infoproject, the merged
 * result contains both issues.  The caller is responsible for passing only the
 * dimension-matched plans, so cross-dimension contamination never happens.
 *
 * @param {import('../services/mirrorProjectRepository.js').DbCuttingPlan[]} plans
 * @returns {string[]}
 */
export function validatePlans(plans) {
  if (!plans || plans.length === 0) {
    return [ISSUE.NO_ATTACHMENT, ISSUE.NO_LABELING, ISSUE.NO_CUTTING];
  }

  const issueSet = new Set();
  for (const plan of plans) {
    for (const code of validatePlan(plan)) {
      issueSet.add(code);
    }
  }

  return [...issueSet];
}
