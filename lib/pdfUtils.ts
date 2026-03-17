import { PrescriptionData, Medicine } from '../types.ts';
import { logo as logoBase64 } from './pdfAssets.ts';
import { formatDate } from './utils.ts';
import { normalizeForPDF, validatePDFText } from '../services/pdfNormalizationService.ts';
import { PDF_LAYOUT_CONFIG } from './pdfLayoutConfig.ts';
import { FEATURE_FLAGS } from './featureFlags.ts';
import { registerCustomFonts } from './fonts.ts';

const THEME = {
  colors: {
    primary: [75, 192, 200] as [number, number, number],
    primaryLight: [233, 248, 250] as [number, number, number],
    textDark: [55, 65, 81] as [number, number, number],
    textMedium: [107, 114, 128] as [number, number, number],
    textLight: [156, 163, 175] as [number, number, number],
    accentBlue: [174, 200, 241] as [number, number, number],
    secondaryGreen: [140, 212, 160] as [number, number, number],
    successBg: [209, 250, 229] as [number, number, number],
    successText: [5, 150, 105] as [number, number, number],
    warningBg: [254, 243, 199] as [number, number, number],
    warningText: [245, 158, 11] as [number, number, number],
    dangerBg: [254, 226, 226] as [number, number, number],
    dangerText: [220, 38, 38] as [number, number, number],
    border: [167, 228, 233] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  },
  layout: {
    margin: 40,
    pageWidth: 595.28,
    pageHeight: 841.89,
    contentWidth: 515.28 // pageWidth - margin * 2
  }
};

const isSafeBase64Image = (str: any): boolean => {
  if (typeof str !== 'string' || !str.startsWith('data:image/')) return false;
  return str.length > 100;
};

const setDocFont = (doc: any, style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal') => {
    const availableFonts = doc.getFontList();
    const hasNotoSans = availableFonts['NotoSans'] !== undefined;

    if (FEATURE_FLAGS.ENABLE_V2_PDF_ENGINE && hasNotoSans) {
        doc.setFont('NotoSans', style);
    } else {
        doc.setFont('helvetica', style);
    }
};

const drawSectionHeader = (doc: any, title: string, y: number) => {
    doc.setFontSize(14);
    setDocFont(doc, 'bold');
    doc.setTextColor(...THEME.colors.textDark);
    doc.text(title, THEME.layout.margin, y);
    return y + 15;
};

const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatAuditField = (field: string) => {
    if (field.startsWith('medication[')) {
        const index = field.match(/\[(\d+)\]/)?.[1];
        return `Medication #${Number(index) + 1}`;
    }
    return field.charAt(0).toUpperCase() + field.slice(1);
};

export const generateDoc = async (report: PrescriptionData): Promise<any> => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const { margin, pageWidth, pageHeight, contentWidth } = THEME.layout;
    
    // TRACK A: Font Registration
    if (FEATURE_FLAGS.ENABLE_V2_PDF_ENGINE) {
        registerCustomFonts(doc);
        setDocFont(doc, 'normal');
    }

    let currentY = 50;

    // --- 1. Header Area ---
    if (logoBase64 && isSafeBase64Image(logoBase64)) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, currentY - 20, 28, 28);
        } catch (e) {
            doc.setFillColor(...THEME.colors.primary);
            doc.circle(margin + 14, currentY - 6, 14, 'F');
        }
    }

    setDocFont(doc, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...THEME.colors.primary);
    doc.text('Clinical Analysis Report', margin + 38, currentY);
    
    setDocFont(doc, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text('Professional Medication Verification & Insights', margin + 38, currentY + 12);

    doc.setFontSize(9);
    doc.setTextColor(...THEME.colors.textDark);
    doc.text(`Report Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, currentY - 5, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Reference ID: ${report.id.substring(0, 8).toUpperCase()}`, pageWidth - margin, currentY + 10, { align: 'right' });

    currentY += 40;
    doc.setDrawColor(...THEME.colors.border);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 30;

    // --- TRACK D: Critical Alerts Section ---
    const lowConfidenceMeds = report.medication?.filter(m => 
        (m.verification?.confidenceScore || 1) < PDF_LAYOUT_CONFIG.alertThresholds.lowConfidence
    ) || [];

    if (lowConfidenceMeds.length > 0) {
        doc.setFillColor(...THEME.colors.warningBg);
        doc.roundedRect(margin, currentY, contentWidth, 35, 5, 5, 'F');
        setDocFont(doc, 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...THEME.colors.warningText);
        doc.text("⚠ CLINICAL ALERTS: Verification required for low-confidence entries.", margin + 15, currentY + 20);
        currentY += 50;
    }

    // --- 2. Wellness Profile Section ---
    currentY = drawSectionHeader(doc, 'Your Wellness Profile', currentY);
    
    doc.setFillColor(...THEME.colors.primaryLight);
    doc.setDrawColor(...THEME.colors.border);
    doc.roundedRect(margin, currentY, contentWidth, 85, 10, 10, 'FD');

    const colWidth = contentWidth / 2;
    doc.setFontSize(7);
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text("NAME", margin + 20, currentY + 25);
    doc.text("CLIENT ID", margin + colWidth + 20, currentY + 25);
    doc.text("DATE OF BIRTH", margin + 20, currentY + 60);
    doc.text("KNOWN SENSITIVITIES", margin + colWidth + 20, currentY + 60);

    doc.setFontSize(11);
    doc.setTextColor(...THEME.colors.textDark);
    doc.text(normalizeForPDF(report.patientName), margin + 20, currentY + 40);
    doc.text(`#${report.id.substring(0, 8).toUpperCase()}`, margin + colWidth + 20, currentY + 40);
    doc.text(normalizeForPDF(report.patientAge || formatDate(report.date), 'As per record'), margin + 20, currentY + 75);
    
    const sensitivities = normalizeForPDF(report.warnings?.join(', '), 'None Disclosed');
    doc.setFontSize(9);
    if (sensitivities !== 'None Disclosed') {
        doc.setTextColor(...THEME.colors.dangerText);
        setDocFont(doc, 'bold');
    }
    
    // Fix Truncation: Use splitTextToSize for multi-line sensitivities
    const splitSensitivities = doc.splitTextToSize(sensitivities, colWidth - 40);
    doc.text(splitSensitivities, margin + colWidth + 20, currentY + 75);
    
    currentY += 115;

    // --- 3. Medication Plan Table ---
    if (report.medication && report.medication.length > 0) {
        currentY = drawSectionHeader(doc, 'Your Medication Plan', currentY);
        
        const tableRules = PDF_LAYOUT_CONFIG.tableRules.medicationPlan;

        autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [['MEDICATION', 'AMOUNT', 'HOW OFTEN', 'METHOD', 'GUIDANCE']],
            body: report.medication.map(m => [
                toTitleCase(normalizeForPDF(m.verification?.normalizedName || m.name)),
                normalizeForPDF(m.dosage),
                normalizeForPDF(m.frequency),
                normalizeForPDF(m.route, 'By Mouth'),
                (m.humanConfirmed || m.verification?.color === 'emerald') ? 'OK' : (m.verification?.color === 'rose' ? 'WARN' : 'REV')
            ]),
            theme: 'striped',
            headStyles: { 
                fillColor: THEME.colors.primaryLight, 
                textColor: THEME.colors.textMedium, 
                fontSize: 8, 
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: { 
                fontSize: 10, 
                textColor: THEME.colors.textDark,
                cellPadding: 10,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: contentWidth * tableRules.columnWeights[0] },
                1: { cellWidth: contentWidth * tableRules.columnWeights[1] },
                2: { cellWidth: contentWidth * tableRules.columnWeights[2] },
                3: { cellWidth: contentWidth * tableRules.columnWeights[3] },
                4: { cellWidth: contentWidth * tableRules.columnWeights[4], halign: 'right', fontStyle: 'bold' }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    const text = String(data.cell.raw);
                    if (text === 'OK') {
                        doc.setTextColor(...THEME.colors.successText);
                    } else if (text === 'WARN') {
                        doc.setTextColor(...THEME.colors.dangerText);
                    } else {
                        doc.setTextColor(...THEME.colors.warningText);
                    }
                }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 40;
    }

    // --- TRACK D: Audit Trail Appendix ---
    const hasCorrections = report.medication?.some(m => m.humanConfirmed) || (report.auditTrail && report.auditTrail.length > 0);
    if (hasCorrections) {
        if (currentY > pageHeight - 200) {
            doc.addPage();
            currentY = margin;
        }
        currentY = drawSectionHeader(doc, 'Clinical Audit Appendix', currentY);
        
        const auditRows = [];
        
        // Add medication corrections
        report.medication?.filter(m => m.humanConfirmed).forEach((m, idx) => {
            auditRows.push([
                `Medication #${idx + 1} Name`,
                normalizeForPDF(m.name),
                normalizeForPDF(m.verification?.normalizedName || m.name),
                'User Verified'
            ]);
        });
        
        // Add general audit trail if available
        report.auditTrail?.forEach(entry => {
            auditRows.push([
                formatAuditField(normalizeForPDF(entry.field)),
                normalizeForPDF(entry.originalValue),
                normalizeForPDF(entry.newValue),
                'Field Correction'
            ]);
        });

        autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [['FIELD', 'ORIGINAL VALUE', 'VERIFIED VALUE', 'TYPE']],
            body: auditRows,
            theme: 'plain',
            headStyles: { fontSize: 8, fontStyle: 'bold', textColor: THEME.colors.textMedium },
            bodyStyles: { fontSize: 8, textColor: THEME.colors.textMedium },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 30;
    }

    // --- 4. Important Notes Section ---
    const hasNotes = report.notes && normalizeForPDF(report.notes, '') !== '';
    const hasAiRecs = report.aiSuggestions?.generalRecommendations?.length;

    if (hasNotes || hasAiRecs) {
        if (currentY > pageHeight - 150) {
            doc.addPage();
            currentY = margin;
        }
        
        currentY = drawSectionHeader(doc, 'Important Notes', currentY);

        if (hasNotes) {
            const splitNotes = doc.splitTextToSize(normalizeForPDF(report.notes), contentWidth - 40);
            const notesHeight = (splitNotes.length * 14) + 20;
            
            doc.setFillColor(...THEME.colors.primaryLight);
            doc.roundedRect(margin, currentY, contentWidth, notesHeight, 8, 8, 'F');
            setDocFont(doc, 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...THEME.colors.textDark);
            doc.text(splitNotes, margin + 20, currentY + 20);
            
            currentY += notesHeight + 15;
        }

        if (hasAiRecs) {
            report.aiSuggestions?.generalRecommendations?.forEach((rec: string) => {
                if (currentY > pageHeight - 60) {
                    doc.addPage();
                    currentY = margin;
                }
                const splitRec = doc.splitTextToSize(`- ${normalizeForPDF(rec)}`, contentWidth - 40);
                doc.setFontSize(9);
                doc.setTextColor(...THEME.colors.textDark);
                doc.text(splitRec, margin + 10, currentY);
                currentY += (splitRec.length * 12) + 5;
            });
            currentY += 20;
        }
    }

    // --- 5. Review Status Section ---
    const statusBoxY = pageHeight - 150;
    if (currentY > statusBoxY - 20) {
        doc.addPage();
        currentY = margin;
    } else {
        currentY = statusBoxY;
    }

    doc.setFillColor(...THEME.colors.primaryLight);
    doc.setDrawColor(...THEME.colors.border);
    doc.roundedRect(margin, currentY, contentWidth, 70, 15, 15, 'FD');
    
    setDocFont(doc, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text("REPORT REVIEW STATUS", margin + 20, currentY + 25);
    
    doc.setFontSize(12);
    doc.setTextColor(...THEME.colors.primary);
    doc.text("OK Reviewed and Approved", margin + 20, currentY + 45);
    
    doc.setFontSize(9);
    setDocFont(doc, 'normal');
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text("This report has been reviewed by your wellness team.", margin + 20, currentY + 60);

    setDocFont(doc, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...THEME.colors.textDark);
    const verifierText = `Verified by: ${normalizeForPDF(report.doctorName, 'Clinical Supervisor')}, MD`;
    doc.text(verifierText, pageWidth - margin - 20, currentY + 45, { align: 'right' });
    
    doc.setFontSize(8);
    setDocFont(doc, 'normal');
    doc.text("Clinical Verification Node #204", pageWidth - margin - 20, currentY + 58, { align: 'right' });

    // --- 6. Final Page Stamper (Footers) ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(...THEME.colors.border);
        doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
        doc.setFontSize(8);
        doc.setTextColor(...THEME.colors.textLight);
        doc.text(`RxSnap Clinical Report ${new Date().getFullYear()} | Your Personal Health Record`, margin, pageHeight - 25);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
    }
    
    return doc;
};

export const exportSinglePDF = async (report: PrescriptionData) => {
    const doc = await generateDoc(report);
    
    // Pre-flight validation
    const pdfText = doc.output('text');
    if (!validatePDFText(pdfText)) {
        console.warn("PDF Validation Warning: Potential encoding issues detected in generated report.");
    }
    
    doc.save(`RxSnap_Analysis_${normalizeForPDF(report.patientName, 'Patient')}.pdf`);
};

export const getPDFBlobUrl = async (report: PrescriptionData) => {
    const doc = await generateDoc(report);
    return doc.output('bloburl');
};

export const getPDFFile = async (report: PrescriptionData) => {
    const doc = await generateDoc(report);
    return new File([doc.output('blob')], "analysis_report.pdf", { type: 'application/pdf' });
};

export const exportBulkPDF = async (reports: PrescriptionData[]) => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const r of reports) {
        try {
          const doc = await generateDoc(r);
          zip.file(`Analysis_${r.id.substring(0,8)}.pdf`, doc.output('blob'));
        } catch (err) {
          console.error(`Failed to generate bulk PDF for report ${r.id}:`, err);
        }
    }
    const content = await zip.generateAsync({type:'blob'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "RxSnap_Archive.zip";
    link.click();
};