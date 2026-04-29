/**
 * Issue codes surfaced to the user in the Mirrors module.
 * Kept as a frozen object so callers can reference codes without magic strings.
 */
export const ISSUE = Object.freeze({
  NO_ATTACHMENT:      'NO_ATTACHMENT',      // plan has no infoproject (PDF) attachment
  NO_CUTTING:         'NO_CUTTING',         // plan.reviews.cutting !== true
  NO_LABELING:        'NO_LABELING',        // plan.reviews.labeling !== true
  NO_KI_LAYOUT:       'NO_KI_LAYOUT',       // plan.reviews.ki_Layout !== true
  NO_NESTING_REPORT:  'NO_NESTING_REPORT',  // plan.reviews.nesting_report !== true
  NO_FOLDER_TEMPLATE: 'NO_FOLDER_TEMPLATE', // plan.reviews.folder_template !== true
  NO_LABEL_8C:        'NO_LABEL_8C',        // linear_meters['8C'] > 0 but label_8c .txt is missing
  NO_LABEL_9C:        'NO_LABEL_9C',        // linear_meters['9C'] > 0 but label_9c .txt is missing
  NO_LABEL_11C:       'NO_LABEL_11C',       // linear_meters['11C'] > 0 but label_11c .txt is missing
  NO_LABEL_TENSYLON:  'NO_LABEL_TENSYLON',  // linear_meters['tensylon'] > 0 but label_tensylon .txt is missing
});

/**
 * Per-machine: [linear_meters key, attachment type, issue code]
 */
const LABEL_CHECKS = [
  ['8C',      'label_8c',       ISSUE.NO_LABEL_8C],
  ['9C',      'label_9c',       ISSUE.NO_LABEL_9C],
  ['11C',     'label_11c',      ISSUE.NO_LABEL_11C],
  ['tensylon','label_tensylon', ISSUE.NO_LABEL_TENSYLON],
];

/**
 * Validate a single cutting plan and return the list of issue codes found.
 *
 * A plan is "complete" when:
 *   - it has an infoproject (PDF) attachment
 *   - reviews.cutting is true
 *   - every machine whose linear_meters > 0 has a matching .txt label attached
 *
 * @param {import('../services/mirrorProjectRepository.js').DbCuttingPlan} plan
 * @returns {string[]} Ordered issue code array (empty = plan is ready)
 */
export function validatePlan(plan) {
  const issues = [];
  const attachments = Array.isArray(plan.attachments) ? plan.attachments : [];
  const reviews     = (plan.reviews && typeof plan.reviews === 'object') ? plan.reviews : {};
  const lm          = (plan.linear_meters && typeof plan.linear_meters === 'object') ? plan.linear_meters : {};

  if (!attachments.some(a => a.type === 'infoproject')) {
    issues.push(ISSUE.NO_ATTACHMENT);
  }

  if (!reviews.cutting)          issues.push(ISSUE.NO_CUTTING);
  if (!reviews.labeling)         issues.push(ISSUE.NO_LABELING);
  if (!reviews.ki_Layout)        issues.push(ISSUE.NO_KI_LAYOUT);
  if (!reviews.nesting_report)   issues.push(ISSUE.NO_NESTING_REPORT);
  if (!reviews.folder_template)  issues.push(ISSUE.NO_FOLDER_TEMPLATE);

  const attachmentTypes = new Set(attachments.map(a => a.type));
  for (const [col, labelType, issueCode] of LABEL_CHECKS) {
    if (Number(lm[col] || 0) > 0 && !attachmentTypes.has(labelType)) {
      issues.push(issueCode);
    }
  }

  return issues;
}

/**
 * Validate a list of cutting plans and return de-duplicated issue codes.
 *
 * An empty plans array means the project has NO plans at all — every issue
 * is present by definition.
 *
 * Issues from ANY plan in the list contribute to the project's overall status.
 * The caller is responsible for passing only the dimension-matched plans.
 *
 * @param {import('../services/mirrorProjectRepository.js').DbCuttingPlan[]} plans
 * @returns {string[]}
 */
export function validatePlans(plans) {
  if (!plans || plans.length === 0) {
    return Object.values(ISSUE);
  }

  const issueSet = new Set();
  for (const plan of plans) {
    for (const code of validatePlan(plan)) {
      issueSet.add(code);
    }
  }

  return [...issueSet];
}
