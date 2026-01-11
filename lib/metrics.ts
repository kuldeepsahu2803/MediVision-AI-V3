
// Add missing metric events to the MetricEvent type
export type MetricEvent = 
  | 'verification_start' 
  | 'verification_complete' 
  | 'cache_hit' 
  | 'cache_miss' 
  | 'rxnorm_api_error' 
  | 'strength_validation_fail'
  | 'fallback_retry'
  | 're_read_trigger';

interface MetricPayload {
  medName?: string;
  latency?: number;
  status?: string;
  color?: string;
  score?: number;
  rxcui?: string;
  [key: string]: any;
}

/**
 * Logs metrics for the Verification System.
 * In a production environment, this would send data to Datadog, Sentry, or CloudWatch.
 */
export const logMetric = (event: MetricEvent, payload: MetricPayload) => {
  // Timestamp for latency calculations
  const timestamp = new Date().toISOString();

  // Console structured logging (formatted for Cloud Logging drivers)
  console.log(JSON.stringify({
    event,
    timestamp,
    ...payload,
    service: 'medication-verifier'
  }));
};
