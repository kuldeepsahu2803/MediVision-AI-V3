export interface AuditEntry {
  field: string;
  originalValue: any;
  newValue: any;
  userId: string;
  timestamp: string;
}
