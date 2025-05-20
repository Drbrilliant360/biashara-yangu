
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Shop } from '@/types';

// Generic type for data that can be exported
export type ExportableData = Array<Record<string, any>>;

// Format current date and time
const getCurrentDateTime = () => {
  return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
};

// Function to export data to Excel
export const exportToExcel = (data: ExportableData, fileName: string, shopName: string) => {
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add header with business name and date
  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Business: ${shopName}`],
    [`Date: ${getCurrentDateTime()}`],
    [] // Empty row
  ], { origin: 'A1' });
  
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
  saveAs(excelData, `${fileName}.xlsx`);
};

// Function to export data to PDF
export const exportToPDF = (data: ExportableData, fileName: string, shopName: string, title: string) => {
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
  doc.save(`${fileName}.pdf`);
};

// Function to export data to Word (DOCX)
export const exportToWord = (data: ExportableData, fileName: string, shopName: string, title: string) => {
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
        <h1>${shopName}</h1>
        <h2>${title}</h2>
        <p>Date: ${getCurrentDateTime()}</p>
        <table>
          <thead>
            <tr>
  `;
  
  // Add table headers
  const headers = Object.keys(data[0] || {});
  headers.forEach(header => {
    htmlContent += `<th>${header}</th>`;
  });
  
  htmlContent += '</tr></thead><tbody>';
  
  // Add table rows
  data.forEach(row => {
    htmlContent += '<tr>';
    Object.values(row).forEach(value => {
      htmlContent += `<td>${value}</td>`;
    });
    htmlContent += '</tr>';
  });
  
  htmlContent += '</tbody></table></body></html>';
  
  // Convert to Blob
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  saveAs(blob, `${fileName}.doc`);
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
    default:
      return data;
  }
};
