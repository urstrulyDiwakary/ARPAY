import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types';

export function exportInvoiceToPDF(invoice: Invoice): void {
  try {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241); // Primary color
    doc.text('ARPAY', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Financial Management System', 20, 26);

    // Invoice Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 150, 20);

    // Invoice Details Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(130, 25, 65, 35, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Invoice ID:', 135, 32);
    doc.text('Date:', 135, 38);
    doc.text('Due Date:', 135, 44);
    doc.text('Status:', 135, 50);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.id || 'N/A', 165, 32);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceDate || 'N/A', 165, 38);
    doc.text(invoice.dueDate || 'N/A', 165, 44);

    // Status with color
    const statusColors: Record<string, [number, number, number]> = {
      Paid: [34, 197, 94],
      Pending: [245, 158, 11],
      Overdue: [239, 68, 68],
    };
    const statusColor = statusColors[invoice.status] || [100, 100, 100];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.status || 'Pending', 165, 50);

    // Customer Info Section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('BILL TO:', 20, 40);

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customerName || 'N/A', 20, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Phone: ${invoice.customerPhone || 'N/A'}`, 20, 54);

    // Project Name
    if (invoice.projectName) {
      doc.setTextColor(100, 100, 100);
      doc.text('Project:', 20, 60);
      doc.setTextColor(0, 0, 0);
      doc.text(invoice.projectName, 38, 60);
    }

    // Invoice Type Badge
    const typeColors: Record<string, [number, number, number]> = {
      Project: [59, 130, 246],
      Customer: [139, 92, 246],
      Expense: [249, 115, 22],
    };
    const color = typeColors[invoice.invoiceType] || [100, 100, 100];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(20, 67, 28, 7, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceType || 'Customer', 34, 72, { align: 'center' });

    // Line Items Table
    doc.setFont('helvetica', 'normal');
    const lineItems = invoice.lineItems || [];

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const tableData = lineItems.map((item, index) => {
      const row: any[] = [
        (index + 1).toString(),
        item.description || 'Item',
        item.plotNo || '-',
        item.cents ? item.cents.toFixed(2) : '-',
        item.pricePerCent ? formatCurrency(item.pricePerCent) : '-',
        formatCurrency(item.totalAmount || 0),
        formatCurrency(item.discount || 0),
        formatCurrency(item.finalAmount || 0),
      ];
      return row;
    });

    autoTable(doc, {
    startY: 80,
    head: [['#', 'Description', 'Plot No', 'Cents', 'Price/Cent', 'Total', 'Discount', 'Final Amt']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
  });
  
  // Get position after table
  let finalY = (doc as any).lastAutoTable.finalY || 120;

  // Grand Total Section
  doc.setDrawColor(200, 200, 200);
  doc.line(130, finalY + 5, 195, finalY + 5);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Grand Total:', 135, finalY + 12);

  doc.setFontSize(14);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  const grandTotal = `Rs. ${invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  doc.text(grandTotal, 190, finalY + 12, { align: 'right' });

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(130, finalY + 15, 195, finalY + 15);

  finalY += 20;

  // Payment Details Section
  if (invoice.tokenAmount > 0 || invoice.agreementDueAmount > 0 || invoice.registrationDueAmount > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('PAYMENT DETAILS', 20, finalY);

    finalY += 5;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.3);
    doc.line(20, finalY, 80, finalY);

    finalY += 8;

    // Payment breakdown
    const paymentData: any[] = [];

    const formatAmount = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (invoice.tokenAmount > 0) {
      paymentData.push([
        'Token Amount',
        formatAmount(invoice.tokenAmount),
        'Paid',
        '-'
      ]);
    }

    if (invoice.agreementDueAmount > 0) {
      paymentData.push([
        'Agreement Payment',
        formatAmount(invoice.agreementDueAmount),
        'Due',
        invoice.agreementDueDate || '-'
      ]);
    }

    if (invoice.registrationDueAmount > 0) {
      paymentData.push([
        'Registration Payment',
        formatAmount(invoice.registrationDueAmount),
        'Due',
        invoice.registrationDueDate || '-'
      ]);
    }

    // Calculate balance
    const totalPaid = invoice.tokenAmount;
    const totalDue = invoice.agreementDueAmount + invoice.registrationDueAmount;
    const balance = invoice.totalAmount - totalPaid - totalDue;

    if (paymentData.length > 0) {
      autoTable(doc, {
        startY: finalY,
        head: [['Payment Type', 'Amount', 'Status', 'Due Date']],
        body: paymentData,
        theme: 'grid',
        headStyles: {
          fillColor: [139, 92, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' },
        },
      });

      finalY = (doc as any).lastAutoTable.finalY || finalY + 30;

      // Payment Summary Box
      finalY += 5;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(20, finalY, 175, 25, 3, 3, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      const summaryY = finalY + 7;
      doc.text('Total Amount:', 25, summaryY);
      doc.text('Token Paid:', 25, summaryY + 6);
      doc.text('Pending Payments:', 25, summaryY + 12);

      doc.setTextColor(0, 0, 0);
      doc.text(formatAmount(invoice.totalAmount), 70, summaryY);
      doc.text(formatAmount(totalPaid), 70, summaryY + 6);
      doc.text(formatAmount(totalDue), 70, summaryY + 12);

      // Balance
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Balance Remaining:', 120, summaryY + 9);
      doc.setFontSize(12);
      doc.setTextColor(balance > 0 ? 239 : 34, balance > 0 ? 68 : 197, balance > 0 ? 68 : 94);
      doc.text(formatAmount(Math.abs(balance)), 190, summaryY + 9, { align: 'right' });

      finalY += 30;
    }
  }

  // Attachments Section
  if (invoice.attachments && invoice.attachments.length > 0) {
    finalY += 5;

    // Check if we need a new page
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('ATTACHMENTS', 20, finalY);

    finalY += 3;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.3);
    doc.line(20, finalY, 70, finalY);

    finalY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    invoice.attachments.forEach((attachment, index) => {
      const icon = attachment.type === 'image' ? '🖼️' : attachment.type === 'pdf' ? '📄' : '📎';
      doc.text(`${index + 1}. ${icon} ${attachment.name}`, 25, finalY);
      finalY += 5;
    });
  }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Generated by ARPAY - Financial Management System', 105, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 105, pageHeight - 10, { align: 'center' });

    // Save the PDF
    const filename = `invoice-${invoice.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    console.log('PDF generated successfully:', filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
