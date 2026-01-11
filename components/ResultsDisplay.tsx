
import React from 'react';
import { PrescriptionData, Medicine } from '../types.ts';
import { Spinner } from './Spinner.tsx';
import { formatDate } from '../lib/utils.ts';
import { AnalyzeIcon } from './icons/AnalyzeIcon.tsx';
import { PrescriptionSkeleton } from './skeletons/PrescriptionSkeleton.tsx';
import { motion } from 'framer-motion';

interface ResultsDisplayProps {
  data: PrescriptionData | null;
  isLoading: boolean;
  error: string | null;
  hasImage: boolean;
  onVerifyClick: () => void;
  onRetry?: () => void;
}

const PillIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.06,5.44a6.73,6.73,0,0,0-9.22,0,6.58,6.58,0,0,0,0,9.21l.1.1,9.12-9.12Z" opacity="0.6"/>
      <path d="M10.94,18.56a6.73,6.73,0,0,0,9.22,0,6.58,6.58,0,0,0,0-9.21l-.1-.1-9.12,9.12Z"/>
    </svg>
);

const ResultRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
    // Don't render if the value is missing or is the default "not mentioned" string.
    const cleanValue = String(value || '').trim();
    if (!cleanValue || cleanValue.toLowerCase() === 'not mentioned' || cleanValue.toLowerCase() === 'n/a') {
      return null;
    }
    
    return (
      <>
        <dt className="py-3 text-sm font-medium text-light-text-mid dark:text-dark-text-mid border-b border-light-border/50 dark:border-dark-border/50 whitespace-nowrap">{label}</dt>
        <dd className="py-3 text-sm text-light-text dark:text-dark-text break-words text-right border-b border-light-border/50 dark:border-dark-border/50">{cleanValue}</dd>
      </>
    );
};

const MedicationTable: React.FC<{ medicines: Medicine[] }> = ({ medicines }) => {
  if (!medicines || medicines.length === 0) {
    return <div className="py-4 text-sm text-light-text-mid dark:text-dark-text-mid">No medication details found.</div>;
  }

  return (
    <div className="my-4">
      <div className="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border">
        <table className="min-w-full">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-light-text-mid dark:text-dark-text-mid uppercase tracking-wider">
                Medicine
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-light-text-mid dark:text-dark-text-mid uppercase tracking-wider">
                Dosage
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-light-text-mid dark:text-dark-text-mid uppercase tracking-wider">
                Frequency
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {medicines.map((med, index) => (
              <tr key={index} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-light-text dark:text-dark-text">{med.name || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-light-text-mid dark:text-dark-text-mid">{med.dosage || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-light-text-mid dark:text-dark-text-mid">{med.frequency || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, isLoading, error, hasImage, onVerifyClick, onRetry }) => {

  if (isLoading) {
    return <PrescriptionSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn p-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <p className="text-lg font-semibold text-red-500 mb-2">Analysis Failed</p>
        <p className="text-sm text-light-text-mid dark:text-dark-text-mid max-w-md mb-6">{error}</p>
        
        {onRetry && (
            <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={onRetry}
                className="btn-secondary px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
                <AnalyzeIcon className="w-4 h-4" />
                Try Again
            </motion.button>
        )}
      </div>
    );
  }

  if (data) {
    const hasNotes = data.notes && data.notes.toLowerCase() !== 'none' && data.notes.trim() !== '' && data.notes.toLowerCase() !== 'no additional notes found.';
    
    return (
      <div className="flex flex-col h-full animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <PillIcon className="w-8 h-8 text-brand-green" />
          <h3 className="text-lg font-bold text-light-text dark:text-dark-text uppercase tracking-wider">
            Extracted Information
          </h3>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 -mr-4" style={{'scrollbarWidth': 'thin'}}>
          <dl className="grid grid-cols-[auto,1fr] gap-x-8">
            <ResultRow label="Patient:" value={data.patientName} />
            <ResultRow label="Age:" value={data.patientAge} />
            <ResultRow label="Address:" value={data.patientAddress} />
            <ResultRow label="Doctor:" value={data.doctorName} />
            <ResultRow label="Clinic:" value={data.clinicName} />
            <ResultRow label="Date:" value={formatDate(data.date)} />
          </dl>
          
          <MedicationTable medicines={data.medication} />
          
           {hasNotes && (
             <div className="pt-4 mt-4 border-t border-light-border/50 dark:border-dark-border/50">
              <h4 className="text-sm font-medium text-light-text-mid dark:text-dark-text-mid mb-2">Additional Notes</h4>
              <p className="text-sm text-light-text dark:text-dark-text break-words">{data.notes}</p>
            </div>
           )}
        </div>
        <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onVerifyClick}
            className="btn-gradient w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg shadow-lg text-white"
          >
            Verify & Correct
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
       <svg className="w-16 h-16 text-light-text-mid dark:text-dark-text-mid opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.375 1.125-1.125-1.125a1.125 1.125 0 0 1 1.625 0l2.25 2.25a1.125 1.125 0 0 1 0 1.591l-2.25 2.25a1.125 1.125 0 0 1-1.625 0l-1.125-1.125m-3.375 0c-.621 0-1.125.504-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125h3.375c.621 0 1.125-.504 1.125-1.125v-3.375c0-.621-.504-1.125-1.125-1.125h-3.375Z" />
      </svg>
      <p className="mt-4 text-lg font-medium text-light-text-mid dark:text-dark-text-mid">Awaiting Analysis</p>
      <p className="text-sm text-light-text-dark dark:text-dark-text-dark">
        {hasImage ? 'Click "Analyze Prescription" to begin.' : 'Upload an image of a prescription to start.'}
      </p>
    </div>
  );
};
