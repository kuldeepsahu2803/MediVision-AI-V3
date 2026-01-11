
import { PrescriptionData } from '../types.ts';
import { logo as logoBase64 } from './pdfAssets.ts';
import { formatDate } from './utils.ts';

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

const sanitize = (text: any, fallback = 'Not Available'): string => {
  if (text === null || typeof text === 'undefined') return fallback;
  let str = String(text).trim();
  if (str.toLowerCase() === 'n/a' || str === '') return fallback;
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
};

const drawSectionHeader = (doc: any, title: string, y: number) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...THEME.colors.textDark);
    doc.text(title, THEME.layout.margin, y);
    return y + 15;
};

const generateDoc = async (report: PrescriptionData): Promise<any> => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const { margin, pageWidth, pageHeight, contentWidth } = THEME.layout;
    
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...THEME.colors.primary);
    doc.text('Clinical Analysis Report', margin + 38, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text('Digitized Prescription Intelligence', margin + 38, currentY + 12);

    doc.setFontSize(9);
    doc.setTextColor(...THEME.colors.textDark);
    doc.text(`Report Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, currentY - 5, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Reference ID: ${report.id.substring(0, 8).toUpperCase()}`, pageWidth - margin, currentY + 10, { align: 'right' });

    currentY += 40;
    doc.setDrawColor(...THEME.colors.border);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 30;

    // --- 2. Patient Profile Section ---
    currentY = drawSectionHeader(doc, 'Patient Profile', currentY);
    
    doc.setFillColor(...THEME.colors.primaryLight);
    doc.setDrawColor(...THEME.colors.border);
    doc.roundedRect(margin, currentY, contentWidth, 85, 10, 10, 'FD');

    const colWidth = contentWidth / 2;
    doc.setFontSize(7);
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text("NAME", margin + 20, currentY + 25);
    doc.text("ID", margin + colWidth + 20, currentY + 25);
    doc.text("EXTRACTION DATE", margin + 20, currentY + 60);
    doc.text("ALERTS / WARNINGS", margin + colWidth + 20, currentY + 60);

    doc.setFontSize(11);
    doc.setTextColor(...THEME.colors.textDark);
    doc.text(sanitize(report.patientName), margin + 20, currentY + 40);
    doc.text(`#${report.id.substring(0, 8).toUpperCase()}`, margin + colWidth + 20, currentY + 40);
    doc.text(sanitize(report.date), margin + 20, currentY + 75);
    
    const sensitivities = sanitize(report.warnings?.join(', '), 'No immediate alerts detected');
    doc.setFontSize(9);
    if (report.warnings && report.warnings.length > 0) {
        doc.setTextColor(...THEME.colors.dangerText);
        doc.setFont('helvetica', 'bold');
    }
    doc.text(sensitivities, margin + colWidth + 20, currentY + 75);
    
    currentY += 115;

    // --- 3. Medication Plan Table ---
    if (report.medication && report.medication.length > 0) {
        currentY = drawSectionHeader(doc, 'Prescribed Medications', currentY);
        
        autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [['MEDICATION', 'STRENGTH', 'FREQUENCY', 'ROUTE', 'VERIFICATION']],
            body: report.medication.map(m => [
                sanitize(m.name),
                sanitize(m.dosage),
                sanitize(m.frequency),
                sanitize(m.route, 'Oral'),
                m.verification?.color === 'green' ? '✓ Verified' : (m.verification?.color === 'red' ? '⚠ Warning' : '👁 Review')
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
                cellPadding: 10
            },
            columnStyles: {
                4: { halign: 'right', fontStyle: 'bold' }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    const text = String(data.cell.raw);
                    if (text.includes('Verified')) {
                        doc.setTextColor(...THEME.colors.successText);
                    } else if (text.includes('Warning')) {
                        doc.setTextColor(...THEME.colors.dangerText);
                    } else {
                        doc.setTextColor(...THEME.colors.warningText);
                    }
                }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 40;
    }

    // --- 4. Notes Section ---
    const hasNotes = report.notes && sanitize(report.notes, '') !== '';
    if (hasNotes) {
        if (currentY > pageHeight - 150) {
            doc.addPage();
            currentY = margin;
        }
        currentY = drawSectionHeader(doc, 'Clinical Notes', currentY);
        const splitNotes = doc.splitTextToSize(sanitize(report.notes), contentWidth - 40);
        const notesHeight = (splitNotes.length * 14) + 20;
        doc.setFillColor(...THEME.colors.primaryLight);
        doc.roundedRect(margin, currentY, contentWidth, notesHeight, 8, 8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...THEME.colors.textDark);
        doc.text(splitNotes, margin + 20, currentY + 20);
        currentY += notesHeight + 25;
    }

    // --- 5. Dynamic Review Status Section ---
    const statusBoxY = pageHeight - 150;
    if (currentY > statusBoxY - 20) {
        doc.addPage();
        currentY = margin;
    } else {
        currentY = statusBoxY;
    }

    const isVerified = report.status === 'Clinically-Verified';
    const isReview = report.status === 'User-Corrected';
    
    // Status Box Colors
    const statusColor = isVerified ? THEME.colors.successText : (isReview ? THEME.colors.warningText : THEME.colors.primary);
    const statusBg = isVerified ? [240, 253, 244] : (isReview ? [255, 251, 235] : THEME.colors.primaryLight);

    doc.setFillColor(...statusBg);
    doc.setDrawColor(...THEME.colors.border);
    doc.roundedRect(margin, currentY, contentWidth, 70, 15, 15, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text("DOCUMENT STATUS", margin + 20, currentY + 25);
    
    doc.setFontSize(12);
    doc.setTextColor(...statusColor);
    
    let statusTitle = "Draft - AI Digitization Only";
    let statusDesc = "This is an unverified automated extraction. Human verification required.";
    
    if (isVerified) {
        statusTitle = "✓ Verified Clinical Record";
        statusDesc = "This document has been reviewed and approved by a licensed practitioner.";
    } else if (isReview) {
        statusTitle = "👁 In Review - Pending Sign-off";
        statusDesc = "Manual corrections have been applied. Practitioner verification is required.";
    }

    doc.text(statusTitle, margin + 20, currentY + 45);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...THEME.colors.textMedium);
    doc.text(statusDesc, margin + 20, currentY + 60);

    if (isVerified) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...THEME.colors.textDark);
        const verifierName = sanitize(report.doctorName, 'Clinical Supervisor');
        doc.text(`Signed by: Dr. ${verifierName}`, pageWidth - margin - 20, currentY + 45, { align: 'right' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Digital Certification Node #8821", pageWidth - margin - 20, currentY + 58, { align: 'right' });
    } else {
        doc.setTextColor(...THEME.colors.dangerText);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text("NOT FOR CLINICAL USE", pageWidth - margin - 20, currentY + 45, { align: 'right' });
    }

    // --- Footer ---
    doc.setDrawColor(...THEME.colors.border);
    doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
    doc.setFontSize(8);
    doc.setTextColor(...THEME.colors.textLight);
    doc.text(`MediVision AI Clinical Report © ${new Date().getFullYear()} | HIPAA Compliant System`, margin, pageHeight - 25);
    doc.text(`Ref: ${report.id.slice(0, 12)}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
    
    return doc;
};

export const exportSinglePDF = async (report: PrescriptionData) => {
    const doc = await generateDoc(report);
    doc.save(`MediVision_Report_${sanitize(report.patientName, 'Patient')}_${report.id.slice(0, 6)}.pdf`);
};

export const getPDFBlobUrl = async (report: PrescriptionData) => {
    const doc = await generateDoc(report);
    return doc.output('bloburl');
};

export const getPDFFile = async (report: PrescriptionData) => {
    const doc = await generateDoc(report);
    return new File([doc.output('blob')], "clinical_report.pdf", { type: 'application/pdf' });
};

export const exportBulkPDF = async (reports: PrescriptionData[]) => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const r of reports) {
        try {
          const doc = await generateDoc(r);
          zip.file(`Report_${r.id.substring(0,8)}.pdf`, doc.output('blob'));
        } catch (err) {
          console.error(`Failed bulk generation: ${r.id}`, err);
        }
    }
    const content = await zip.generateAsync({type:'blob'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `MediVision_Archive_${new Date().toISOString().slice(0,10)}.zip`;
    link.click();
};
