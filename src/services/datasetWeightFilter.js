/**
 * Filter datasets used for MLE / Bayesian weight calculation.
 * Datasets with `outdated: true` are excluded. Missing `outdated` is treated as current.
 * @param {Array<Object>} datasets - Full dataset objects from JSON
 * @returns {Array<Object>}
 */
export function filterDatasetsForWeightCalculation(datasets) {
  if (!datasets || !Array.isArray(datasets)) {
    return [];
  }
  return datasets.filter((ds) => ds && ds.outdated !== true);
}
