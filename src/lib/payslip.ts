import { jsPDF } from 'jspdf';

export interface PayslipData {
  employeeName: string;
  employeeId: string;
  position: string;
  department: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  grossSalary: number;
  netSalary: number;
  status: string;
  paymentDate?: string;
}

export function generatePayslipPDF(data: PayslipData) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYSLIP', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Employee Management System', pageWidth / 2, yPosition, { align: 'center' });

  // Divider line
  yPosition += 8;
  pdf.setDrawColor(100, 100, 100);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);

  // Employee Info Section
  yPosition += 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE INFORMATION', margin, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${data.employeeName}`, margin, yPosition);
  pdf.text(`Employee ID: ${data.employeeId}`, pageWidth / 2, yPosition);

  yPosition += 6;
  pdf.text(`Position: ${data.position}`, margin, yPosition);
  pdf.text(`Department: ${data.department}`, pageWidth / 2, yPosition);

  yPosition += 6;
  pdf.text(`Pay Period: ${data.month} ${data.year}`, margin, yPosition);
  pdf.text(`Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`, pageWidth / 2, yPosition);

  if (data.paymentDate) {
    yPosition += 6;
    pdf.text(`Payment Date: ${data.paymentDate}`, margin, yPosition);
  }

  // Salary Details Section
  yPosition += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text('SALARY DETAILS', margin, yPosition);

  // Table header for salary breakdown
  yPosition += 8;
  pdf.setFillColor(41, 128, 185);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);

  const col1 = margin;
  const col2 = pageWidth / 2;

  pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6, 'F');
  pdf.text('Description', col1 + 2, yPosition);
  pdf.text('Amount', col2 + 2, yPosition);

  yPosition += 8;
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');

  // Basic Salary
  pdf.text('Basic Salary', col1 + 2, yPosition);
  pdf.text(`$${data.basicSalary.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);

  // Allowances
  yPosition += 6;
  const allowancesTotal = Object.values(data.allowances).reduce((a, b) => a + b, 0);
  if (allowancesTotal > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('ALLOWANCES', col1 + 2, yPosition);
    
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    Object.entries(data.allowances).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').toUpperCase();
      pdf.text(`  ${label}`, col1 + 4, yPosition);
      pdf.text(`$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);
      yPosition += 5;
    });
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('  Total Allowances', col1 + 4, yPosition);
    pdf.text(`$${allowancesTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);
  }

  // Deductions
  yPosition += 8;
  const deductionsTotal = Object.values(data.deductions).reduce((a, b) => a + b, 0);
  if (deductionsTotal > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('DEDUCTIONS', col1 + 2, yPosition);
    
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    Object.entries(data.deductions).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').toUpperCase();
      pdf.text(`  ${label}`, col1 + 4, yPosition);
      pdf.text(`$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);
      yPosition += 5;
    });
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('  Total Deductions', col1 + 4, yPosition);
    pdf.text(`$${deductionsTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);
  }

  // Summary Section
  yPosition += 12;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 18, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GROSS SALARY', col1 + 2, yPosition);
  pdf.text(`$${data.grossSalary.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);

  yPosition += 7;
  pdf.text('TOTAL DEDUCTIONS', col1 + 2, yPosition);
  pdf.text(`$${deductionsTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);

  yPosition += 7;
  pdf.setFillColor(41, 128, 185);
  pdf.setTextColor(255, 255, 255);
  pdf.text('NET SALARY', col1 + 2, yPosition);
  pdf.text(`$${data.netSalary.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, col2 + 2, yPosition);

  // Footer
  yPosition = pageHeight - 25;
  pdf.setDrawColor(100, 100, 100);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 8;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is an automated payslip. No signature required.', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 4;
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });

  // Download
  const filename = `Payslip_${data.employeeName.replace(/\s+/g, '_')}_${data.month}_${data.year}.pdf`;
  pdf.save(filename);
}
