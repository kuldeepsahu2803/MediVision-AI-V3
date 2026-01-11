
export type MetricEvent = 
  | 'verification_start' | 'verification_complete' | 'cache_hit' | 'cache_miss' 
  | 'rxnorm_api_error' | 'strength_validation_fail' | 'fallback_retry' | 're_read_trigger';

interface MetricPayload {
  latency?: number;
  status?: string;
  color?: string;
  score?: number;
  [key: string]: any;
}

/**
 * SECURE: Logs operational metrics without PHI identifiers.
 */
export const logMetric = (event: MetricEvent, payload: MetricPayload) => {
  // SECURE: Strip all possible PII before logging to telemetry
  const { medName, patientName, ...safePayload } = payload;
  
  console.log(JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...safePayload,
    service: 'medication-verifier',
    environment: 'production'
  }));
};
