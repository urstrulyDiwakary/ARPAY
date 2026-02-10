import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Expense } from '@/types';

export const generateExpensePDF = (expense: Expense, expenseNumber: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Professional Colors matching the reference
  const headerBlue = [41, 98, 255]; // Bright professional blue
  const darkText = [0, 0, 0]; // Black
  const grayText = [100, 100, 100]; // Gray
  const lightGrayBg = [250, 250, 250]; // Very light gray
  const tableHeaderBg = [240, 248, 255]; // Light blue background
  const borderGray = [200, 200, 200]; // Border gray

  // ========== HEADER SECTION ==========
  // Company Name/Logo area
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(headerBlue[0], headerBlue[1], headerBlue[2]);
  doc.text('ARPAY', margin, yPosition + 8);

  // Company subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Professional Expense Management System', margin, yPosition + 14);

  // EXPENSE BILL title on right
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('EXPENSE BILL', pageWidth - margin - 65, yPosition + 8);

  yPosition += 20;

  // Horizontal line
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 8;

  // ========== COMPANY & BILL INFO SECTION ==========
  // Left side - Company Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('ARPAY Systems Pvt Ltd', margin, yPosition);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Professional Expense Management', margin, yPosition + 5);
  doc.text('Hyderabad, Telangana, India', margin, yPosition + 9);
  doc.text('Email: support@arpay.com', margin, yPosition + 13);
  doc.text('Phone: +91 1234567890', margin, yPosition + 17);

  // Right side - Expense Info Box
  const infoBoxX = pageWidth - margin - 70;
  const infoBoxY = yPosition - 2;
  const infoBoxWidth = 70;

  // Draw info box border
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(infoBoxX, infoBoxY, infoBoxWidth, 26);

  // Expense No
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.rect(infoBoxX, infoBoxY, infoBoxWidth, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('EXPENSE NO:', infoBoxX + 2, infoBoxY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(headerBlue[0], headerBlue[1], headerBlue[2]);
  doc.text(expenseNumber, infoBoxX + 2, infoBoxY + 13);

  // Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('DATE:', infoBoxX + 2, infoBoxY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(expense.date, infoBoxX + 2, infoBoxY + 23);

  yPosition += 32;

  // ========== EXPENSE DETAILS TABLE ==========
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('EXPENSE DETAILS', margin, yPosition);

  yPosition += 2;

  // Create expense details table using autoTable
  const tableData = [
    ['Category', capitalizeText(expense.category)],
    ['Payment Mode', expense.paymentMode ? capitalizeText(expense.paymentMode) : 'N/A'],
    ['Status', capitalizeText(expense.status)],
  ];

  if (expense.projectName) {
    tableData.push(['Project Name', expense.projectName]);
  }

  if (expense.property) {
    tableData.push(['Property', expense.property]);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [borderGray[0], borderGray[1], borderGray[2]],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]],
      textColor: [darkText[0], darkText[1], darkText[2]],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: [grayText[0], grayText[1], grayText[2]] },
      1: { cellWidth: contentWidth - 50, textColor: [darkText[0], darkText[1], darkText[2]] },
    },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // ========== AMOUNT SECTION ==========
  // Amount box on the right
  const amountBoxX = pageWidth - margin - 70;
  const amountBoxY = yPosition - 8;
  const amountBoxWidth = 70;
  const amountBoxHeight = 20;

  // Draw amount box
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.5);
  doc.rect(amountBoxX, amountBoxY, amountBoxWidth, amountBoxHeight);

  // Amount header
  doc.setFillColor(headerBlue[0], headerBlue[1], headerBlue[2]);
  doc.rect(amountBoxX, amountBoxY, amountBoxWidth, 7, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT', amountBoxX + 2, amountBoxY + 5);

  // Amount value
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(headerBlue[0], headerBlue[1], headerBlue[2]);
  doc.text(`₹ ${expense.amount.toLocaleString('en-IN')}`, amountBoxX + 2, amountBoxY + 15);

  yPosition += 5;

  // ========== NOTES SECTION ==========
  if (expense.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text('NOTES & REMARKS', margin, yPosition);

    yPosition += 5;

    // Notes box
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.3);
    doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);

    const notesHeight = Math.max(15, Math.min(30, expense.notes.length / 5));
    doc.rect(margin, yPosition, contentWidth, notesHeight, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);

    const notesLines = doc.splitTextToSize(expense.notes, contentWidth - 4);
    doc.text(notesLines, margin + 2, yPosition + 4);

    yPosition += notesHeight + 8;
  }

  // ========== ATTACHMENTS SECTION ==========
  if (expense.attachments && expense.attachments.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(`ATTACHMENTS (${expense.attachments.length})`, margin, yPosition);

    yPosition += 2;

    const attachmentData = expense.attachments.map((att, index) => [
      (index + 1).toString(),
      att.name,
      formatFileSize(att.size),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'File Name', 'Size']],
      body: attachmentData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [borderGray[0], borderGray[1], borderGray[2]],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]],
        textColor: [darkText[0], darkText[1], darkText[2]],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: contentWidth - 30 },
        2: { cellWidth: 20, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========== FOOTER SECTION ==========
  const footerY = pageHeight - 50;

  // Signature section FIRST
  const signatureY = footerY;

  // Prepared by
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Prepared By:', margin, signatureY);
  doc.setLineWidth(0.3);
  doc.line(margin, signatureY + 8, margin + 40, signatureY + 8);
  doc.setFontSize(7);
  doc.text('Signature & Date', margin + 2, signatureY + 11);

  // Approved by
  doc.text('Approved By:', pageWidth - margin - 40, signatureY);
  doc.line(pageWidth - margin - 40, signatureY + 8, pageWidth - margin, signatureY + 8);
  doc.text('Signature & Date', pageWidth - margin - 38, signatureY + 11);

  // Terms and conditions box AFTER signatures
  const termsY = signatureY + 18;

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, termsY, contentWidth, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('TERMS & CONDITIONS:', margin + 2, termsY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('1. This is a computer-generated expense bill and does not require a signature.', margin + 2, termsY + 8);
  doc.text('2. All expense claims should be supported by valid receipts and documentation.', margin + 2, termsY + 11);

  // Footer info at bottom
  const bottomY = pageHeight - 8;

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, bottomY - 2, pageWidth - margin, bottomY - 2);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);

  const timestamp = new Date().toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.text(`Generated: ${timestamp}`, margin, bottomY);
  doc.text(`Document: ${expenseNumber}`, pageWidth / 2 - 15, bottomY);
  doc.text('Page 1 of 1', pageWidth - margin - 15, bottomY);

  // Save PDF
  doc.save(`${expenseNumber}.pdf`);
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Helper function to capitalize text
const capitalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

