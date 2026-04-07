
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, TrendingUp, Download, Trash2, History, Undo2 } from 'lucide-react';
import { BloodTestReport, LabResult } from '../types.ts';
import { analyzeBloodReport } from '../services/bloodTestService.ts';
import { generateBloodReportPdf } from '../lib/labPdfUtils.ts';
import { cn } from '../lib/utils.ts';
import { Spinner } from './Spinner.tsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

interface LabsViewProps {
  history: BloodTestReport[];
  currentMeds: string[];
  onSave: (report: BloodTestReport) => void;
  onDelete: (id: string) => void;
}

export const LabsView: React.FC<LabsViewProps> = ({ history, currentMeds, onSave, onDelete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0); // 0: Idle, 1: OCR, 2: Mapping, 3: Review
  const [activeReport, setActiveReport] = useState<BloodTestReport | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisStep(1); // OCR
    
    try {
      // Sequential processing to prevent memory exhaustion (Fix #040)
      const images: { data: string, mimeType: string }[] = [];
      for (const file of files as File[]) {
        const imageData = await new Promise<{ data: string, mimeType: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ data: base64, mimeType: file.type });
          };
          reader.readAsDataURL(file);
        });
        images.push(imageData);
      }
      
      setAnalysisStep(2); // Mapping
      const report = await analyzeBloodReport(images, currentMeds);
      
      setActiveReport(report);
      setIsAnalyzing(false);
      setAnalysisStep(3); // Review
    } catch (error) {
      console.error('Analysis failed');
      toast.error('Failed to analyze report');
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleSave = () => {
    if (!activeReport) return;
    const finalReport: BloodTestReport = {
      ...activeReport,
      status: 'Clinically-Verified',
      auditTrail: [
        ...(activeReport.auditTrail || []),
        {
          field: 'status',
          originalValue: 'AI-Extracted',
          newValue: 'Clinically-Verified',
          userId: 'current-user',
          timestamp: new Date().toISOString()
        }
      ]
    };

    onSave(finalReport);
    setActiveReport(null);
    setAnalysisStep(0);

    // Save confirmation with undo (Fix #046)
    toast.success((t) => (
      <div className="flex items-center gap-4">
        <span className="font-bold">Report Saved Successfully</span>
        <button 
          onClick={() => {
            onDelete(finalReport.id);
            setActiveReport(activeReport);
            setAnalysisStep(3);
            toast.dismiss(t.id);
          }}
          className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          <Undo2 className="size-3" />
          Undo
        </button>
      </div>
    ), { duration: 5000 });
  };

  return (
    <div className="space-y-8">
      <Toaster position="bottom-right" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Blood Test Analysis</h1>
          <p className="text-slate-500 font-medium">AI-powered lab report extraction and clinical correlation.</p>
        </div>
        <label className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs cursor-pointer hover:scale-105 transition-all shadow-lg shadow-brand-blue/20">
          <Upload className="size-4" />
          Upload Report(s)
          <input type="file" className="hidden" accept="image/*,application/pdf" multiple onChange={handleFileUpload} />
        </label>
      </div>

      {isAnalyzing && (
        <div className="p-12 text-center space-y-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl">
          <ProgressStepper step={analysisStep} />
          <div className="space-y-4">
            <Spinner className="mx-auto" />
            <p className="text-slate-500 font-bold animate-pulse">
              {analysisStep === 1 ? 'Extracting OCR Data...' : 'Mapping to Clinical Standards...'}
            </p>
          </div>
        </div>
      )}

      {activeReport && !isAnalyzing && (
        <div className="space-y-8">
          <ProgressStepper step={3} />
          <ReportDetail 
            report={activeReport} 
            onSave={handleSave} 
            onCancel={() => { setActiveReport(null); setAnalysisStep(0); }} 
            onUpdate={(updated) => setActiveReport(updated)}
          />
        </div>
      )}

      {!activeReport && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* History List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <History className="size-5 text-brand-blue" />
              Recent Reports
            </h2>
            {history.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                <FileText className="size-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No reports analyzed yet.</p>
              </div>
            ) : (
              history.map(report => (
                <ReportCard key={report.id} report={report} onClick={() => setActiveReport(report)} onDelete={() => onDelete(report.id)} />
              ))
            )}
          </div>

          {/* Trends/Insights Sidebar */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="size-5 text-brand-green" />
              Health Trends
            </h2>
            <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-6">
              {history.length > 1 ? (
                <TrendsChart history={history} />
              ) : (
                <div className="space-y-4">
                  <div className="h-32 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10">
                    <TrendingUp className="size-8 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Longitudinal analysis of your lab results will appear here as you upload more reports.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-12">
        AI analysis for informational purposes only. Consult a licensed clinician.
      </p>
    </div>
  );
};

const ReportCard: React.FC<{ report: BloodTestReport, onClick: () => void, onDelete: () => void }> = ({ report, onClick, onDelete }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className="size-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
        <FileText className="size-6" />
      </div>
      <div>
        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{report.patientName}</h3>
        <p className="text-xs text-slate-500 font-medium">{report.date} • {report.results.length} Tests</p>
      </div>
    </div>
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
      >
        <Trash2 className="size-5" />
      </button>
    </div>
  </motion.div>
);

const ReportDetail = ({ report, onSave, onCancel, onUpdate }: { report: BloodTestReport, onSave: () => void, onCancel: () => void, onUpdate: (report: BloodTestReport) => void }) => {
  const handleResultsChange = (newResults: LabResult[]) => {
    onUpdate({ ...report, results: newResults });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-brand-blue transition-colors">
          ← Back to History
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => generateBloodReportPdf(report)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            <Download className="size-4" />
            Export PDF
          </button>
          <button onClick={onSave} className="flex items-center gap-2 px-6 py-3 bg-brand-green text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-green/20">
            <CheckCircle className="size-4" />
            Verify & Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Results Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Review Lab Results</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verify AI extraction accuracy before saving</p>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.date}</span>
            </div>
            <ReviewTable results={report.results} onChange={handleResultsChange} />
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-6">
          {/* Demographics Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gender</p>
                <p className="font-black text-slate-900 dark:text-white">{report.patientGender || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Age</p>
                <p className="font-black text-slate-900 dark:text-white">{report.patientAge || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Medication Conflicts */}
          {report.medicationConflicts.length > 0 && (
            <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-5" />
                <h3 className="font-black uppercase tracking-tight">Clinical Risks</h3>
              </div>
              <ul className="space-y-2">
                {report.medicationConflicts.map((conflict, i) => (
                  <li key={i} className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">• {conflict}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Insights */}
          <div className="p-8 bg-brand-blue text-white rounded-[2.5rem] shadow-xl shadow-brand-blue/20 space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">psychology</span>
              <h3 className="font-black uppercase tracking-tight">AI Insights</h3>
            </div>
            <div className="space-y-4">
              {report.aiInsights.map((insight, i) => (
                <p key={i} className="text-sm font-medium leading-relaxed opacity-90">{insight}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ReviewTable = ({ results, onChange }: { results: LabResult[], onChange: (results: LabResult[]) => void }) => {
  const handleFieldChange = (index: number, field: keyof LabResult, value: any) => {
    const newResults = [...results];
    const res = { ...newResults[index], [field]: value };
    
    // Re-calculate status if value changes
    if (field === 'value') {
      const numValue = parseFloat(value) || 0;
      res.value = numValue;
      
      let status: LabResult['status'] = 'Normal';
      if (res.refLow !== undefined && numValue < res.refLow) status = 'Low';
      if (res.refHigh !== undefined && numValue > res.refHigh) status = 'High';
      if (res.refLow !== undefined && numValue < res.refLow * 0.5) status = 'Critical';
      if (res.refHigh !== undefined && numValue > res.refHigh * 2) status = 'Critical';
      res.status = status;
    }

    newResults[index] = res;
    onChange(newResults);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-4">Test Name</th>
            <th className="px-8 py-4">Value</th>
            <th className="px-8 py-4">Unit</th>
            <th className="px-8 py-4">Reference</th>
            <th className="px-8 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {results.map((res, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <td className="px-8 py-6">
                <input 
                  type="text" 
                  value={res.test} 
                  onChange={(e) => handleFieldChange(i, 'test', e.target.value)}
                  className="w-full bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-white/10 font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm focus:outline-none focus:border-brand-blue"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.panel}</p>
              </td>
              <td className="px-8 py-6">
                <input 
                  type="number" 
                  value={res.value} 
                  onChange={(e) => handleFieldChange(i, 'value', e.target.value)}
                  className="w-20 bg-transparent border-b border-slate-200 dark:border-white/10 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                />
              </td>
              <td className="px-8 py-6">
                <input 
                  type="text" 
                  value={res.unit} 
                  onChange={(e) => handleFieldChange(i, 'unit', e.target.value)}
                  className="w-16 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-white/10 text-[10px] text-slate-400 font-bold focus:outline-none focus:border-brand-blue"
                />
              </td>
              <td className="px-8 py-6">
                <span className="text-xs text-slate-500 font-medium">
                  {res.refLow} - {res.refHigh}
                </span>
              </td>
              <td className="px-8 py-6">
                <StatusBadge status={res.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TrendsChart = ({ history }: { history: BloodTestReport[] }) => {
  // Extract common tests for trending (e.g., Hemoglobin, Glucose)
  const commonTests = ['Hemoglobin', 'Glucose', 'Creatinine', 'Cholesterol'];
  const [selectedTest, setSelectedTest] = useState(commonTests[0]);

  const chartData = history
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(report => {
      const result = report.results.find(r => r.test.toLowerCase().includes(selectedTest.toLowerCase()));
      return {
        date: report.date,
        value: result?.value || null
      };
    })
    .filter(d => d.value !== null);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {commonTests.map(test => (
          <button
            key={test}
            onClick={() => setSelectedTest(test)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              selectedTest === test ? "bg-brand-blue text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            )}
          >
            {test}
          </button>
        ))}
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: 'none', 
                borderRadius: '1rem', 
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ProgressStepper = ({ step }: { step: number }) => {
  const steps = [
    { label: 'OCR Extraction', icon: 'scan' },
    { label: 'Clinical Mapping', icon: 'database' },
    { label: 'Human Review', icon: 'verified_user' },
  ];

  return (
    <div className="flex items-center justify-center gap-8 mb-12">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={cn(
            "size-10 rounded-full flex items-center justify-center text-sm font-black transition-all",
            step > i + 1 ? "bg-brand-green text-white" : step === i + 1 ? "bg-brand-blue text-white scale-110 shadow-lg" : "bg-slate-100 dark:bg-white/5 text-slate-400"
          )}>
            {step > i + 1 ? <CheckCircle className="size-5" /> : i + 1}
          </div>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            step === i + 1 ? "text-slate-900 dark:text-white" : "text-slate-400"
          )}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="w-12 h-px bg-slate-200 dark:bg-white/10" />}
        </div>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: LabResult['status'] }) => {
  const styles = {
    Normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    Low: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    High: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    Critical: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", styles[status])}>
      {status}
    </span>
  );
};
