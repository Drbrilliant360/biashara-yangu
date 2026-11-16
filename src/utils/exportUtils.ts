
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveBlob, escapeHtml } from '@/lib/saveFile';
import { Shop } from '@/types';

// Add type declaration for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Generic type for data that can be exported
export type ExportableData = Array<Record<string, any>>;

// Format current date and time
const getCurrentDateTime = () => {
  return new Date().toLocaleString();
};

// Function to export data to Excel
export const exportToExcel = async (data: ExportableData, fileName: string, shopName: string) => {
  // Create worksheet
  // 3-row business header first, then the data table starting at A4 (so nothing is overwritten)
  const worksheet = XLSX.utils.aoa_to_sheet([
    [`Business: ${shopName}`],
    [`Date: ${getCurrentDateTime()}`],
    [],
  ]);
  XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A4' });

  // Adjust column widths
  const columnWidths = data.reduce((widths, row) => {
    Object.keys(row).forEach(key => {
      const value = String(row[key]);
      widths[key] = Math.max(widths[key] || 10, Math.min(50, value.length + 2));
    });
    return widths;
  }, {} as Record<string, number>);
  
  worksheet['!cols'] = Object.keys(columnWidths).map(key => ({ wch: columnWidths[key] }));
  
  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  // Generate Excel file and save
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const excelData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  await saveBlob(excelData, `${fileName}.xlsx`);
};

// Function to export data to PDF
export const exportToPDF = async (data: ExportableData, fileName: string, shopName: string, title: string) => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Add business name and date/time
  doc.setFontSize(16);
  doc.text(shopName, 15, 15);
  doc.setFontSize(12);
  doc.text(title, 15, 25);
  doc.text(`Date: ${getCurrentDateTime()}`, 15, 35);
  
  // Create table
  const tableColumn = Object.keys(data[0] || {});
  const tableRows = data.map(item => Object.values(item));
  
  // Add table to document
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    margin: { top: 40 },
    styles: { overflow: 'linebreak' },
    headStyles: { fillColor: [41, 128, 185], fontSize: 12 },
  });
  
  // Save the PDF
  await saveBlob(doc.output('blob'), `${fileName}.pdf`);
};

// Function to export data to Word (DOCX)
export const exportToWord = async (data: ExportableData, fileName: string, shopName: string, title: string) => {
  // Create HTML content for Word document
  let htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(shopName)}</h1>
        <h2>${escapeHtml(title)}</h2>
        <p>Date: ${getCurrentDateTime()}</p>
        <table>
          <thead>
            <tr>
  `;
  
  // Add table headers
  const headers = Object.keys(data[0] || {});
  headers.forEach(header => {
    htmlContent += `<th>${escapeHtml(header)}</th>`;
  });
  
  htmlContent += '</tr></thead><tbody>';
  
  // Add table rows
  data.forEach(row => {
    htmlContent += '<tr>';
    Object.values(row).forEach(value => {
      htmlContent += `<td>${escapeHtml(value)}</td>`;
    });
    htmlContent += '</tr>';
  });
  
  htmlContent += '</tbody></table></body></html>';
  
  // Convert to Blob
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  await saveBlob(blob, `${fileName}.doc`);
};

// Format data for export based on report type
export const formatDataForExport = (
  data: any[], 
  reportType: string,
  formatCurrency: (amount: number) => string
) => {
  switch (reportType) {
    case 'sales':
      return data.map(item => ({
        Date: item.displayDate,
        Revenue: formatCurrency(item.revenue),
        Transactions: item.transactions
      }));
    case 'products':
      return data.map(item => ({
        Product: item.name,
        'Quantity Sold': item.quantity,
        Revenue: formatCurrency(item.revenue)
      }));
    case 'inventory':
      return data.map(item => ({
        Product: item.name,
        'Stock Quantity': item.stockQuantity,
        Price: formatCurrency(item.price || 0)
      }));
    case 'quotations':
      return data.map(item => ({
        'SL No.': item.id,
        'Part Number': item.partNumber,
        Description: item.description || '',
        Brand: item.brand || 'N/A',
        Quantity: item.quantity,
        Rate: formatCurrency(item.rate || 0),
        Amount: formatCurrency(item.amount || 0),
        'VAT %': `${item.vatPercentage ?? 0}%`,
        'VAT Amount': formatCurrency(item.vatAmount || 0),
        'Total Amount': formatCurrency(item.totalAmount || 0)
      }));
    default:
      return data;
  }
};
