import { PrescriptionData } from '@/features/prescriptions';
import { BloodTestReport } from '@/features/blood-tests';
import { ClinicalAlert, ClinicalInsight, ClinicalSeverity } from '@/features/clinical-intelligence';
import rulesData from '@/data/conflictRules.json';

export class ClinicalEngine {
  /**
   * Main entry point for clinical analysis.
   * Analyzes the entire medical history to generate insights and alerts.
   */
  static analyze(history: PrescriptionData[], labHistory: BloodTestReport[]): ClinicalInsight {
    const alerts: ClinicalAlert[] = [];
    
    // 1. Check for Rx-Lab Conflicts
    const rxLabAlerts = this.checkRxLabConflicts(history, labHistory);
    alerts.push(...rxLabAlerts);
    
    // 2. Detect Trends
    const trendAlerts = this.detectTrends(labHistory);
    alerts.push(...trendAlerts);
    
    // 3. Check for Ayurvedic Conflicts
    const ayurvedicAlerts = this.checkAyurvedicConflicts(history);
    alerts.push(...ayurvedicAlerts);

    // 4. Check for Critical Emergencies
    const criticalAlerts = this.checkCriticalThresholds(labHistory);
    alerts.push(...criticalAlerts);

    // 5. Calculate Risk Scores
    const riskScores = this.calculateRiskScores(history, labHistory, alerts);

    // 6. Extract Trends
    const testTrends = this.extractTestTrends(labHistory);

    // 7. Generate Summary
    const summary = this.generateSummary(alerts);

    return {
      id: `insight_${Date.now()}`,
      userId: 'current-user', // Should be passed in or handled by caller
      alerts,
      summary,
      riskScores,
      testTrends,
      generatedAt: new Date().toISOString()
    };
  }

  private static extractTestTrends(labs: BloodTestReport[]) {
    if (labs.length < 1) return [];

    const commonTests = ['Glucose', 'Hemoglobin', 'Creatinine', 'TSH', 'HbA1c', 'ALT'];
    const trends: { test: string; unit: string; data: { date: string; value: number }[] }[] = [];

    commonTests.forEach(testName => {
      const data = labs
        .map(report => {
          const res = report.results.find(r => r.test.toLowerCase().includes(testName.toLowerCase()));
          return res ? { date: report.date, value: res.value, unit: res.unit } : null;
        })
        .filter((v): v is { date: string; value: number; unit: string } => v !== null)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (data.length > 0) {
        trends.push({
          test: testName,
          unit: data[0].unit,
          data: data.map(d => ({ date: d.date, value: d.value }))
        });
      }
    });

    return trends;
  }

  private static checkRxLabConflicts(prescriptions: PrescriptionData[], labs: BloodTestReport[]): ClinicalAlert[] {
    const alerts: ClinicalAlert[] = [];
    if (labs.length === 0) return alerts;

    // Use the most recent lab report for current status checks
    const recentLab = labs[0];
    const allMeds = prescriptions.flatMap(p => p.medication.map(m => m.name.toLowerCase()));

    for (const rule of rulesData.rxLabConflicts) {
      const hasMed = rule.medConflicts.some(med => allMeds.includes(med.toLowerCase()));
      if (!hasMed) continue;

      const triggered = rule.labTriggers.every(trigger => {
        return recentLab.results.some(res => 
          res.test.toLowerCase().includes(trigger.test.toLowerCase()) && 
          res.status.toLowerCase() === trigger.status.toLowerCase()
        );
      });

      if (triggered) {
        alerts.push({
          id: `alert_${rule.id}_${Date.now()}`,
          type: 'DDI',
          severity: rule.severity as ClinicalSeverity,
          message: rule.message,
          action: rule.action,
          triggeredAt: new Date().toISOString(),
          resolved: false,
          relatedIds: [recentLab.id, ...prescriptions.map(p => p.id)]
        });
      }
    }

    return alerts;
  }

  private static detectTrends(labs: BloodTestReport[]): ClinicalAlert[] {
    const alerts: ClinicalAlert[] = [];
    if (labs.length < 2) return alerts;

    // Sort labs by date descending
    const sortedLabs = [...labs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const rule of rulesData.trendRules) {
      const testValues = sortedLabs.map(report => {
        const res = report.results.find(r => r.test.toLowerCase().includes(rule.test.toLowerCase()));
        return res ? res.value : null;
      }).filter(v => v !== null) as number[];

      if (testValues.length < 2) continue;

      const latest = testValues[0];
      const previous = testValues[1];
      const change = (latest - previous) / previous;

      if (rule.direction === 'UP' && change >= rule.threshold) {
        alerts.push({
          id: `trend_${rule.test}_${Date.now()}`,
          type: 'TREND',
          severity: rule.severity as ClinicalSeverity,
          message: `${rule.message} (${(change * 100).toFixed(1)}% increase)`,
          triggeredAt: new Date().toISOString(),
          resolved: false,
          relatedIds: sortedLabs.slice(0, 2).map(l => l.id)
        });
      } else if (rule.direction === 'DOWN' && change <= -rule.threshold) {
        alerts.push({
          id: `trend_${rule.test}_${Date.now()}`,
          type: 'TREND',
          severity: rule.severity as ClinicalSeverity,
          message: `${rule.message} (${(Math.abs(change) * 100).toFixed(1)}% decrease)`,
          triggeredAt: new Date().toISOString(),
          resolved: false,
          relatedIds: sortedLabs.slice(0, 2).map(l => l.id)
        });
      }
    }

    return alerts;
  }

  private static checkAyurvedicConflicts(prescriptions: PrescriptionData[]): ClinicalAlert[] {
    const alerts: ClinicalAlert[] = [];
    const allMeds = prescriptions.flatMap(p => p.medication.map(m => m.name.toLowerCase()));

    for (const rule of rulesData.ayurvedicConflicts) {
      const hasHerbal = allMeds.some(med => med.includes(rule.herbal.toLowerCase()));
      if (!hasHerbal) continue;

      const hasMedConflict = rule.medConflicts.some(med => 
        allMeds.some(m => m.includes(med.toLowerCase()) && !m.includes(rule.herbal.toLowerCase()))
      );

      if (hasMedConflict) {
        alerts.push({
          id: `ayur_${rule.id}_${Date.now()}`,
          type: 'AYURVEDIC',
          severity: rule.severity as ClinicalSeverity,
          message: rule.message,
          action: rule.action,
          triggeredAt: new Date().toISOString(),
          resolved: false,
          relatedIds: prescriptions.map(p => p.id)
        });
      }
    }

    return alerts;
  }

  private static checkCriticalThresholds(labs: BloodTestReport[]): ClinicalAlert[] {
    const alerts: ClinicalAlert[] = [];
    if (labs.length === 0) return alerts;

    const recentLab = labs[0];

    for (const threshold of rulesData.criticalThresholds) {
      const res = recentLab.results.find(r => r.test.toLowerCase().includes(threshold.test.toLowerCase()));
      if (!res) continue;

      if (res.value >= threshold.emergency || (threshold.test === 'Hemoglobin' && res.value <= threshold.emergency)) {
        alerts.push({
          id: `crit_${threshold.test}_${Date.now()}`,
          type: 'CRITICAL',
          severity: 'EMERGENCY',
          message: `CRITICAL ${threshold.test.toUpperCase()} LEVEL: ${res.value} ${res.unit}. IMMEDIATE CLINICAL ATTENTION REQUIRED.`,
          action: 'Seek emergency medical care immediately.',
          triggeredAt: new Date().toISOString(),
          resolved: false,
          relatedIds: [recentLab.id]
        });
      }
    }

    return alerts;
  }

  private static calculateRiskScores(history: PrescriptionData[], labs: BloodTestReport[], alerts: ClinicalAlert[]) {
    // Basic scoring logic based on alerts and lab statuses
    const scores = { kidney: 0, liver: 0, heart: 0, diabetes: 0, thyroid: 0 };
    
    if (labs.length === 0) return scores;
    const recent = labs[0];

    // Kidney
    const creat = recent.results.find(r => r.test.toLowerCase().includes('creatinine'));
    if (creat?.status === 'High') scores.kidney += 40;
    if (creat?.status === 'Critical') scores.kidney += 80;
    if (alerts.some(a => a.message.toLowerCase().includes('kidney'))) scores.kidney += 20;

    // Liver
    const alt = recent.results.find(r => r.test.toLowerCase().includes('alt'));
    if (alt?.status === 'High') scores.liver += 40;
    if (alerts.some(a => a.message.toLowerCase().includes('liver'))) scores.liver += 20;

    // Heart
    const k = recent.results.find(r => r.test.toLowerCase().includes('potassium'));
    if (k?.status === 'High' || k?.status === 'Low') scores.heart += 40;
    if (alerts.some(a => a.message.toLowerCase().includes('heart') || a.message.toLowerCase().includes('potassium'))) scores.heart += 30;

    // Diabetes
    const hba1c = recent.results.find(r => r.test.toLowerCase().includes('hba1c'));
    if (hba1c?.status === 'High') scores.diabetes += 50;
    if (hba1c?.status === 'Low') scores.diabetes += 30;

    // Thyroid
    const tsh = recent.results.find(r => r.test.toLowerCase().includes('tsh'));
    if (tsh?.status !== 'Normal') scores.thyroid += 50;

    // Clamp to 100
    Object.keys(scores).forEach(key => {
      (scores as any)[key] = Math.min(100, (scores as any)[key]);
    });

    return scores;
  }

  private static generateSummary(alerts: ClinicalAlert[]): string {
    if (alerts.length === 0) {
      return "No significant clinical conflicts or trends detected. Continue regular monitoring.";
    }

    const criticalCount = alerts.filter(a => a.severity === 'EMERGENCY' || a.severity === 'CRITICAL').length;
    const highCount = alerts.filter(a => a.severity === 'HIGH').length;

    if (criticalCount > 0) {
      return `URGENT: ${criticalCount} critical health risks detected. Immediate action required.`;
    }

    if (highCount > 0) {
      return `Attention: ${highCount} high-priority clinical conflicts or trends identified. Review with your physician.`;
    }

    return `Clinical analysis complete. ${alerts.length} insights identified for your review.`;
  }
}
