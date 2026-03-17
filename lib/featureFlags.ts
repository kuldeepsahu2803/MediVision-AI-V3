
/**
 * Feature Flags to control the rollout of the RxNorm Verification System.
 * This allows us to disable the backend logic instantly if issues arise.
 */
export const FEATURE_FLAGS = {
  // Master switch for the RxNorm Verification System
  // Set to false to revert to basic extraction without validation
  VERIFY_RXNORM: true,

  // Enable detailed metrics logging to console
  ENABLE_METRICS: true,

  // Enable visual debug overlays (bounding boxes) by default
  DEBUG_VISUALS: false,

  // Enable the new PDF generation engine with Unicode support and layout fixes
  ENABLE_V2_PDF_ENGINE: true,
};
